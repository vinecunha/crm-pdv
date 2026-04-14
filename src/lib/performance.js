class PerformanceMonitor {
  constructor() {
    this.metrics = []
    this.isEnabled = import.meta.env.PROD // Só em produção
  }

  // Medir tempo de carregamento
  measurePageLoad() {
    if (!this.isEnabled) return
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const loadTime = entry.loadEventEnd - entry.startTime
          console.log(`📊 Page Load: ${loadTime.toFixed(0)}ms`)
          
          // Salvar no localStorage para análise
          this.saveMetric('page_load', loadTime)
        }
      }
    })
    
    observer.observe({ type: 'navigation', buffered: true })
  }

  // Medir tempo de queries React Query
  measureQuery(queryKey, duration) {
    if (!this.isEnabled) return
    
    if (duration > 1000) {
      console.warn(`⚠️ Query lenta [${queryKey}]: ${duration}ms`)
    }
    
    this.saveMetric('query_duration', duration, { queryKey })
  }

  // Medir tempo de clique (FID)
  measureFirstInputDelay() {
    if (!this.isEnabled) return
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime
        console.log(`📊 First Input Delay: ${fid.toFixed(0)}ms`)
        this.saveMetric('fid', fid)
      }
    })
    
    observer.observe({ type: 'first-input', buffered: true })
  }

  // Salvar métrica
  saveMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      metadata,
      url: window.location.pathname,
      timestamp: new Date().toISOString()
    }
    
    // Salvar no localStorage (últimas 100 métricas)
    const stored = JSON.parse(localStorage.getItem('perf_metrics') || '[]')
    stored.push(metric)
    if (stored.length > 100) stored.shift()
    localStorage.setItem('perf_metrics', JSON.stringify(stored))
    
    // Se for muito lento, alertar
    if (value > 3000) {
      console.error(`🚨 ALERTA: ${name} demorou ${value}ms!`)
    }
  }

  // Obter relatório
  getReport() {
    const stored = JSON.parse(localStorage.getItem('perf_metrics') || '[]')
    
    const report = {
      total: stored.length,
      avgPageLoad: this.calculateAvg(stored.filter(m => m.name === 'page_load')),
      avgQueryDuration: this.calculateAvg(stored.filter(m => m.name === 'query_duration')),
      slowQueries: stored.filter(m => m.name === 'query_duration' && m.value > 1000),
      worstPageLoad: Math.max(...stored.filter(m => m.name === 'page_load').map(m => m.value))
    }
    
    return report
  }

  calculateAvg(metrics) {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  }

  // Limpar métricas
  clearMetrics() {
    localStorage.removeItem('perf_metrics')
  }
}

export const perfMonitor = new PerformanceMonitor()
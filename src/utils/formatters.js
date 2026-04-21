const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

// Detecta automaticamente o timezone do sistema (Windows, etc)
export const getSystemTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

// Permite escolher: sistema ou fixo (Brasília)
const resolveTimeZone = (useSystem = true) => {
  return useSystem ? getSystemTimeZone() : DEFAULT_TIMEZONE
}

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value ?? 0)
}

export const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value ?? 0)
}

export const formatDate = (date, useSystemTimeZone = true) => {
  if (!date) return ''

  // Se for string no formato YYYY-MM-DD, trata como data local
  let dateObj
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-')
    dateObj = new Date(year, month - 1, day)
  } else {
    dateObj = new Date(date)
  }

  if (!isValidDate(dateObj)) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: resolveTimeZone(useSystemTimeZone)
  }).format(dateObj)
}

export const formatDateTime = (date, useSystemTimeZone = true) => {
  if (!date) return ''

  let dateObj
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    // Se for string YYYY-MM-DD (com ou sem hora)
    const parts = date.split('T')
    const [year, month, day] = parts[0].split('-')
    if (parts[1]) {
      // Tem hora
      dateObj = new Date(date)
    } else {
      // Só data
      dateObj = new Date(year, month - 1, day)
    }
  } else {
    dateObj = new Date(date)
  }

  if (!isValidDate(dateObj)) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: resolveTimeZone(useSystemTimeZone),
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(dateObj)
}

// Retorna data em formato ISO (sempre seguro para backend)
export const toISO = (date) => {
  if (!date) return null
  return new Date(date).toISOString()
}

// Validação simples de data
export const isValidDate = (date) => {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d)
}

// Formata data sem timezone (útil para inputs type="date")
export const toDateInputValue = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (!isValidDate(d)) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
} 

export const formatRelativeTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) return 'agora mesmo'
  if (diffMin < 60) return `${diffMin} min atrás`
  if (diffHour < 24) return `${diffHour} h atrás`
  if (diffDay === 1) return 'ontem'
  if (diffDay < 7) return `${diffDay} dias atrás`
  
  return formatDate(date)
}
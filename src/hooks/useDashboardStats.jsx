import { useMemo } from 'react'

export const useDashboardStats = (rawData) => {
  return useMemo(() => {
    // ✅ Verificar se rawData existe
    if (!rawData) {
      return {
        primaryStats: [],
        secondaryStats: [],
        recentSales: [],
        topProducts: [],
        chartData: { labels: [], datasets: [] },
        hasData: false,
        lastUpdated: new Date().toISOString()
      }
    }

    // ✅ Extrair dados da nova estrutura
    const sales = rawData.sales || []
    const topProducts = rawData.topProducts || []
    const totalCustomers = rawData.totalCustomers || 0
    
    // Datas de referência
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    // Inicializar vendas por dia
    const salesByDay = {}
    last7Days.forEach(date => {
      salesByDay[date.toISOString().split('T')[0]] = 0
    })

    // Filtrar vendas por período
    const salesToday = sales.filter(sale => new Date(sale.created_at) >= today)
    const salesYesterday = sales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate >= yesterday && saleDate < today
    })
    const salesThisMonth = sales.filter(sale => new Date(sale.created_at) >= startOfMonth)
    const salesLastMonth = sales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth
    })

    // Calcular totais
    const totalSalesToday = salesToday.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)
    const totalSalesYesterday = salesYesterday.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)
    const totalSalesMonth = salesThisMonth.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)
    const totalSalesLastMonth = salesLastMonth.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)

    // Vendas por dia para o gráfico
    salesThisMonth.forEach(sale => {
      const dateKey = new Date(sale.created_at).toISOString().split('T')[0]
      if (salesByDay[dateKey] !== undefined) {
        salesByDay[dateKey] += sale.final_amount || 0
      }
    })

    // Ticket médio
    const averageTicket = salesToday.length > 0 ? totalSalesToday / salesToday.length : 0
    const averageTicketYesterday = salesYesterday.length > 0 ? totalSalesYesterday / salesYesterday.length : 0

    // Variações percentuais
    const salesChange = totalSalesYesterday > 0 
      ? ((totalSalesToday - totalSalesYesterday) / totalSalesYesterday) * 100 
      : 0
    const monthChange = totalSalesLastMonth > 0
      ? ((totalSalesMonth - totalSalesLastMonth) / totalSalesLastMonth) * 100
      : 0
    const ticketChange = averageTicketYesterday > 0
      ? ((averageTicket - averageTicketYesterday) / averageTicketYesterday) * 100
      : 0

    // Vendas recentes
    const recentSales = sales.slice(0, 5).map(sale => ({
      id: sale.id,
      sale_number: sale.sale_number,
      customer: sale.customer_name || 'Cliente não identificado',
      amount: sale.final_amount || 0,
      payment_method: sale.payment_method,
      status: sale.status || 'completed',
      date: sale.created_at
    }))

    // Histórico para sparklines
    const salesHistory = Object.values(salesByDay)

    return {
      // Estatísticas principais
      primaryStats: [
        {
          id: 'sales-today',
          label: 'Vendas Hoje',
          value: totalSalesToday,
          icon: 'ShoppingCart',
          variant: salesChange >= 0 ? 'success' : 'danger',
          trend: salesChange,
          trendValue: `${Math.abs(salesChange).toFixed(1)}%`,
          sublabel: 'vs ontem',
          sparklineData: salesHistory,
          goal: totalSalesYesterday > 0 ? totalSalesYesterday * 1.2 : undefined
        },
        {
          id: 'sales-month',
          label: 'Vendas no Mês',
          value: totalSalesMonth,
          icon: 'TrendingUp',
          variant: monthChange >= 0 ? 'success' : 'danger',
          trend: monthChange,
          trendValue: `${Math.abs(monthChange).toFixed(1)}%`,
          sublabel: 'vs mês anterior',
          goal: totalSalesLastMonth > 0 ? totalSalesLastMonth * 1.1 : undefined
        },
        {
          id: 'average-ticket',
          label: 'Ticket Médio',
          value: averageTicket,
          icon: 'CreditCard',
          variant: ticketChange >= 0 ? 'success' : 'danger',
          trend: ticketChange,
          trendValue: `${Math.abs(ticketChange).toFixed(1)}%`,
          sublabel: 'vs ontem',
          goal: 100
        },
        {
          id: 'customers',
          label: 'Total de Clientes',
          value: totalCustomers,
          icon: 'Users',
          variant: 'info',
          trend: 5.2,
          trendValue: 'este mês'
        }
      ],
      
      // Estatísticas secundárias
      secondaryStats: [
        {
          id: 'products',
          label: 'Produtos Vendidos',
          value: topProducts.length,
          icon: 'Package',
          variant: 'info',
          compact: true
        },
        {
          id: 'revenue',
          label: 'Faturamento Total',
          value: totalSalesMonth,
          icon: 'DollarSign',
          variant: 'success',
          trend: monthChange,
          compact: true,
          blur: false
        }
      ],

      // Dados para listas e gráficos
      recentSales,
      topProducts,
      chartData: {
        labels: last7Days.map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
        datasets: [{
          label: 'Vendas (R$)',
          data: salesHistory,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      
      // Metadados
      lastUpdated: new Date().toISOString(),
      hasData: sales.length > 0
    }
  }, [rawData])
}
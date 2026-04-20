import { supabase } from '../lib/supabase'

/**
 * Buscar dados detalhados de um vendedor específico
 */
export const fetchSellerDetails = async (sellerId, viewerRole) => {
  // Verificar permissão
  if (viewerRole === 'operador') {
    throw new Error('Operadores não podem ver detalhes de outros vendedores')
  }
  
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  const startOfYear = new Date(today.getFullYear(), 0, 1)
  
  // Buscar perfil do vendedor
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sellerId)
    .single()
  
  if (profileError) throw profileError
  
  // Verificar se o viewer tem permissão
  if (viewerRole === 'gerente' && profile.role !== 'operador') {
    throw new Error('Gerentes só podem ver detalhes de operadores')
  }
  
  // Buscar todas as vendas do vendedor
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select(`
      id,
      sale_number,
      total_amount,
      discount_amount,
      final_amount,
      payment_method,
      status,
      created_at,
      customer_id,
      customer_name,
      items:sale_items(
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq('created_by', sellerId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
  
  if (salesError) throw salesError
  
  // Calcular métricas
  const metrics = calculateSellerMetrics(sales, thirtyDaysAgo, startOfYear, today)
  
  // Buscar produtos mais vendidos pelo vendedor
  const topProducts = await fetchSellerTopProducts(sellerId)
  
  // Buscar clientes atendidos
  const customersServed = await fetchSellerCustomers(sellerId)
  
  // Buscar desempenho diário (últimos 30 dias)
  const dailyPerformance = calculateDailyPerformance(sales, thirtyDaysAgo, today)
  
  // Buscar desempenho por hora
  const hourlyPerformance = calculateHourlyPerformance(sales)
  
  // Buscar desempenho por método de pagamento
  const paymentMethodPerformance = calculatePaymentMethodPerformance(sales)
  
  return {
    profile,
    sales: sales || [],
    metrics,
    topProducts,
    customersServed,
    dailyPerformance,
    hourlyPerformance,
    paymentMethodPerformance,
    period: {
      start: thirtyDaysAgo.toISOString(),
      end: today.toISOString()
    }
  }
}

/**
 * Calcular métricas do vendedor
 */
function calculateSellerMetrics(sales, thirtyDaysAgo, startOfYear, today) {
  const salesLast30Days = sales.filter(s => new Date(s.created_at) >= thirtyDaysAgo)
  const salesThisYear = sales.filter(s => new Date(s.created_at) >= startOfYear)
  
  const totalSales = sales.length
  const totalRevenue = sales.reduce((sum, s) => sum + s.final_amount, 0)
  const revenueLast30Days = salesLast30Days.reduce((sum, s) => sum + s.final_amount, 0)
  const revenueThisYear = salesThisYear.reduce((sum, s) => sum + s.final_amount, 0)
  
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
  const averageTicketLast30Days = salesLast30Days.length > 0 
    ? revenueLast30Days / salesLast30Days.length 
    : 0
  
  // Melhor dia de vendas
  const salesByDay = {}
  sales.forEach(sale => {
    const day = new Date(sale.created_at).toDateString()
    salesByDay[day] = (salesByDay[day] || 0) + sale.final_amount
  })
  
  const bestDay = Object.entries(salesByDay).sort((a, b) => b[1] - a[1])[0]
  
  // Maior venda
  const largestSale = sales.reduce((max, sale) => 
    sale.final_amount > (max?.final_amount || 0) ? sale : max, null)
  
  // Ticket médio por método de pagamento
  const ticketByPayment = {}
  const countByPayment = {}
  sales.forEach(sale => {
    const method = sale.payment_method || 'outro'
    ticketByPayment[method] = (ticketByPayment[method] || 0) + sale.final_amount
    countByPayment[method] = (countByPayment[method] || 0) + 1
  })
  
  Object.keys(ticketByPayment).forEach(method => {
    ticketByPayment[method] = ticketByPayment[method] / countByPayment[method]
  })
  
  // Taxa de conversão (se tiver dados de leads)
  const conversionRate = 0 // Placeholder - implementar se tiver tabela de leads
  
  // Ranking (percentil)
  const performanceScore = (salesLast30Days.length * 10) + (revenueLast30Days / 100)
  
  return {
    totalSales,
    totalRevenue,
    revenueLast30Days,
    revenueThisYear,
    salesLast30Days: salesLast30Days.length,
    salesThisYear: salesThisYear.length,
    averageTicket,
    averageTicketLast30Days,
    bestDay: bestDay ? { date: bestDay[0], value: bestDay[1] } : null,
    largestSale: largestSale ? {
      id: largestSale.id,
      sale_number: largestSale.sale_number,
      amount: largestSale.final_amount,
      date: largestSale.created_at,
      customer: largestSale.customer_name
    } : null,
    ticketByPayment,
    conversionRate,
    performanceScore,
    // Metas
    goals: {
      daily: 1000,
      monthly: 20000,
      yearly: 240000
    },
    progress: {
      daily: (revenueLast30Days / 30 / 1000) * 100,
      monthly: (revenueLast30Days / 20000) * 100,
      yearly: (revenueThisYear / 240000) * 100
    }
  }
}

/**
 * Buscar produtos mais vendidos pelo vendedor
 */
async function fetchSellerTopProducts(sellerId) {
  const { data, error } = await supabase
    .from('sale_items')
    .select(`
      product_id,
      product_name,
      quantity,
      total_price,
      sale:sales!inner(created_by)
    `)
    .eq('sale.created_by', sellerId)
  
  if (error) throw error
  
  const productMap = new Map()
  
  data?.forEach(item => {
    const key = item.product_id
    const existing = productMap.get(key)
    
    if (existing) {
      existing.quantity += item.quantity
      existing.revenue += item.total_price
      existing.salesCount++
    } else {
      productMap.set(key, {
        id: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        revenue: item.total_price,
        salesCount: 1
      })
    }
  })
  
  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}

/**
 * Buscar clientes atendidos pelo vendedor
 */
async function fetchSellerCustomers(sellerId) {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      customer_id,
      customer_name,
      final_amount,
      created_at
    `)
    .eq('created_by', sellerId)
    .not('customer_id', 'is', null)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  const customerMap = new Map()
  
  data?.forEach(sale => {
    const key = sale.customer_id
    const existing = customerMap.get(key)
    
    if (existing) {
      existing.totalSpent += sale.final_amount
      existing.purchases++
      if (new Date(sale.created_at) > new Date(existing.lastPurchase)) {
        existing.lastPurchase = sale.created_at
      }
    } else {
      customerMap.set(key, {
        id: sale.customer_id,
        name: sale.customer_name,
        totalSpent: sale.final_amount,
        purchases: 1,
        lastPurchase: sale.created_at,
        firstPurchase: sale.created_at
      })
    }
  })
  
  return Array.from(customerMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
}

/**
 * Calcular desempenho diário
 */
function calculateDailyPerformance(sales, startDate, endDate) {
  const dailyMap = {}
  
  // Inicializar todos os dias
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0]
    dailyMap[dateKey] = { date: dateKey, sales: 0, revenue: 0, count: 0 }
  }
  
  // Preencher com dados reais
  sales.forEach(sale => {
    const dateKey = new Date(sale.created_at).toISOString().split('T')[0]
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].revenue += sale.final_amount
      dailyMap[dateKey].count++
    }
  })
  
  return Object.values(dailyMap)
}

/**
 * Calcular desempenho por hora
 */
function calculateHourlyPerformance(sales) {
  const hourlyMap = {}
  
  for (let i = 0; i < 24; i++) {
    hourlyMap[i] = { hour: i, sales: 0, revenue: 0, count: 0 }
  }
  
  sales.forEach(sale => {
    const hour = new Date(sale.created_at).getHours()
    hourlyMap[hour].revenue += sale.final_amount
    hourlyMap[hour].count++
  })
  
  return Object.values(hourlyMap)
}

/**
 * Calcular desempenho por método de pagamento
 */
function calculatePaymentMethodPerformance(sales) {
  const methodMap = {}
  
  sales.forEach(sale => {
    const method = sale.payment_method || 'outro'
    if (!methodMap[method]) {
      methodMap[method] = { method, count: 0, revenue: 0 }
    }
    methodMap[method].count++
    methodMap[method].revenue += sale.final_amount
  })
  
  return Object.values(methodMap).sort((a, b) => b.revenue - a.revenue)
}
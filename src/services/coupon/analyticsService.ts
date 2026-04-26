import { supabase } from '@lib/supabase'

const getDateRangeParams = (dateRange, customDateRange) => {
  const now = new Date()
  let startDate, endDate
  
  switch (dateRange) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0))
      endDate = new Date(now.setHours(23, 59, 59, 999))
      break
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7))
      endDate = new Date()
      break
    case 'month':
      startDate = new Date(now.setDate(now.getDate() - 30))
      endDate = new Date()
      break
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1))
      endDate = new Date()
      break
    case 'custom':
      startDate = new Date(customDateRange.start)
      endDate = new Date(customDateRange.end)
      endDate.setHours(23, 59, 59, 999)
      break
    default:
      startDate = new Date(now.setDate(now.getDate() - 30))
      endDate = new Date()
  }
  
  return { startDate, endDate }
}

export const fetchCouponAnalytics = async ({ dateRange, customDateRange }) => {
  const { startDate, endDate } = getDateRangeParams(dateRange, customDateRange)

  const [salesWithCoupons, allSales, coupons, allCustomers] = await Promise.all([
    supabase
      .from('sales')
      .select(`
        id,
        customer_id,
        final_amount,
        discount_amount,
        coupon_code,
        created_at,
        customer:customers(id, name, email, phone, total_purchases)
      `)
      .not('coupon_code', 'is', null)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('sales')
      .select('customer_id, created_at, status')
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),
    supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true),
    supabase
      .from('customers')
      .select('id, name, email, phone, total_purchases, status, created_at')
      .eq('status', 'active')
  ])

  if (salesWithCoupons.error) throw salesWithCoupons.error
  if (allSales.error) throw allSales.error
  if (coupons.error) throw coupons.error
  if (allCustomers.error) throw allCustomers.error

  const lastPurchaseMap = {}
  allSales.data?.forEach(sale => {
    if (sale.customer_id && !lastPurchaseMap[sale.customer_id]) {
      lastPurchaseMap[sale.customer_id] = sale.created_at
    }
  })

  const customerCouponUsage = {}
  const couponUsageCount = {}
  
  salesWithCoupons.data?.forEach(sale => {
    const customerId = sale.customer_id
    const couponCode = sale.coupon_code
    
    if (customerId) {
      if (!customerCouponUsage[customerId]) {
        customerCouponUsage[customerId] = {
          customer: sale.customer,
          count: 0,
          totalDiscount: 0,
          totalSpent: 0,
          couponsUsed: new Set()
        }
      }
      customerCouponUsage[customerId].count++
      customerCouponUsage[customerId].totalDiscount += sale.discount_amount || 0
      customerCouponUsage[customerId].totalSpent += sale.final_amount || 0
      customerCouponUsage[customerId].couponsUsed.add(couponCode)
    }
    
    if (couponCode) {
      couponUsageCount[couponCode] = (couponUsageCount[couponCode] || 0) + 1
    }
  })

  const topUsers = Object.values(customerCouponUsage)
    .map(u => ({
      ...u,
      couponsUsed: Array.from(u.couponsUsed)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const performance = coupons.data?.map(coupon => ({
    ...coupon,
    usageCount: couponUsageCount[coupon.code] || 0,
    usageRate: coupon.usage_limit 
      ? ((couponUsageCount[coupon.code] || 0) / coupon.usage_limit) * 100 
      : 0
  })).sort((a, b) => b.usageCount - a.usageCount)

  const opportunities = []
  
  const highSpendersNoCoupon = allCustomers.data?.filter(c => {
    const hasUsedCoupon = customerCouponUsage[c.id]
    return !hasUsedCoupon && (c.total_purchases || 0) > 100
  }).sort((a, b) => (b.total_purchases || 0) - (a.total_purchases || 0)).slice(0, 5)

  highSpendersNoCoupon?.forEach(customer => {
    opportunities.push({
      type: 'high_spender',
      priority: 'high',
      customer,
      reason: 'Cliente fiel que nunca usou cupom',
      suggestion: 'Ofereça cupom de fidelidade exclusivo'
    })
  })

  const recentInactive = allCustomers.data?.filter(c => {
    const hasUsedCoupon = customerCouponUsage[c.id]
    const lastPurchase = lastPurchaseMap[c.id]
    if (hasUsedCoupon) return false
    if (!lastPurchase) return false
    const daysSince = (Date.now() - new Date(lastPurchase).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince > 60
  }).sort((a, b) => {
    const aDate = lastPurchaseMap[a.id] ? new Date(lastPurchaseMap[a.id]).getTime() : 0
    const bDate = lastPurchaseMap[b.id] ? new Date(lastPurchaseMap[b.id]).getTime() : 0
    return aDate - bDate
  }).slice(0, 5)

  recentInactive?.forEach(customer => {
    opportunities.push({
      type: 'inactive',
      priority: 'medium',
      customer,
      reason: 'Cliente inativo há mais de 60 dias',
      suggestion: 'Ofereça cupom de reativação'
    })
  })

  const oneTimeBuyers = allCustomers.data?.filter(c => {
    const usage = customerCouponUsage[c.id]
    return usage && usage.count === 1
  }).sort((a, b) => {
    const aTotal = customerCouponUsage[a.id]?.totalSpent || 0
    const bTotal = customerCouponUsage[b.id]?.totalSpent || 0
    return bTotal - aTotal
  }).slice(0, 5)

  oneTimeBuyers?.forEach(customer => {
    opportunities.push({
      type: 'one_time',
      priority: 'medium',
      customer,
      reason: 'Usou cupom apenas uma vez',
      suggestion: 'Ofereça cupom para segunda compra'
    })
  })

  return {
    stats: {
      totalCoupons: coupons.data?.length || 0,
      totalUses: salesWithCoupons.data?.length || 0,
      totalDiscount: salesWithCoupons.data?.reduce((sum, s) => sum + (s.discount_amount || 0), 0) || 0,
      uniqueCustomers: Object.keys(customerCouponUsage).length,
      avgUsageRate: coupons.data?.length 
        ? (salesWithCoupons.data?.length / coupons.data.length).toFixed(1) 
        : 0
    },
    topCouponUsers: topUsers,
    engagementOpportunities: opportunities,
    couponPerformance: performance
  }
}
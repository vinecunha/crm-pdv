import { supabase } from '../lib/supabase'

/**
 * Buscar dados do dashboard baseado no cargo do usuário
 */
export const fetchDashboardDataByRole = async (userId, userRole) => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  const todayStr = today.toISOString().split('T')[0]
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
  
  // Base da query
  let salesQuery = supabase
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
      created_by,
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
    .eq('status', 'completed')
    .gte('created_at', `${thirtyDaysAgoStr}T00:00:00`)
    .lte('created_at', `${todayStr}T23:59:59`)
  
  // 🔑 Filtrar por cargo
  switch (userRole) {
    case 'operador':
      // Operador vê apenas suas próprias vendas
      salesQuery = salesQuery.eq('created_by', userId)
      break
      
    case 'gerente':
      // Gerente vê suas vendas + vendas dos operadores
      // Buscar IDs dos operadores primeiro
      const { data: operadores } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'operador')
      
      const operadorIds = operadores?.map(o => o.id) || []
      const allowedIds = [userId, ...operadorIds]
      
      salesQuery = salesQuery.in('created_by', allowedIds)
      break
      
    case 'admin':
      // Admin vê todas as vendas (sem filtro adicional)
      break
      
    default:
      // Fallback: apenas próprias vendas
      salesQuery = salesQuery.eq('created_by', userId)
  }
  
  // Executar queries em paralelo
  const [
    salesResult,
    productsResult,
    customersResult,
    teamResult
  ] = await Promise.all([
    salesQuery.order('created_at', { ascending: false }),
    
    // Produtos mais vendidos (filtrado por cargo também)
    fetchTopProductsByRole(userId, userRole, thirtyDaysAgoStr, todayStr),
    
    // Clientes (todos podem ver)
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    
    // Dados da equipe (apenas gerente/admin)
    userRole !== 'operador' ? fetchTeamData(userId, userRole) : Promise.resolve(null)
  ])
  
  const { data: sales, error: salesError } = salesResult
  
  if (salesError) throw salesError
  
  return {
    sales: sales || [],
    topProducts: productsResult || [],
    totalCustomers: customersResult.count || 0,
    teamData: teamResult,
    filters: {
      role: userRole,
      userId,
      period: {
        start: thirtyDaysAgoStr,
        end: todayStr
      }
    }
  }
}

/**
 * Buscar produtos mais vendidos por cargo
 */
async function fetchTopProductsByRole(userId, userRole, startDate, endDate) {
  // Primeiro, buscar sale_items com filtro de cargo
  let itemsQuery = supabase
    .from('sale_items')
    .select(`
      product_id,
      product_name,
      quantity,
      total_price,
      sale:sales!inner(
        created_by,
        status,
        created_at
      )
    `)
    .eq('sale.status', 'completed')
    .gte('sale.created_at', `${startDate}T00:00:00`)
    .lte('sale.created_at', `${endDate}T23:59:59`)
  
  // Aplicar filtro de cargo
  if (userRole === 'operador') {
    itemsQuery = itemsQuery.eq('sale.created_by', userId)
  } else if (userRole === 'gerente') {
    const { data: operadores } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'operador')
    
    const allowedIds = [userId, ...(operadores?.map(o => o.id) || [])]
    itemsQuery = itemsQuery.in('sale.created_by', allowedIds)
  }
  
  const { data: items, error } = await itemsQuery
  
  if (error) throw error
  
  // Agrupar por produto
  const productMap = new Map()
  
  items?.forEach(item => {
    const key = item.product_id
    const existing = productMap.get(key)
    
    if (existing) {
      existing.quantity += item.quantity
      existing.total += item.total_price
    } else {
      productMap.set(key, {
        id: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        total: item.total_price
      })
    }
  })
  
  // Ordenar e limitar
  return Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
}

/**
 * Buscar dados da equipe (para gerentes e admins)
 */
async function fetchTeamData(userId, userRole) {
  let membersQuery = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      status,
      last_login,
      login_count,
      created_at
    `)
    .eq('status', 'active')
  
  if (userRole === 'gerente') {
    // Gerente vê apenas operadores
    membersQuery = membersQuery.eq('role', 'operador')
  }
  // Admin vê todos (sem filtro adicional)
  
  const { data: members, error: membersError } = await membersQuery
  
  if (membersError) throw membersError
  
  // Buscar vendas de cada membro nos últimos 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      const { data: sales } = await supabase
        .from('sales')
        .select('final_amount')
        .eq('created_by', member.id)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      const totalSales = sales?.reduce((sum, s) => sum + s.final_amount, 0) || 0
      const salesCount = sales?.length || 0
      
      return {
        ...member,
        stats: {
          totalSales,
          salesCount,
          averageTicket: salesCount > 0 ? totalSales / salesCount : 0
        }
      }
    })
  )
  
  // Ordenar por total de vendas
  return membersWithStats.sort((a, b) => b.stats.totalSales - a.stats.totalSales)
}
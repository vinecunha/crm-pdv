import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

/**
 * Buscar produtos mais vendidos por cargo
 */
async function fetchTopProductsByRole(userId, userRole, startDate, endDate) {
  logger.log('📦 fetchTopProductsByRole chamado:', { userId, userRole, startDate, endDate })
  
  try {
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
    // Admin não tem filtro adicional
    
    const { data: items, error } = await itemsQuery
    
    if (error) {
      console.error('❌ Erro ao buscar items:', error)
      throw error
    }
    
    logger.log('📦 Itens encontrados:', items?.length || 0)
    
    if (!items || items.length === 0) {
      return []
    }
    
    // Agrupar por produto
    const productMap = new Map()
    
    items.forEach(item => {
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
    const result = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
    
    logger.log('📦 Top produtos:', result)
    
    return result
  } catch (error) {
    console.error('❌ Erro em fetchTopProductsByRole:', error)
    return []
  }
}

/**
 * Buscar dados da equipe (para gerentes e admins)
 */
async function fetchTeamData(userId, userRole) {
  logger.log('👥 fetchTeamData chamado:', { userId, userRole })
  
  try {
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
    
    if (membersError) {
      console.error('❌ Erro ao buscar membros:', membersError)
      throw membersError
    }
    
    logger.log('👥 Membros encontrados:', members?.length || 0)
    
    if (!members || members.length === 0) {
      return []
    }
    
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
        
        const totalSales = sales?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
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
    const result = membersWithStats.sort((a, b) => b.stats.totalSales - a.stats.totalSales)
    
    logger.log('👥 TeamData final:', {
      count: result.length,
      firstMember: result[0]?.full_name,
      firstMemberSales: result[0]?.stats.totalSales
    })
    
    return result
  } catch (error) {
    console.error('❌ Erro em fetchTeamData:', error)
    return []
  }
}

/**
 * Buscar dados do dashboard baseado no cargo do usuário
 */
export const fetchDashboardDataByRole = async (userId, role) => {
  const { data, error } = await supabase.rpc('get_dashboard_data', {
    p_user_id: userId,
    p_role: role
  })
  
  if (error) throw error
  
  // ✅ IMPORTANTE: Garantir que os arrays sejam novos, não referências acumuladas
  return {
    sales: data.sales || [],
    topProducts: data.topProducts || [],
    totalCustomers: data.totalCustomers || 0,
    teamData: data.teamData || null
  }
}

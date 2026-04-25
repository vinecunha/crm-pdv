import { supabase } from '@lib/supabase'

/**
 * Criar notificação para um usuário
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  link = null,
  entityType = null,
  entityId = null
}) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link,
        entity_type: entityType,
        entity_id: entityId,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    throw error
  }
}

/**
 * Notificar meta atingida
 */
export const notifyGoalAchieved = async (userId, goalType, currentAmount, targetAmount) => {
  const goalNames = {
    daily: 'diária',
    monthly: 'mensal',
    yearly: 'anual'
  }
  
  await createNotification({
    userId,
    title: '🎉 Meta Atingida!',
    message: `Parabéns! Você atingiu a meta ${goalNames[goalType]} de vendas!`,
    type: 'success',
    link: `/sellers/${userId}`,
    entityType: 'goal',
    entityId: goalType
  })
}

/**
 * Notificar nova venda (para gerentes/admins)
 */
export const notifyNewSale = async (saleData, sellerName) => {
  // Buscar gerentes e admins
  const { data: managers } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'gerente'])
  
  if (!managers?.length) return
  
  const notifications = managers.map(manager => ({
    user_id: manager.id,
    title: '💰 Nova Venda Realizada!',
    message: `${sellerName} realizou uma venda de R$ ${saleData.final_amount.toFixed(2)}`,
    type: 'success',
    link: `/sales-list?sale=${saleData.id}`,
    entity_type: 'sale',
    entity_id: saleData.id,
    read: false,
    created_at: new Date().toISOString()
  }))
  
  await supabase.from('notifications').insert(notifications)
}

/**
 * Notificar cliente aniversariante
 */
export const notifyBirthdayCustomer = async (customer, assignedSellerId) => {
  await createNotification({
    userId: assignedSellerId,
    title: '🎂 Cliente Aniversariante!',
    message: `${customer.name} está fazendo aniversário hoje! Que tal enviar um cupom especial?`,
    type: 'info',
    link: `/customers/${customer.id}`,
    entityType: 'customer',
    entityId: customer.id
  })
}

/**
 * Notificar estoque baixo
 */
export const notifyLowStock = async (product) => {
  // Notificar gerentes e admins
  const { data: managers } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'gerente'])
  
  if (!managers?.length) return
  
  const notifications = managers.map(manager => ({
    user_id: manager.id,
    title: '⚠️ Estoque Baixo',
    message: `${product.name} está com apenas ${product.stock_quantity} unidades em estoque!`,
    type: 'warning',
    link: `/products/${product.id}`,
    entity_type: 'product',
    entity_id: product.id,
    read: false,
    created_at: new Date().toISOString()
  }))
  
  await supabase.from('notifications').insert(notifications)
}

/**
 * Notificar novo vendedor cadastrado
 */
export const notifyNewSeller = async (sellerName, sellerId) => {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  
  if (!admins?.length) return
  
  const notifications = admins.map(admin => ({
    user_id: admin.id,
    title: '👤 Novo Vendedor',
    message: `${sellerName} foi cadastrado no sistema`,
    type: 'info',
    link: `/sellers/${sellerId}`,
    entity_type: 'seller',
    entity_id: sellerId,
    read: false,
    created_at: new Date().toISOString()
  }))
  
  await supabase.from('notifications').insert(notifications)
}

/**
 * Notificar comissão calculada
 */
export const notifyCommissionCalculated = async (userId, amount, period) => {
  await createNotification({
    userId,
    title: '💵 Comissão Calculada!',
    message: `Sua comissão de ${period} é de R$ ${amount.toFixed(2)}`,
    type: 'success',
    link: '/commissions',
    entityType: 'commission',
    entityId: period
  })
}

/**
 * Notificar avaliação recebida
 */
export const notifyReviewReceived = async (sellerId, customerName, rating) => {
  const ratingEmoji = rating >= 4 ? '🌟' : rating >= 3 ? '👍' : '📝'
  
  await createNotification({
    userId: sellerId,
    title: `${ratingEmoji} Nova Avaliação!`,
    message: `${customerName} avaliou seu atendimento com ${rating} estrelas`,
    type: rating >= 4 ? 'success' : 'info',
    link: `/sellers/${sellerId}#reviews`,
    entityType: 'review',
    entityId: null
  })
}

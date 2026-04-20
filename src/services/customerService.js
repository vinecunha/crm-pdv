import { supabase } from '../lib/supabase'
import { sanitizeObject } from '../utils/sanitize'

/**
 * Verificar e renovar sessão se necessário
 */
const ensureAuthenticated = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    // Tentar refresh do token
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError || !refreshData.session) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    
    return refreshData.session
  }
  
  // Verificar se token está próximo de expirar (menos de 5 minutos)
  const expiresAt = session.expires_at
  const now = Math.floor(Date.now() / 1000)
  
  if (expiresAt && expiresAt - now < 300) {
    const { data: refreshData } = await supabase.auth.refreshSession()
    return refreshData.session
  }
  
  return session
}

/**
 * Buscar todos os clientes
 */
export const fetchCustomers = async () => {
  try {
    await ensureAuthenticated()
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .is('deleted_at', null)  // ✅ Apenas não deletados
      .order('name')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    throw error
  }
}

/**
 * Buscar cliente por ID
 */
export const fetchCustomerById = async (id) => {
  try {
    await ensureAuthenticated()
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    throw error
  }
}

/**
 * Buscar cliente por telefone
 */
export const searchCustomerByPhone = async (phone) => {
  try {
    await ensureAuthenticated()
    
    const cleanPhone = phone.replace(/\D/g, '')
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone)
      .is('deleted_at', null)
      .maybeSingle()
      
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar cliente por telefone:', error)
    throw error
  }
}

/**
 * Criar cliente
 */
export const createCustomer = async (customerData) => {
  try {
    // ✅ 1. Garantir autenticação
    await ensureAuthenticated()
    
    // ✅ 2. Sanitizar dados
    const safeData = sanitizeObject(customerData)
    
    // ✅ 3. Validar campos obrigatórios
    if (!safeData.name?.trim()) {
      throw new Error('Nome é obrigatório')
    }
    if (!safeData.email?.trim()) {
      throw new Error('Email é obrigatório')
    }
    if (!safeData.phone?.trim()) {
      throw new Error('Telefone é obrigatório')
    }
    
    // ✅ 4. Verificar se email já existe
    const { data: existingEmail } = await supabase
      .from('customers')
      .select('id')
      .eq('email', safeData.email.trim().toLowerCase())
      .maybeSingle()
      
    if (existingEmail) {
      throw new Error('Este e-mail já está cadastrado')
    }
    
    // ✅ 5. Verificar se telefone já existe
    const cleanPhone = safeData.phone.replace(/\D/g, '')
    const { data: existingPhone } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle()
      
    if (existingPhone) {
      throw new Error('Este telefone já está cadastrado')
    }
    
    // ✅ 6. Preparar dados para inserção
    const insertData = {
      name: safeData.name.trim(),
      email: safeData.email.trim().toLowerCase(),
      phone: cleanPhone,
      document: safeData.document?.replace(/\D/g, '') || null,
      address: safeData.address?.trim() || null,
      city: safeData.city?.trim() || null,
      state: safeData.state?.trim()?.toUpperCase() || null,
      zip_code: safeData.zip_code?.replace(/\D/g, '') || null,
      birth_date: safeData.birth_date || null,
      status: safeData.status || 'active',
      total_purchases: 0,
      deleted_at: null,  // ✅ Explícito para RLS
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // ✅ 7. Inserir
    const { data, error } = await supabase
      .from('customers')
      .insert([insertData])
      .select('*')
      .single()
    
    if (error) {
      console.error('Erro Supabase ao criar cliente:', error)
      
      if (error.code === '23505') {
        if (error.message.includes('email')) {
          throw new Error('Este e-mail já está cadastrado')
        }
        if (error.message.includes('phone')) {
          throw new Error('Este telefone já está cadastrado')
        }
        throw new Error('Registro duplicado')
      }
      
      if (error.code === '42501') {
        throw new Error('Sem permissão para criar cliente')
      }
      
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    throw error
  }
}

/**
 * Atualizar cliente
 */
export const updateCustomer = async (id, customerData) => {
  try {
    await ensureAuthenticated()
    
    const safeData = sanitizeObject(customerData)
    
    // Verificar se email já existe (excluindo o próprio cliente)
    if (safeData.email) {
      const { data: existingEmail } = await supabase
        .from('customers')
        .select('id')
        .eq('email', safeData.email.trim().toLowerCase())
        .neq('id', id)
        .maybeSingle()
        
      if (existingEmail) {
        throw new Error('Este e-mail já está cadastrado para outro cliente')
      }
    }
    
    // Verificar se telefone já existe
    if (safeData.phone) {
      const cleanPhone = safeData.phone.replace(/\D/g, '')
      const { data: existingPhone } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', cleanPhone)
        .neq('id', id)
        .maybeSingle()
        
      if (existingPhone) {
        throw new Error('Este telefone já está cadastrado para outro cliente')
      }
    }
    
    const updateData = {
      name: safeData.name?.trim(),
      email: safeData.email?.trim().toLowerCase(),
      phone: safeData.phone?.replace(/\D/g, ''),
      document: safeData.document?.replace(/\D/g, '') || null,
      address: safeData.address?.trim() || null,
      city: safeData.city?.trim() || null,
      state: safeData.state?.trim()?.toUpperCase() || null,
      zip_code: safeData.zip_code?.replace(/\D/g, '') || null,
      birth_date: safeData.birth_date || null,
      status: safeData.status,
      updated_at: new Date().toISOString()
    }
    
    // Remover campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key]
    })
    
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      console.error('Erro Supabase ao atualizar cliente:', error)
      
      if (error.code === '23505') {
        throw new Error('Email ou telefone já cadastrado para outro cliente')
      }
      
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    throw error
  }
}

/**
 * Excluir cliente (soft delete)
 */
export const deleteCustomer = async (id) => {
  try {
    await ensureAuthenticated()
    
    // Soft delete - apenas marca como deletado
    const { error } = await supabase
      .from('customers')
      .update({ 
        deleted_at: new Date().toISOString(),
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) throw error
    return id
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    throw error
  }
}

/**
 * Atualizar status do cliente
 */
export const updateCustomerStatus = async (id, status) => {
  try {
    await ensureAuthenticated()
    
    const { data, error } = await supabase
      .from('customers')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    throw error
  }
}

/**
 * Buscar estatísticas dos clientes
 */
export const fetchCustomerStats = async () => {
  try {
    await ensureAuthenticated()
    
    const { data, error } = await supabase
      .from('customers')
      .select('status, total_purchases')
      .is('deleted_at', null)
    
    if (error) throw error
    
    const stats = {
      total: data.length,
      active: data.filter(c => c.status === 'active').length,
      inactive: data.filter(c => c.status === 'inactive').length,
      totalPurchases: data.reduce((sum, c) => sum + (c.total_purchases || 0), 0)
    }
    
    return stats
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    throw error
  }
}
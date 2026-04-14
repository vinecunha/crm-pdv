import { supabase } from '../lib/supabase'
import { sanitizeObject } from '../utils/sanitize'

/**
 * Buscar todos os clientes
 */
export const fetchCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data || []
}

/**
 * Buscar cliente por ID
 */
export const fetchCustomerById = async (id) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Buscar cliente por telefone
 */
export const searchCustomerByPhone = async (phone) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone.replace(/\D/g, ''))
    .maybeSingle()
    
  if (error) throw error
  return data
}

/**
 * Criar cliente
 */
export const createCustomer = async (customerData) => {
  const safeData = sanitizeObject(customerData)
  
  const { data, error } = await supabase
    .from('customers')
    .insert([{ 
      ...safeData,
      total_purchases: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (error) {
    if (error.message?.includes('duplicate key') || error.message?.includes('email')) {
      throw new Error('Este e-mail já está cadastrado')
    }
    if (error.message?.includes('phone')) {
      throw new Error('Este telefone já está cadastrado')
    }
    throw error
  }
  
  return data
}

/**
 * Atualizar cliente
 */
export const updateCustomer = async (id, customerData) => {
  const safeData = sanitizeObject(customerData)
  
  const { data, error } = await supabase
    .from('customers')
    .update({ 
      ...safeData,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    if (error.message?.includes('duplicate key') || error.message?.includes('email')) {
      throw new Error('Este e-mail já está cadastrado')
    }
    if (error.message?.includes('phone')) {
      throw new Error('Este telefone já está cadastrado')
    }
    throw error
  }
  
  return data
}

/**
 * Excluir cliente
 */
export const deleteCustomer = async (id) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return id
}

/**
 * Atualizar status do cliente
 */
export const updateCustomerStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('customers')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}
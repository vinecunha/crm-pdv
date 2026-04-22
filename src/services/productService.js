import { supabase } from '@lib/supabase'
import { sanitizeObject } from '@utils/sanitize'

// ============= Constantes =============
export const units = [
  { value: 'UN', label: 'Unidade' }, { value: 'KG', label: 'Quilograma' },
  { value: 'G', label: 'Grama' }, { value: 'L', label: 'Litro' },
  { value: 'ML', label: 'Mililitro' }, { value: 'CX', label: 'Caixa' },
  { value: 'PC', label: 'Pacote' }, { value: 'M', label: 'Metro' }
]

export const categories = [
  'Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Eletrônicos',
  'Ferramentas', 'Vestuário', 'Papelaria', 'Moveis', 'Outros'
]

// ============= API Functions =============

/**
 * Buscar todos os produtos
 */
export const fetchProducts = async (canViewOnlyActive = false) => {
  let query = supabase.from('products').select('*').order('name', { ascending: true })
  if (canViewOnlyActive) query = query.eq('is_active', true)
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Gerar próximo código sequencial
 */
export const generateNextCode = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('code, id')
      .not('code', 'is', null)
      .order('id', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0 && data[0].code) {
      const numericPart = data[0].code.replace(/\D/g, '')
      if (numericPart) {
        const nextNumber = parseInt(numericPart) + 1
        return nextNumber.toString().padStart(3, '0')
      }
    }
    
    return '001'
  } catch (error) {
    console.error('Erro ao gerar código:', error)
    return Date.now().toString().slice(-6)
  }
}

/**
 * Criar produto
 */
export const createProduct = async (productData, profile) => {
  const safeData = sanitizeObject(productData)
  
  const { error } = await supabase.from('products').insert([{ ...safeData, created_by: profile?.id }])
  
  if (error) {
    if (error.message?.includes('duplicate key') || error.message?.includes('code')) {
      const newCode = await generateNextCode()
      const { error: retryError } = await supabase
        .from('products')
        .insert([{ ...safeData, code: newCode, created_by: profile?.id }])
      if (retryError) throw retryError
      return { ...safeData, code: newCode }
    }
    throw error
  }
  
  return safeData
}

/**
 * Atualizar produto
 */
export const updateProduct = async (id, productData, profile) => {
  const safeData = sanitizeObject(productData)
  
  const { error } = await supabase
    .from('products')
    .update({ ...safeData, updated_by: profile?.id })
    .eq('id', id)
  
  if (error) throw error
  return { id, ...safeData }
}

/**
 * Excluir produto
 */
export const deleteProduct = async (id) => {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
  return id
}

/**
 * Criar entrada de produto
 */
export const createProductEntry = async (entryData, profile) => {
  const safeData = sanitizeObject(entryData)
  
  const { error } = await supabase
    .from('product_entries')
    .insert([{ ...safeData, created_by: profile?.id }])

  if (error) {
    let errorMessage = 'Erro ao registrar entrada'
    if (error.message?.includes('foreign key')) errorMessage = 'Produto não encontrado'
    else if (error.message?.includes('not-null')) errorMessage = 'Preencha todos os campos obrigatórios'
    else errorMessage = error.message
    throw new Error(errorMessage)
  }
  
  return safeData
}

/**
 * Buscar detalhes do produto (entradas e movimentações)
 */
export const fetchProductDetails = async (productId) => {
  const [{ data: entries }, { data: movements }] = await Promise.all([
    supabase.from('product_entries').select('*').eq('product_id', productId).order('entry_date', { ascending: false }),
    supabase.from('stock_movements').select('*').eq('product_id', productId).order('created_at', { ascending: false }).limit(20)
  ])
  
  return { entries: entries || [], movements: movements || [] }
}

/**
 * Buscar produto por ID
 */
export const fetchProductById = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Atualizar estoque do produto
 */
export const updateProductStock = async (id, quantity, profile) => {
  const { data, error } = await supabase
    .from('products')
    .update({ 
      stock_quantity: quantity,
      updated_by: profile?.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}
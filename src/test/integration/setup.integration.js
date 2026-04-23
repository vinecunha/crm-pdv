// src/__tests__/integration/setup.integration.js
import { beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { randomUUID } from 'crypto'

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') })

console.log('🔧 Modo teste:', process.env.VITE_USE_TEST_RPC === 'true' ? 'RPC de Teste' : 'RPC Produção')

// Cliente com service_role
export const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// ✅ Cliente normal - será recriado com a sessão do usuário
export let supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const TEST_RUN_ID = randomUUID().slice(0, 8)

export const TEST_USER = {
  email: `test.${TEST_RUN_ID}@test.com`,
  password: 'Test123!@#',
  full_name: `Test User ${TEST_RUN_ID}`
}

export let testUserId = null
export let testCustomerId = null
export let testProductId = null
export let testProfile = null
export let testProduct = null
export let testCustomer = null
export let testSession = null

export const cleanupDatabase = async () => {
  console.log('🧹 Limpando dados de teste...')
  
  if (testCustomerId) {
    try {
      await supabaseAdmin.from('customers').delete().eq('id', testCustomerId)
      console.log(`  ✓ Cliente ${testCustomerId} removido`)
    } catch (error) {
      console.warn(`  ⚠️ Erro ao remover cliente: ${error.message}`)
    }
  }
  
  if (testProductId) {
    try {
      await supabaseAdmin.from('products').delete().eq('id', testProductId)
      console.log(`  ✓ Produto ${testProductId} removido`)
    } catch (error) {
      console.warn(`  ⚠️ Erro ao remover produto: ${error.message}`)
    }
  }
}

export const createTestUser = async () => {
  console.log(`👤 Criando usuário de teste: ${TEST_USER.email}`)
  
  try {
    // Verificar se usuário já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === TEST_USER.email)
    
    if (existing) {
      console.log(`  ⚠️ Usuário já existe, deletando...`)
      await supabaseAdmin.auth.admin.deleteUser(existing.id)
    }
    
    // Criar novo usuário
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: {
        full_name: TEST_USER.full_name
      }
    })
    
    if (authError) throw authError
    testUserId = authUser.user.id
    console.log(`  ✓ Usuário criado: ${testUserId}`)
    
    // ✅ Criar perfil manualmente (mais confiável que esperar trigger)
    console.log(`  📝 Criando perfil manualmente...`)
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: testUserId,
        email: TEST_USER.email,
        full_name: TEST_USER.full_name,
        role: 'admin',
        status: 'active'
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('  ❌ Erro ao criar perfil:', profileError.message)
      throw profileError
    }
    
    testProfile = newProfile
    console.log(`  ✓ Perfil criado: ${newProfile.full_name}`)
    
    // ✅ Fazer login e guardar a sessão
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    })
    
    if (loginError) {
      console.error('  ❌ Erro no login:', loginError.message)
      throw loginError
    }
    
    testSession = sessionData.session
    console.log(`  ✓ Login realizado`)
    
    // ✅ Recriar o cliente supabase COM a sessão autenticada
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: true,
          detectSessionInUrl: false
        }
      }
    )
    
    // ✅ Setar a sessão no cliente
    await supabase.auth.setSession({
      access_token: testSession.access_token,
      refresh_token: testSession.refresh_token
    })
    
    console.log(`  ✓ Cliente Supabase autenticado`)
    
    return { userId: testUserId, profile: testProfile, session: testSession }
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message)
    throw error
  }
}

export const deleteTestUser = async () => {
  if (testUserId) {
    try {
      await supabaseAdmin.from('profiles').delete().eq('id', testUserId)
      await supabaseAdmin.auth.admin.deleteUser(testUserId)
      console.log(`  ✓ Usuário ${testUserId} deletado`)
    } catch (error) {
      console.error(`  ❌ Erro ao deletar usuário:`, error.message)
    }
  }
}

export const createTestProduct = async () => {
  if (testProduct) {
    console.log(`  📦 Reutilizando produto existente: ${testProduct.name}`)
    return testProduct
  }
  
  console.log('📦 Criando produto de teste...')
  
  const productCode = `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name: `Produto Teste ${TEST_RUN_ID}`,
      code: productCode,
      price: 100.00,
      cost_price: 50.00,
      stock_quantity: 100,
      is_active: true
    })
    .select()
    .single()
  
  if (error) {
    console.error('  ❌ Erro ao criar produto:', error.message)
    throw error
  }
  
  testProductId = data.id
  testProduct = data
  console.log(`  ✓ Produto criado: ${data.name} (${data.code})`)
  return data
}

export const createTestCustomer = async () => {
  if (testCustomer) {
    console.log(`  👥 Reutilizando cliente existente: ${testCustomer.name}`)
    return testCustomer
  }
  
  console.log('👥 Criando cliente de teste...')
  
  const customerEmail = `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`
  
  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert({
      name: `Cliente Teste ${TEST_RUN_ID}`,
      email: customerEmail,
      phone: `119${Math.random().toString().slice(2, 10)}`,
      status: 'active'
    })
    .select()
    .single()
  
  if (error) {
    console.error('  ❌ Erro ao criar cliente:', error.message)
    throw error
  }
  
  testCustomerId = data.id
  testCustomer = data
  console.log(`  ✓ Cliente criado: ${data.name}`)
  return data
}

// Hooks globais
beforeAll(async () => {
  console.log('\n🚀 Iniciando testes de integração...')
  console.log(`📋 ID da execução: ${TEST_RUN_ID}`)
  
  await createTestUser()
  
  if (!testProfile) {
    throw new Error('❌ Falha ao criar perfil de teste')
  }
  
  await createTestProduct()
  await createTestCustomer()
  
  console.log('✅ Setup concluído!\n')
}, 30000)

afterAll(async () => {
  console.log('\n🧹 Limpando todos os dados de teste...')
  await cleanupDatabase()
  await deleteTestUser()
  console.log('✅ Limpeza concluída!\n')
}, 30000)

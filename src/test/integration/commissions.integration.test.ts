// src/__tests__/integration/commissions.integration.test.js
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { supabase, supabaseAdmin, testProfile } from './setup.integration'
import { fetchSellerCommissions } from '@services/commission/commissionService'

describe('Integração - Comissões', () => {
  let testRuleId = null
  let testCommissionId = null

  afterEach(async () => {
    if (testCommissionId) {
      try {
        await supabaseAdmin.from('commissions').delete().eq('id', testCommissionId)
      } catch (error) {
        console.warn(`Erro ao deletar comissão:`, error.message)
      }
      testCommissionId = null
    }
  })

  afterAll(async () => {
    if (testRuleId) {
      await supabaseAdmin.from('commission_rules').delete().eq('id', testRuleId)
      testRuleId = null
    }
  })

  it('deve calcular comissão baseada em regras ativas', async () => {
    // Criar regra de comissão personalizada
    const ruleName = `Regra Teste ${Date.now()}`
    const { data: rule } = await supabaseAdmin
      .from('commission_rules')
      .insert({
        name: ruleName,
        percentage: 5,
        min_sales: 500,
        is_active: true,
        priority: 1
      })
      .select()
      .single()
    
    testRuleId = rule.id
    console.log(`  ✓ Regra criada: ${rule.name}`)
    
    // Buscar regras ativas
    const { data: rules } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority')
    
    expect(rules).toBeDefined()
    expect(rules.length).toBeGreaterThan(0)
    
    // Verificar se a regra criada está na lista
    const foundRule = rules.find(r => r.id === rule.id)
    expect(foundRule).toBeDefined()
    expect(foundRule.percentage).toBe(5)
  })

  it('deve buscar comissões pendentes de um vendedor', async () => {
    const userId = testProfile.id
    
    console.log('📋 Buscando comissões para userId:', userId)
    
    const result = await fetchSellerCommissions(userId)
    
    // Log para debug
    console.log('Resultado fetchSellerCommissions:', JSON.stringify(result, null, 2))
    
    // Agora a RPC está funcionando e retorna dados
    expect(result).toBeDefined()
    expect(result).not.toBeNull()
    
    // Verificar estrutura
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('history')
    expect(Array.isArray(result.history)).toBe(true)
    
    // Verificar campos do summary
    expect(result.summary).toHaveProperty('total_pending')
    expect(result.summary).toHaveProperty('total_paid')
    expect(result.summary).toHaveProperty('count_total')
    
    console.log(`  ✓ Comissões pendentes: ${result.summary.total_pending || 0}`)
    console.log(`  ✓ Total de comissões: ${result.summary.count_total || 0}`)
    })

  it('deve marcar comissão como paga', async () => {
    // Criar uma comissão de teste
    const { data: commission } = await supabaseAdmin
      .from('commissions')
      .insert({
        user_id: testProfile.id,
        amount: 50,
        percentage: 5,
        period: new Date().toISOString().slice(0, 7),
        status: 'pending'
      })
      .select()
      .single()
    
    testCommissionId = commission.id
    console.log(`  ✓ Comissão criada: ${commission.id}`)
    
    // Marcar como paga
    const { error } = await supabase
      .from('commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: testProfile.id
      })
      .eq('id', commission.id)
    
    expect(error).toBeNull()
    
    // Verificar
    const { data: updated } = await supabase
      .from('commissions')
      .select('status, paid_at')
      .eq('id', commission.id)
      .single()
    
    expect(updated.status).toBe('paid')
    expect(updated.paid_at).toBeTruthy()
    
    console.log(`  ✓ Comissão marcada como paga`)
  })
})

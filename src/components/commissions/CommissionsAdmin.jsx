// src/pages/CommissionsAdmin.jsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import PageHeader from '@components/ui/PageHeader'
import Button from '@components/ui/Button'
import DataTable from '@components/ui/DataTable'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import RuleCard from './RuleCard'
import RuleModal from './RuleModal'
import ConfirmPaymentModal from './ConfirmPaymentModal'
import CommissionDetailsModal from './CommissionDetailsModal'
import { 
  DollarSign, 
  Plus, 
  RefreshCw,
  CheckCircle,
  Settings,
  ChevronDown
} from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

// ===== SUBCOMPONENTE =====
const ExpandableCommissionDetails = ({ commissions, onPaySingle, canMarkAsPaid }) => {
  const [expanded, setExpanded] = useState(false)
  
  if (!commissions || commissions.length === 0) return null
  
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
      >
        {expanded ? 'Ocultar' : 'Ver'} {commissions.length} {commissions.length === 1 ? 'comissão' : 'comissões'}
        <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      
      {expanded && (
        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {commissions.map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm p-2 bg-white dark:bg-gray-700 rounded">
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  Venda #{c.sale_id}
                </p>
                <p className="text-xs text-gray-500">
                  {c.percentage}% • {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(c.amount)}
                </span>
                {canMarkAsPaid && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={CheckCircle}
                    onClick={() => onPaySingle(c)}
                  >
                    Pagar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== COMPONENTE PRINCIPAL =====
const CommissionsAdmin = () => {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  const isAdmin = profile?.role === 'admin'
  const canEdit = isAdmin
  const canMarkAsPaid = profile?.role === 'admin' || profile?.role === 'gerente'
  
  // Verificar acesso
  if (profile?.role !== 'admin' && profile?.role !== 'gerente') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Apenas administradores e gerentes podem acessar esta página.
          </p>
        </div>
      </div>
    )
  }
  
  // Buscar regras
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['commission-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .order('priority', { ascending: true })
      
      if (error) throw error
      return data || []
    }
  })
  
  // ✅ APENAS UMA QUERY - AGRUPADA (removida a duplicada)
  const { data: groupedCommissions = [], isLoading: commissionsLoading } = useQuery({
    queryKey: ['pending-commissions-grouped'],
    queryFn: async () => {
      // 1. Buscar comissões pendentes
      const { data: commissions, error: commError } = await supabase
        .from('commissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (commError) throw commError
      if (!commissions?.length) return []
      
      // 2. Buscar perfis
      const userIds = [...new Set(commissions.map(c => c.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
      
      // 3. Agrupar por vendedor
      const grouped = new Map()
      
      commissions.forEach(c => {
        const userId = c.user_id
        if (!grouped.has(userId)) {
          grouped.set(userId, {
            userId,
            user: profileMap.get(userId) || { full_name: 'N/A', email: '' },
            commissions: [],
            totalAmount: 0,
            count: 0
          })
        }
        
        const group = grouped.get(userId)
        group.commissions.push(c)
        group.totalAmount += c.amount
        group.count++
      })
      
      // Converter para array e ordenar por total (maior primeiro)
      return Array.from(grouped.values())
        .sort((a, b) => b.totalAmount - a.totalAmount)
    }
  })
  
  // Mutation para toggle de regra
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { data } = await supabase
        .from('commission_rules')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] })
    }
  })
  
  // Mutation para marcar como pago (LOTE ou ÚNICO)
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ commission }) => {
      if (commission.isBatch) {
        // Pagamento em lote
        const commissionIds = commission.commissions.map(c => c.id)
        const { data } = await supabase
          .from('commissions')
          .update({ 
            status: 'paid', 
            paid_at: new Date().toISOString(),
            paid_by: profile?.id
          })
          .in('id', commissionIds)
          .select()
        
        return data
      } else {
        // Pagamento único
        const { data } = await supabase
          .from('commissions')
          .update({ 
            status: 'paid', 
            paid_at: new Date().toISOString(),
            paid_by: profile?.id
          })
          .eq('id', commission.id)
          .select()
          .single()
        
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-commissions-grouped'] })
      setShowPaymentModal(false)
    }
  })
  
  // Mutation para salvar regra
  const saveRuleMutation = useMutation({
    mutationFn: async (rule) => {
      if (rule.id) {
        const { data } = await supabase
          .from('commission_rules')
          .update(rule)
          .eq('id', rule.id)
          .select()
          .single()
        return data
      } else {
        const { data } = await supabase
          .from('commission_rules')
          .insert({ ...rule, created_by: profile?.id })
          .select()
          .single()
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] })
      setShowRuleModal(false)
      setEditingRule(null)
    }
  })
  
  const columns = [
    {
      key: 'user',
      header: 'Vendedor',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {row.user?.full_name || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {row.user?.email}
          </p>
        </div>
      )
    },
    {
      key: 'count',
      header: 'Qtd. Vendas',
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {row.count} {row.count === 1 ? 'venda' : 'vendas'}
        </span>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total a Pagar',
      render: (row) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {formatCurrency(row.totalAmount)}
        </span>
      )
    },
    {
      key: 'details',
      header: 'Detalhes',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedGroup(row)
            setShowDetailsModal(true)
          }}
        >
          Ver {row.count} {row.count === 1 ? 'comissão' : 'comissões'}
        </Button>
      )
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          {canMarkAsPaid && (
            <Button
              size="sm"
              variant="success"
              icon={CheckCircle}
              onClick={() => {
                setSelectedCommission({
                  userId: row.userId,
                  user: row.user,
                  commissions: row.commissions,
                  totalAmount: row.totalAmount,
                  isBatch: true
                })
                setShowPaymentModal(true)
              }}
            >
              Pagar Tudo
            </Button>
          )}
        </div>
      )
    }
  ]
  
  const headerActions = [
    ...(canEdit ? [{
      label: 'Nova Regra',
      icon: Plus,
      onClick: () => {
        setEditingRule(null)
        setShowRuleModal(true)
      },
      variant: 'primary'
    }] : []),
    {
      label: 'Atualizar',
      icon: RefreshCw,
      onClick: () => {
        queryClient.invalidateQueries({ queryKey: ['commission-rules'] })
        queryClient.invalidateQueries({ queryKey: ['pending-commissions-grouped'] })
      },
      variant: 'outline'
    }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageHeader
          title="Administração de Comissões"
          description="Gerencie regras e pagamentos de comissões"
          icon={DollarSign}
          actions={headerActions}
        />
        
        {/* Seção de Regras */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings size={20} className="text-gray-500" />
            Regras de Comissão
          </h2>
          
          {rulesLoading ? (
            <DataLoadingSkeleton type="cards" rows={2} cardsPerRow={3} />
          ) : rules.length === 0 ? (
                <DataEmptyState
                  title="Nenhuma regra cadastrada"
                  description="Clique em 'Nova Regra' para começar a configurar as comissões."
                  icon="rules"
                  action={canEdit ? {
                    label: 'Nova Regra',
                    icon: <Plus size={16} />,
                    onClick: () => {
                      setEditingRule(null)
                      setShowRuleModal(true)
                    }
                  } : undefined}
                />
              ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={() => {
                    setEditingRule(rule)
                    setShowRuleModal(true)
                  }}
                  onToggle={(id, isActive) => toggleRuleMutation.mutate({ id, is_active: isActive })}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Seção de Comissões Pendentes */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <DollarSign size={20} className="text-yellow-500" />
            Comissões Pendentes de Pagamento
          </h2>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <DataTable
              columns={columns}
              data={groupedCommissions}
              loading={commissionsLoading}
              emptyMessage="Nenhuma comissão pendente"
              striped
              hover
            />
          </div>
        </div>
      </div>
      
      {/* Modal de Regra */}
      <RuleModal
        isOpen={showRuleModal}
        onClose={() => {
          setShowRuleModal(false)
          setEditingRule(null)
        }}
        rule={editingRule}
        onSave={(rule) => saveRuleMutation.mutateAsync(rule)}
        isSaving={saveRuleMutation.isPending}
      />
      
      <CommissionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedGroup(null)
        }}
        group={selectedGroup}
        onPaySingle={(commission) => {
          setSelectedCommission(commission)
          setShowPaymentModal(true)
          setShowDetailsModal(false)
        }}
        onPayAll={() => {
          if (selectedGroup) {
            setSelectedCommission({
              userId: selectedGroup.userId,
              user: selectedGroup.user,
              commissions: selectedGroup.commissions,
              totalAmount: selectedGroup.totalAmount,
              isBatch: true
            })
            setShowPaymentModal(true)
          }
        }}
        canMarkAsPaid={canMarkAsPaid}
      />
      
      {/* Modal de Confirmação de Pagamento */}
      <ConfirmPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedCommission(null)
        }}
        commission={selectedCommission}
        onConfirm={() => markAsPaidMutation.mutateAsync({ 
          commission: selectedCommission 
        })}
        isSubmitting={markAsPaidMutation.isPending}
      />
    </div>
  )
}

export default CommissionsAdmin

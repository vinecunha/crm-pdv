import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../Badge'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import { 
  Plus, 
  Trash2, 
  Settings, 
  CheckCircle, 
  XCircle,
  User,
  Award
} from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const UserCommissionRules = ({ isOpen, onClose, userId, userName }) => {
  const { profile } = useAuth()  // ✅ Usar o contexto
  const queryClient = useQueryClient()
  const [selectedRules, setSelectedRules] = useState([])

  
  // Buscar todas as regras disponíveis
  const { data: allRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['all-commission-rules'],
    queryFn: async () => {
      const { data } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority')
      return data || []
    }
  })
  
  // Buscar regras já associadas ao usuário
  const { data: userRules = [], isLoading: userRulesLoading, refetch } = useQuery({
    queryKey: ['user-commission-rules', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_commission_rules')
        .select(`
          *,
          rule:rule_id(*)
        `)
        .eq('user_id', userId)
      return data || []
    },
    enabled: !!userId && isOpen
  })
  
  // Mutation para salvar associações
  const saveMutation = useMutation({
    mutationFn: async (ruleIds) => {
      // 1. Remover associações existentes
      await supabase
        .from('user_commission_rules')
        .delete()
        .eq('user_id', userId)
      
      // 2. Inserir novas associações
      if (ruleIds.length > 0) {
        const associations = ruleIds.map(ruleId => ({
          user_id: userId,
          rule_id: ruleId,
          created_by: profile?.id  // ✅ Usar profile.id do contexto
        }))
        
        const { error } = await supabase
          .from('user_commission_rules')
          .insert(associations)
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-commission-rules'] })
      refetch()
    }
  })
  
  const handleToggleRule = (ruleId) => {
    setSelectedRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    )
  }
  
  const handleSave = async () => {
    await saveMutation.mutateAsync(selectedRules)
  }
  
  const handleRemoveAssociation = async (ruleId) => {
    await supabase
      .from('user_commission_rules')
      .delete()
      .eq('user_id', userId)
      .eq('rule_id', ruleId)
    
    refetch()
  }
  
  // Inicializar selectedRules com as regras já associadas
  useEffect(() => {
    if (userRules.length > 0) {
      setSelectedRules(userRules.map(ur => ur.rule_id))
    }
  }, [userRules])
  
  const hasCustomRules = userRules.length > 0
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <User size={20} />
          <span>Regras de Comissão - {userName}</span>
          {hasCustomRules && (
            <Badge variant="warning" size="sm">Personalizado</Badge>
          )}
        </div>
      }
      size="lg"
    >
      <div className="space-y-4">
        {/* Explicação */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
          <p className="flex items-center gap-1">
            <Award size={14} />
            <span>
              {hasCustomRules 
                ? 'Este vendedor possui regras de comissão personalizadas.'
                : 'Selecione as regras que serão aplicadas a este vendedor.'}
            </span>
          </p>
          <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
            Regras específicas têm prioridade sobre as regras globais.
          </p>
        </div>
        
        {/* Regras já associadas (resumo) */}
        {userRules.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Regras Atuais
            </h4>
            <div className="space-y-1.5">
              {userRules.map(({ rule }) => (
                <div key={rule.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-sm text-gray-900 dark:text-white">{rule.name}</span>
                    <Badge size="sm">{rule.percentage}%</Badge>
                  </div>
                  <button
                    onClick={() => handleRemoveAssociation(rule.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Lista de regras disponíveis */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {hasCustomRules ? 'Adicionar mais regras' : 'Selecionar regras'}
          </h4>
          
          {rulesLoading ? (
            <DataLoadingSkeleton type="list" rows={3} />
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {allRules.map(rule => {
                const isSelected = selectedRules.includes(rule.id)
                const isAlreadyAssociated = userRules.some(ur => ur.rule_id === rule.id)
                
                return (
                  <label
                    key={rule.id}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected || isAlreadyAssociated
                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected || isAlreadyAssociated}
                        onChange={() => !isAlreadyAssociated && handleToggleRule(rule.id)}
                        disabled={isAlreadyAssociated}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {rule.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {rule.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={rule.is_active ? 'success' : 'default'}>
                        {rule.percentage}%
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Min: {formatCurrency(rule.min_sales)}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Aviso sobre regra padrão */}
        {!hasCustomRules && selectedRules.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              Nenhuma regra selecionada. O vendedor usará as regras globais padrão.
            </p>
          </div>
        )}
      </div>
      
      {/* Ações */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            if (hasCustomRules) {
              // Remover todas as personalizações
              saveMutation.mutateAsync([]).then(() => {
                setSelectedRules([])
              })
            }
          }}
          className={`text-sm ${hasCustomRules ? 'text-red-600 dark:text-red-400 hover:underline' : 'text-gray-400'}`}
          disabled={!hasCustomRules}
        >
          {hasCustomRules ? 'Remover personalizações' : 'Usando regras globais'}
        </button>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            loading={saveMutation.isPending}
            icon={Settings}
          >
            Salvar Configuração
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default UserCommissionRules
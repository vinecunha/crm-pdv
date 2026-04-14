import React, { useState, useEffect } from 'react'
import { AlertCircle, Shield, Eye, EyeOff, Search } from '../../../lib/icons'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { formatCurrency } from '../../../utils/formatters'
import { supabase } from '../../../lib/supabase'

const CancelSaleModal = ({ 
  isOpen, 
  onClose, 
  sale, 
  cancelReason, 
  setCancelReason, 
  cancelNotes, 
  setCancelNotes, 
  onConfirm, 
  isSubmitting,
  currentUser // Usuário logado
}) => {
  const [step, setStep] = useState(1) // 1 = motivo, 2 = aprovação
  const [approvers, setApprovers] = useState([])
  const [selectedApprover, setSelectedApprover] = useState('')
  const [approverEmail, setApproverEmail] = useState('')
  const [approverPassword, setApproverPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [approvalError, setApprovalError] = useState('')
  const [validatingApproval, setValidatingApproval] = useState(false)
  const [searchApprover, setSearchApprover] = useState('')

  // Verificar se o usuário atual pode cancelar diretamente
  const canCancelDirectly = currentUser?.role === 'admin' || currentUser?.role === 'gerente'

  useEffect(() => {
    if (isOpen) {
      fetchApprovers()
      setStep(1)
      setApprovalError('')
      setSelectedApprover('')
      setApproverPassword('')
    }
  }, [isOpen])

  const fetchApprovers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .in('role', ['admin', 'gerente'])
        .order('full_name')

      if (error) throw error
      setApprovers(data || [])
      
      // Se o usuário atual for admin/gerente, pré-seleciona ele mesmo
      if (canCancelDirectly && currentUser) {
        const self = data?.find(a => a.id === currentUser.id)
        if (self) {
          setSelectedApprover(self.id)
          setApproverEmail(self.email)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar aprovadores:', error)
    }
  }

  const handleApproverSelect = (approverId) => {
    const approver = approvers.find(a => a.id === approverId)
    setSelectedApprover(approverId)
    setApproverEmail(approver?.email || '')
    setApprovalError('')
  }

  const handleValidateApproval = async () => {
    if (!selectedApprover) {
      setApprovalError('Selecione um aprovador')
      return
    }
    
    if (!approverPassword) {
      setApprovalError('Digite a senha do aprovador')
      return
    }

    setValidatingApproval(true)
    setApprovalError('')

    try {
      const approver = approvers.find(a => a.id === selectedApprover)
      
      // Tentar login com as credenciais do aprovador
      const { error } = await supabase.auth.signInWithPassword({
        email: approver.email,
        password: approverPassword
      })

      if (error) {
        setApprovalError('Senha incorreta para este aprovador')
        return
      }

      // Aprovação bem-sucedida! Prosseguir com o cancelamento
      onConfirm({
        approvedBy: selectedApprover,
        approverName: approver.full_name || approver.email,
        approverRole: approver.role
      })

      // Resetar estado
      setStep(1)
      setApproverPassword('')
      
    } catch (error) {
      setApprovalError('Erro ao validar aprovação: ' + error.message)
    } finally {
      setValidatingApproval(false)
    }
  }

  const handleContinue = () => {
    if (!cancelReason) {
      return
    }

    if (canCancelDirectly) {
      // Admin/Gerente pode cancelar diretamente
      onConfirm({
        approvedBy: currentUser.id,
        approverName: currentUser.full_name || currentUser.email,
        approverRole: currentUser.role
      })
    } else {
      // Operador precisa de aprovação
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
    setApprovalError('')
  }

  const reasons = [
    { value: 'Cliente desistiu', label: 'Cliente desistiu da compra' },
    { value: 'Produto indisponível', label: 'Produto indisponível' },
    { value: 'Erro no valor', label: 'Erro no valor da venda' },
    { value: 'Erro no produto', label: 'Produto errado adicionado' },
    { value: 'Troca/Devolução', label: 'Troca/Devolução' },
    { value: 'Outros', label: 'Outros' }
  ]

  const filteredApprovers = approvers.filter(a => 
    a.full_name?.toLowerCase().includes(searchApprover.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchApprover.toLowerCase())
  )

  if (!sale) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => !isSubmitting && !validatingApproval && onClose()} 
      title={step === 1 ? "Cancelar Venda" : "Aprovação Necessária"} 
      size="md"
    >
      {step === 1 ? (
        // PASSO 1: Motivo do cancelamento
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Atenção! Esta ação não poderá ser desfeita.</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Venda #{sale.sale_number} no valor de {formatCurrency(sale.final_amount)}
                </p>
                <p className="text-xs text-yellow-700">Cliente: {sale.customer_name || 'Não identificado'}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo do cancelamento *</label>
            <select 
              value={cancelReason} 
              onChange={(e) => setCancelReason(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" 
              required
            >
              <option value="">Selecione um motivo</option>
              {reasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
            <textarea 
              value={cancelNotes} 
              onChange={(e) => setCancelNotes(e.target.value)} 
              rows={3} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" 
              placeholder="Informações adicionais..." 
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600"><strong>O que acontece após o cancelamento?</strong></p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc list-inside">
              <li>Os produtos voltam ao estoque</li>
              <li>O cupom é liberado para novo uso (se aplicável)</li>
              <li>O total de compras do cliente é atualizado</li>
              <li>A venda fica registrada como cancelada no histórico</li>
            </ul>
          </div>

          {!canCancelDirectly && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-center gap-1">
                <Shield size={14} />
                Você precisará da aprovação de um gerente ou administrador.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleContinue} 
              disabled={!cancelReason}
              className="flex-1"
            >
              {canCancelDirectly ? 'Confirmar Cancelamento' : 'Solicitar Aprovação'}
            </Button>
          </div>
        </div>
      ) : (
        // PASSO 2: Aprovação do Gerente/Admin
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Aprovação necessária</p>
                <p className="text-xs text-blue-700 mt-1">
                  Um gerente ou administrador precisa aprovar este cancelamento.
                </p>
              </div>
            </div>
          </div>

          {/* Resumo da venda */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Venda a ser cancelada:</p>
            <p className="text-sm font-medium">#{sale.sale_number} - {formatCurrency(sale.final_amount)}</p>
            <p className="text-xs text-gray-500 mt-1">Motivo: {cancelReason}</p>
          </div>

          {/* Seleção do Aprovador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o aprovador *
            </label>
            
            {/* Busca */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar aprovador..."
                value={searchApprover}
                onChange={(e) => setSearchApprover(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Lista de aprovadores */}
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {filteredApprovers.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">
                  Nenhum aprovador encontrado
                </p>
              ) : (
                filteredApprovers.map(approver => (
                  <label
                    key={approver.id}
                    className={`
                      flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors
                      ${selectedApprover === approver.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                    `}
                  >
                    <input
                      type="radio"
                      name="approver"
                      value={approver.id}
                      checked={selectedApprover === approver.id}
                      onChange={() => handleApproverSelect(approver.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {approver.full_name || approver.email}
                      </p>
                      <p className="text-xs text-gray-500">{approver.email}</p>
                    </div>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${approver.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}
                    `}>
                      {approver.role === 'admin' ? 'Admin' : 'Gerente'}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Senha do Aprovador */}
          {selectedApprover && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha do aprovador *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={approverPassword}
                  onChange={(e) => {
                    setApproverPassword(e.target.value)
                    setApprovalError('')
                  }}
                  placeholder="Digite a senha"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleValidateApproval()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {approvalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700 flex items-center gap-1">
                <AlertCircle size={14} />
                {approvalError}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={validatingApproval} 
              className="flex-1"
            >
              Voltar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleValidateApproval} 
              loading={validatingApproval}
              disabled={!selectedApprover || !approverPassword}
              className="flex-1"
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default CancelSaleModal
import React, { useState, useEffect } from 'react'
import {
  Shield, Save, RotateCcw, CheckCircle, XCircle,
  Lock, Unlock, Eye, AlertTriangle, Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import Modal from '../components/ui/Modal'

const RolePermissions = () => {
  const { profile, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState([])
  const [rolePermissions, setRolePermissions] = useState({})
  const [selectedRole, setSelectedRole] = useState('admin')
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  // Cores dos roles
  const roleColors = {
    admin: 'from-purple-600 to-purple-700',
    gerente: 'from-blue-500 to-cyan-500',
    operador: 'from-gray-500 to-gray-600'
  }

  const roleNames = {
    admin: 'Administrador',
    gerente: 'Gerente',
    operador: 'Operador'
  }

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/dashboard'
      return
    }
    loadData()
  }, [isAdmin])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar todas as permissões agrupadas por módulo
      const { data: perms, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
        .order('name', { ascending: true })

      if (permsError) throw permsError

      // Agrupar por módulo
      const grouped = {}
      perms?.forEach(p => {
        const module = p.module || 'outros'
        if (!grouped[module]) {
          grouped[module] = []
        }
        grouped[module].push(p)
      })
      setPermissions(grouped)

      // Carregar permissões de todos os roles
      const { data: rolePerms, error: roleError } = await supabase
        .from('role_permissions')
        .select('role_name, permission_id')

      if (roleError) throw roleError

      // Organizar por role (usando role_name)
      const roleMap = { admin: new Set(), gerente: new Set(), operador: new Set() }
      rolePerms?.forEach(rp => {
        if (roleMap[rp.role_name]) {
          roleMap[rp.role_name].add(rp.permission_id)
        }
      })
      
      // Converter Sets para objetos para facilitar verificação
      setRolePermissions({
        admin: setToObject(roleMap.admin),
        gerente: setToObject(roleMap.gerente),
        operador: setToObject(roleMap.operador)
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showFeedback('error', 'Erro ao carregar permissões')
    } finally {
      setLoading(false)
    }
  }

  const setToObject = (set) => {
    const obj = {}
    set.forEach(id => obj[id] = true)
    return obj
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const handleTogglePermission = (permissionId) => {
    // Proteção: admin sempre tem todas as permissões
    if (selectedRole === 'admin') {
      showFeedback('warning', 'Administrador sempre tem todas as permissões')
      return
    }

    setRolePermissions(prev => {
      const currentPerms = { ...prev[selectedRole] }
      if (currentPerms[permissionId]) {
        delete currentPerms[permissionId]
      } else {
        currentPerms[permissionId] = true
      }
      return {
        ...prev,
        [selectedRole]: currentPerms
      }
    })
    setHasChanges(true)
  }

  const handleToggleAllModule = (modulePermissions) => {
    if (selectedRole === 'admin') {
      showFeedback('warning', 'Administrador sempre tem todas as permissões')
      return
    }

    const allGranted = modulePermissions.every(p => rolePermissions[selectedRole]?.[p.id])
    
    setRolePermissions(prev => {
      const newPerms = { ...prev[selectedRole] }
      modulePermissions.forEach(p => {
        if (allGranted) {
          delete newPerms[p.id]
        } else {
          newPerms[p.id] = true
        }
      })
      return {
        ...prev,
        [selectedRole]: newPerms
      }
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    // Proteção extra: nunca salvar alterações para admin
    if (selectedRole === 'admin') {
      showFeedback('warning', 'Permissões do admin não podem ser alteradas')
      return
    }

    setSaving(true)
    try {
      const currentPerms = rolePermissions[selectedRole] || {}
      
      // 1. Deletar todas as permissões atuais do role
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_name', selectedRole)

      if (deleteError) throw deleteError

      // 2. Inserir as novas permissões
      const insertData = Object.keys(currentPerms).map(permId => ({
        role_name: selectedRole,
        permission_id: parseInt(permId)
      }))

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(insertData)

        if (insertError) throw insertError
      }

      showFeedback('success', `Permissões do ${roleNames[selectedRole]} salvas com sucesso!`)
      setHasChanges(false)
      
      // Recarregar dados para garantir sincronia
      await loadData()

    } catch (error) {
      console.error('Erro ao salvar:', error)
      showFeedback('error', 'Erro ao salvar permissões')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setShowResetModal(false)
    setSaving(true)
    
    try {
      // Deletar permissões atuais do role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_name', selectedRole)

      // Recriar permissões padrão
      const defaultPerms = getDefaultPermissions(selectedRole)
      const insertData = defaultPerms.map(permName => {
        const perm = Object.values(permissions).flat().find(p => p.name === permName)
        return perm ? { role_name: selectedRole, permission_id: perm.id } : null
      }).filter(Boolean)

      if (insertData.length > 0) {
        await supabase
          .from('role_permissions')
          .insert(insertData)
      }

      showFeedback('success', `Permissões do ${roleNames[selectedRole]} restauradas!`)
      await loadData()
      setHasChanges(false)

    } catch (error) {
      console.error('Erro ao resetar:', error)
      showFeedback('error', 'Erro ao restaurar permissões')
    } finally {
      setSaving(false)
    }
  }

  const getDefaultPermissions = (role) => {
    const defaults = {
      admin: Object.values(permissions).flat().map(p => p.name),
      gerente: [
        'canViewDashboard',
        'canViewSales', 'canCreateSales', 'canCancelSales', 'canViewSalesList', 'canApplyDiscount',
        'canViewProducts', 'canCreateProducts', 'canEditProducts', 'canManageStock',
        'canViewCustomers', 'canCreateCustomers', 'canEditCustomers', 'canCommunicateWithCustomers',
        'canViewCoupons', 'canCreateCoupons', 'canEditCoupons',
        'canViewCashier', 'canCloseCashier',
        'canViewReports', 'canExportReports'
      ],
      operador: [
        'canViewDashboard',
        'canViewSales', 'canCreateSales',
        'canViewProducts',
        'canViewCustomers', 'canCreateCustomers'
      ]
    }
    return defaults[role] || []
  }

  const getModuleStats = (modulePermissions) => {
    const granted = modulePermissions.filter(p => rolePermissions[selectedRole]?.[p.id]).length
    const total = modulePermissions.length
    return { granted, total, allGranted: granted === total, someGranted: granted > 0 && granted < total }
  }

  if (!isAdmin) return null

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={4} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="text-purple-600" />
                Gerenciamento de Permissões
              </h1>
              <p className="text-gray-600 mt-1">
                Defina quais funcionalidades cada função pode acessar no sistema
              </p>
            </div>
            
            <div className="flex gap-2">
              {hasChanges && (
                <>
                  <Button variant="outline" onClick={() => loadData()}>
                    <RotateCcw size={16} className="mr-1" />
                    Descartar
                  </Button>
                  <Button onClick={handleSave} loading={saving}>
                    <Save size={16} className="mr-1" />
                    Salvar Alterações
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false })}
            />
          </div>
        )}

        {/* Seletor de Role */}
        <div className="mb-6">
          <div className="flex gap-2">
            {['admin', 'gerente', 'operador'].map(role => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRole(role)
                  setHasChanges(false)
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                  ${selectedRole === role 
                    ? `bg-gradient-to-r ${roleColors[role]} text-white shadow-md` 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                {role === 'admin' && <Lock size={16} />}
                {role === 'gerente' && <Unlock size={16} />}
                {role === 'operador' && <Eye size={16} />}
                {roleNames[role]}
                {role === 'admin' && (
                  <span className="ml-1 text-xs opacity-75">(Todas)</span>
                )}
              </button>
            ))}
          </div>
          
          {selectedRole === 'admin' && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800 flex items-center gap-2">
                <Info size={16} />
                <span>
                  <strong>Administrador</strong> possui automaticamente todas as permissões do sistema.
                  Estas permissões não podem ser alteradas por questões de segurança.
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Permissões por Módulo */}
        <div className="space-y-4">
          {Object.entries(permissions).map(([module, modulePermissions]) => {
            const stats = getModuleStats(modulePermissions)
            
            return (
              <div key={module} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Cabeçalho do Módulo */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {module === 'dashboard' ? 'Dashboard' :
                         module === 'sales' ? 'Vendas' :
                         module === 'products' ? 'Produtos' :
                         module === 'customers' ? 'Clientes' :
                         module === 'cashier' ? 'Caixa' :
                         module === 'coupons' ? 'Cupons' :
                         module === 'reports' ? 'Relatórios' :
                         module === 'users' ? 'Usuários' :
                         module === 'system' ? 'Sistema' : module}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {stats.granted}/{stats.total} permissões
                      </span>
                    </div>
                    
                    {selectedRole !== 'admin' && (
                      <button
                        onClick={() => handleToggleAllModule(modulePermissions)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {stats.allGranted ? 'Desmarcar todos' : 'Marcar todos'}
                      </button>
                    )}
                  </div>
                  
                  {/* Barra de progresso */}
                  {selectedRole !== 'admin' && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          stats.allGranted ? 'bg-green-500' : 
                          stats.someGranted ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${(stats.granted / stats.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Lista de Permissões */}
                <div className="divide-y divide-gray-100">
                  {modulePermissions.map(permission => {
                    const granted = selectedRole === 'admin' 
                      ? true 
                      : rolePermissions[selectedRole]?.[permission.id] || false
                    
                    return (
                      <div
                        key={permission.id}
                        className={`
                          px-6 py-3 flex items-center justify-between
                          ${selectedRole !== 'admin' ? 'cursor-pointer hover:bg-gray-50' : ''}
                          transition-colors
                        `}
                        onClick={() => selectedRole !== 'admin' && handleTogglePermission(permission.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                            ${granted 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 text-transparent'
                            }
                          `}>
                            {granted && <CheckCircle size={14} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{permission.name}</p>
                            <p className="text-xs text-gray-500">{permission.description}</p>
                          </div>
                        </div>
                        
                        <div>
                          {granted ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle size={12} />
                              Permitido
                            </span>
                          ) : (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                              <XCircle size={12} />
                              Negado
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Aviso de Segurança */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                ⚠️ Área Sensível
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Alterações nas permissões afetam imediatamente o acesso dos usuários.
                Certifique-se de entender o impacto antes de salvar.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de ação fixos (quando há mudanças) */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 flex gap-2 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
            <Button variant="outline" size="sm" onClick={() => setShowResetModal(true)}>
              Restaurar Padrão
            </Button>
            <Button variant="outline" size="sm" onClick={loadData}>
              Descartar
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              <Save size={14} className="mr-1" />
              Salvar
            </Button>
          </div>
        )}

        {/* Modal de Confirmação de Reset */}
        <Modal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title="Restaurar Permissões Padrão"
          size="sm"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Tem certeza que deseja restaurar as permissões padrão para <strong>{roleNames[selectedRole]}</strong>?
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Esta ação irá sobrescrever todas as alterações feitas.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowResetModal(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleReset}>
                Restaurar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default RolePermissions
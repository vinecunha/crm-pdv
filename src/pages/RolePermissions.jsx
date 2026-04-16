import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield, Save, RotateCcw, CheckCircle, XCircle,
  Lock, Unlock, Eye, AlertTriangle, Info
} from '../lib/icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import Modal from '../components/ui/Modal'

const fetchPermissions = async () => {
  const [permsResult, rolePermsResult] = await Promise.all([
    supabase.from('permissions').select('*').order('module').order('name'),
    supabase.from('role_permissions').select('role_name, permission_id')
  ])

  if (permsResult.error) throw permsResult.error
  if (rolePermsResult.error) throw rolePermsResult.error

  const grouped = {}
  permsResult.data?.forEach(p => {
    const module = p.module || 'outros'
    if (!grouped[module]) grouped[module] = []
    grouped[module].push(p)
  })

  const roleMap = { admin: new Set(), gerente: new Set(), operador: new Set() }
  rolePermsResult.data?.forEach(rp => {
    if (roleMap[rp.role_name]) {
      roleMap[rp.role_name].add(rp.permission_id)
    }
  })

  const rolePermissions = {
    admin: setToObject(roleMap.admin),
    gerente: setToObject(roleMap.gerente),
    operador: setToObject(roleMap.operador)
  }

  return { permissions: grouped, rolePermissions }
}

const setToObject = (set) => {
  const obj = {}
  set.forEach(id => obj[id] = true)
  return obj
}

const saveRolePermissions = async ({ role, permissions }) => {
  const { error: deleteError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_name', role)

  if (deleteError) throw deleteError

  const insertData = Object.keys(permissions).map(permId => ({
    role_name: role,
    permission_id: parseInt(permId)
  }))

  if (insertData.length > 0) {
    const { error: insertError } = await supabase
      .from('role_permissions')
      .insert(insertData)

    if (insertError) throw insertError
  }

  return { role, permissions }
}

const resetRolePermissions = async ({ role, defaultPermissions }) => {
  await supabase.from('role_permissions').delete().eq('role_name', role)

  if (defaultPermissions.length > 0) {
    const { error } = await supabase
      .from('role_permissions')
      .insert(defaultPermissions)

    if (error) throw error
  }

  return { role }
}

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

const RolePermissions = () => {
  const { profile, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  
  const [selectedRole, setSelectedRole] = useState('admin')
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [showResetModal, setShowResetModal] = useState(false)
  const [localPermissions, setLocalPermissions] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  const { 
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
    staleTime: 30 * 60 * 1000,
    enabled: isAdmin,
  })

  const permissions = data?.permissions || {}
  const rolePermissions = data?.rolePermissions || {}

  const saveMutation = useMutation({
    mutationFn: saveRolePermissions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      showFeedback('success', `Permissões do ${roleNames[data.role]} salvas!`)
      setHasChanges(false)
    },
    onError: (error) => {
      showFeedback('error', 'Erro ao salvar permissões: ' + error.message)
    }
  })

  const resetMutation = useMutation({
    mutationFn: resetRolePermissions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      showFeedback('success', `Permissões do ${roleNames[data.role]} restauradas!`)
      setShowResetModal(false)
      setHasChanges(false)
    },
    onError: (error) => {
      showFeedback('error', 'Erro ao restaurar permissões')
    }
  })

  React.useEffect(() => {
    if (rolePermissions[selectedRole]) {
      setLocalPermissions({ ...rolePermissions[selectedRole] })
      setHasChanges(false)
    }
  }, [selectedRole, rolePermissions])

  React.useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/dashboard'
    }
  }, [isAdmin])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false }), 3000)
  }

  const handleTogglePermission = (permissionId) => {
    if (selectedRole === 'admin') {
      showFeedback('warning', 'Administrador sempre tem todas as permissões')
      return
    }

    setLocalPermissions(prev => {
      const newPerms = { ...prev }
      if (newPerms[permissionId]) {
        delete newPerms[permissionId]
      } else {
        newPerms[permissionId] = true
      }
      return newPerms
    })
    setHasChanges(true)
  }

  const handleToggleAllModule = (modulePermissions) => {
    if (selectedRole === 'admin') {
      showFeedback('warning', 'Administrador sempre tem todas as permissões')
      return
    }

    const allGranted = modulePermissions.every(p => localPermissions[p.id])
    
    setLocalPermissions(prev => {
      const newPerms = { ...prev }
      modulePermissions.forEach(p => {
        if (allGranted) {
          delete newPerms[p.id]
        } else {
          newPerms[p.id] = true
        }
      })
      return newPerms
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    if (selectedRole === 'admin') {
      showFeedback('warning', 'Permissões do admin não podem ser alteradas')
      return
    }

    saveMutation.mutate({
      role: selectedRole,
      permissions: localPermissions
    })
  }

  const handleReset = () => {
    const defaultPerms = getDefaultPermissions(selectedRole)
    const insertData = defaultPerms.map(permName => {
      const perm = Object.values(permissions).flat().find(p => p.name === permName)
      return perm ? { role_name: selectedRole, permission_id: perm.id } : null
    }).filter(Boolean)

    resetMutation.mutate({
      role: selectedRole,
      defaultPermissions: insertData
    })
  }

  const handleDiscardChanges = () => {
    setLocalPermissions({ ...rolePermissions[selectedRole] })
    setHasChanges(false)
  }

  const getDefaultPermissions = (role) => {
    const defaults = {
      admin: Object.values(permissions).flat().map(p => p.name),
      gerente: [
        'canViewDashboard', 'canViewSales', 'canCreateSales', 'canCancelSales',
        'canViewProducts', 'canCreateProducts', 'canEditProducts', 'canManageStock',
        'canViewCustomers', 'canCreateCustomers', 'canEditCustomers',
        'canViewCoupons', 'canCreateCoupons', 'canEditCoupons',
        'canViewCashier', 'canCloseCashier', 'canViewReports', 'canExportReports'
      ],
      operador: [
        'canViewDashboard', 'canViewSales', 'canCreateSales',
        'canViewProducts', 'canViewCustomers', 'canCreateCustomers'
      ]
    }
    return defaults[role] || []
  }

  const getModuleStats = (modulePermissions) => {
    const granted = modulePermissions.filter(p => 
      selectedRole === 'admin' ? true : localPermissions[p.id]
    ).length
    const total = modulePermissions.length
    return { granted, total, allGranted: granted === total, someGranted: granted > 0 && granted < total }
  }

  if (!isAdmin) return null
  if (isLoading) return <DataLoadingSkeleton type="cards" rows={4} />
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar permissões</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  const isMutating = saveMutation.isPending || resetMutation.isPending

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="text-purple-600 dark:text-purple-400" />
                Gerenciamento de Permissões
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Defina quais funcionalidades cada função pode acessar no sistema
              </p>
            </div>
            
            <div className="flex gap-2">
              {hasChanges && (
                <>
                  <Button variant="outline" onClick={handleDiscardChanges} disabled={isMutating}>
                    <RotateCcw size={16} className="mr-1" />
                    Descartar
                  </Button>
                  <Button onClick={handleSave} loading={saveMutation.isPending} disabled={isMutating}>
                    <Save size={16} className="mr-1" />
                    Salvar Alterações
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false })}
            />
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2">
            {['admin', 'gerente', 'operador'].map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                  ${selectedRole === role 
                    ? `bg-gradient-to-r ${roleColors[role]} text-white shadow-md` 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
                disabled={isMutating}
              >
                {role === 'admin' && <Lock size={16} />}
                {role === 'gerente' && <Unlock size={16} />}
                {role === 'operador' && <Eye size={16} />}
                {roleNames[role]}
              </button>
            ))}
          </div>
          
          {selectedRole === 'admin' && (
            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-purple-800 dark:text-purple-300 flex items-center gap-2">
                <Info size={16} />
                <span>
                  <strong>Administrador</strong> possui automaticamente todas as permissões do sistema.
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {Object.entries(permissions).map(([module, modulePermissions]) => {
            const stats = getModuleStats(modulePermissions)
            
            return (
              <div key={module} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-950/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {module === 'dashboard' ? 'Dashboard' : module}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stats.granted}/{stats.total} permissões
                      </span>
                    </div>
                    
                    {selectedRole !== 'admin' && (
                      <button
                        onClick={() => handleToggleAllModule(modulePermissions)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        disabled={isMutating}
                      >
                        {stats.allGranted ? 'Desmarcar todos' : 'Marcar todos'}
                      </button>
                    )}
                  </div>
                  
                  {selectedRole !== 'admin' && (
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          stats.allGranted ? 'bg-green-500' : 
                          stats.someGranted ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        style={{ width: `${(stats.granted / stats.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {modulePermissions.map(permission => {
                    const granted = selectedRole === 'admin' 
                      ? true 
                      : localPermissions[permission.id] || false
                    
                    return (
                      <div
                        key={permission.id}
                        className={`
                          px-6 py-3 flex items-center justify-between
                          ${selectedRole !== 'admin' && !isMutating ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
                          transition-colors
                        `}
                        onClick={() => selectedRole !== 'admin' && !isMutating && handleTogglePermission(permission.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                            ${granted 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 dark:border-gray-600 text-transparent'
                            }
                          `}>
                            {granted && <CheckCircle size={14} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{permission.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{permission.description}</p>
                          </div>
                        </div>
                        
                        <div>
                          {granted ? (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle size={12} />
                              Permitido
                            </span>
                          ) : (
                            <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
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

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">⚠️ Área Sensível</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Alterações nas permissões afetam imediatamente o acesso dos usuários.
              </p>
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="fixed bottom-6 right-6 flex gap-2 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={() => setShowResetModal(true)} disabled={isMutating}>
              Restaurar Padrão
            </Button>
            <Button variant="outline" size="sm" onClick={handleDiscardChanges} disabled={isMutating}>
              Descartar
            </Button>
            <Button size="sm" onClick={handleSave} loading={saveMutation.isPending} disabled={isMutating}>
              <Save size={14} className="mr-1" />
              Salvar
            </Button>
          </div>
        )}

        <Modal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title="Restaurar Permissões Padrão"
          size="sm"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Tem certeza que deseja restaurar as permissões padrão para <strong>{roleNames[selectedRole]}</strong>?
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowResetModal(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleReset} loading={resetMutation.isPending}>
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
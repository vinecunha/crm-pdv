import React, { useState, useEffect } from 'react'
import { Lock, Key, UserCheck, Save, RotateCcw, CheckCircle } from '@lib/icons'
import { supabase } from '@lib/supabase'
import FeedbackMessage from '../ui/FeedbackMessage'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

const PermissionsSettingsTab = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState([])
  const [rolePermissions, setRolePermissions] = useState({})
  const [selectedRole, setSelectedRole] = useState('gerente')
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  const roleConfig = {
    admin: { name: 'Administrador', icon: Lock, color: 'purple', gradient: 'from-purple-600 to-purple-700' },
    gerente: { name: 'Gerente', icon: Key, color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
    operador: { name: 'Operador', icon: UserCheck, color: 'gray', gradient: 'from-gray-500 to-gray-600' }
  }

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: perms } = await supabase.from('permissions').select('*').order('module').order('name')
      const grouped = {}
      perms?.forEach(p => { const m = p.module || 'outros'; if (!grouped[m]) grouped[m] = []; grouped[m].push(p) })
      setPermissions(grouped)

      const { data: rolePerms } = await supabase.from('role_permissions').select('role_name, permission_id')
      const roleMap = { admin: new Set(), gerente: new Set(), operador: new Set() }
      rolePerms?.forEach(rp => { if (roleMap[rp.role_name]) roleMap[rp.role_name].add(rp.permission_id) })
      
      setRolePermissions({
        admin: Object.fromEntries([...roleMap.admin].map(id => [id, true])),
        gerente: Object.fromEntries([...roleMap.gerente].map(id => [id, true])),
        operador: Object.fromEntries([...roleMap.operador].map(id => [id, true]))
      })
    } catch (error) {
      showFeedback('error', 'Erro ao carregar permissões')
    } finally {
      setLoading(false)
    }
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false }), 3000)
  }

  const handleTogglePermission = (permissionId) => {
    if (selectedRole === 'admin') return showFeedback('warning', 'Admin tem todas as permissões')
    setRolePermissions(prev => {
      const current = { ...prev[selectedRole] }
      current[permissionId] ? delete current[permissionId] : current[permissionId] = true
      return { ...prev, [selectedRole]: current }
    })
    setHasChanges(true)
  }

  const handleToggleModule = (modulePermissions) => {
    if (selectedRole === 'admin') return showFeedback('warning', 'Admin tem todas as permissões')
    const allGranted = modulePermissions.every(p => rolePermissions[selectedRole]?.[p.id])
    setRolePermissions(prev => {
      const current = { ...prev[selectedRole] }
      modulePermissions.forEach(p => allGranted ? delete current[p.id] : current[p.id] = true)
      return { ...prev, [selectedRole]: current }
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (selectedRole === 'admin') return
    setSaving(true)
    try {
      await supabase.from('role_permissions').delete().eq('role_name', selectedRole)
      const inserts = Object.keys(rolePermissions[selectedRole] || {}).map(id => ({ role_name: selectedRole, permission_id: parseInt(id) }))
      if (inserts.length) await supabase.from('role_permissions').insert(inserts)
      showFeedback('success', `Permissões salvas!`)
      setHasChanges(false)
      await loadData()
    } catch (error) {
      showFeedback('error', 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const getModuleStats = (perms) => {
    const granted = perms.filter(p => rolePermissions[selectedRole]?.[p.id]).length
    return { granted, total: perms.length, allGranted: granted === perms.length }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}

      <div>
        <h2 className="block font-medium text-gray-700 m-3 dark:text-gray-300">Função</h2>
        <div className="flex gap-2 mx-3">
          {Object.entries(roleConfig).map(([role, config]) => {
            const Icon = config.icon
            return (
              <button
                key={role}
                onClick={() => { setSelectedRole(role); setHasChanges(false) }}
                disabled={role === 'admin'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  selectedRole === role 
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-md` 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={16} /> {config.name}
              </button>
            )
          })}
        </div>
        {selectedRole === 'admin' && (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300">
            Administrador possui todas as permissões automaticamente.
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
        {Object.entries(permissions).map(([module, modulePerms]) => {
          const stats = getModuleStats(modulePerms)
          const moduleNames = { dashboard: 'Dashboard', sales: 'Vendas', products: 'Produtos', customers: 'Clientes', cashier: 'Caixa', coupons: 'Cupons', reports: 'Relatórios', users: 'Usuários', system: 'Sistema' }
          
          return (
            <div key={module} className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-gray-900 dark:border-gray-700">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 dark:bg-black/50 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">{moduleNames[module] || module}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{stats.granted}/{stats.total}</span>
                  </div>
                  {selectedRole !== 'admin' && (
                    <button onClick={() => handleToggleModule(modulePerms)} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      {stats.allGranted ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  )}
                </div>
                {selectedRole !== 'admin' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1 dark:bg-gray-800">
                    <div className={`h-1 rounded-full transition-all ${stats.allGranted ? 'bg-green-500' : stats.granted > 0 ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-700'}`} style={{ width: `${(stats.granted / stats.total) * 100}%` }} />
                  </div>
                )}
              </div>
              
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {modulePerms.map(permission => {
                  const granted = selectedRole === 'admin' ? true : rolePermissions[selectedRole]?.[permission.id] || false
                  return (
                    <div key={permission.id} className={`px-4 py-2 flex items-center justify-between ${selectedRole !== 'admin' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`} onClick={() => selectedRole !== 'admin' && handleTogglePermission(permission.id)}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${granted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                          {granted && <CheckCircle size={10} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{permission.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{permission.description}</p>
                        </div>
                      </div>
                      <span className={`text-xs ${granted ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{granted ? 'Permitido' : 'Negado'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {hasChanges && (
        <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
          <Button variant="outline" size="sm" onClick={() => setShowResetModal(true)} icon={RotateCcw}>Restaurar</Button>
          <Button variant="outline" size="sm" onClick={loadData}>Descartar</Button>
          <Button size="sm" onClick={handleSave} loading={saving} icon={Save}>Salvar</Button>
        </div>
      )}

      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Restaurar Padrão" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Restaurar permissões padrão para {roleConfig[selectedRole].name}?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowResetModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={async () => { setShowResetModal(false); await loadData(); setHasChanges(false) }}>Restaurar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PermissionsSettingsTab
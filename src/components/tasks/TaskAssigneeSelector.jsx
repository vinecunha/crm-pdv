import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@lib/supabase'
import { Users, X, ChevronDown, Search } from '@lib/icons'

const TaskAssigneeSelector = ({ value = [], names = [], onChange, disabled = false }) => {
  const [teamMembers, setTeamMembers] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef(null)
  
  useEffect(() => {
    fetchTeamMembers()
  }, [])
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])
  
  const fetchTeamMembers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('status', 'active')
      .order('full_name')
    
    setTeamMembers(data || [])
    setLoading(false)
  }
  
  const filteredMembers = teamMembers.filter(m => {
    const name = (m.full_name || m.email || '').toLowerCase()
    return name.includes(searchTerm.toLowerCase())
  })
  
  const toggleMember = (memberId, memberName) => {
    const newIds = value.includes(memberId)
      ? value.filter(id => id !== memberId)
      : [...value, memberId]
    
    const newNames = teamMembers
      .filter(m => newIds.includes(m.id))
      .map(m => m.full_name || m.email)
    
    onChange(newIds, newNames)
  }
  
  const selectAll = () => {
    const allIds = filteredMembers.map(m => m.id)
    const allNames = filteredMembers.map(m => m.full_name || m.email)
    onChange(allIds, allNames)
  }
  
  const clearAll = () => {
    onChange([], [])
  }
  
  const getDisplayText = () => {
    if (value.length === 0) return 'Ninguém (equipe toda pode ver/pegar)'
    if (value.length === teamMembers.length) return 'Todos da equipe'
    if (value.length === 1) return names[0] || '1 pessoa'
    return `${value.length} pessoas selecionadas`
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Atribuir para
      </label>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-sm text-left
          bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600 
          rounded-lg
          flex items-center justify-between
          transition-colors
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
          }
        `}
      >
        <span className="truncate flex items-center gap-2">
          <Users size={14} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{getDisplayText()}</span>
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          {/* Barra de busca */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar membro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Ações rápidas */}
          <div className="flex gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Selecionar todos
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
            >
              Limpar
            </button>
          </div>
          
          {/* Lista de membros */}
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                Nenhum membro encontrado
              </p>
            ) : (
              filteredMembers.map(member => (
                <label
                  key={member.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(member.id)}
                    onChange={() => toggleMember(member.id, member.full_name || member.email)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.full_name || member.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {member.email}
                    </p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    member.role === 'admin' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : member.role === 'gerente'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {member.role}
                  </span>
                </label>
              ))
            )}
          </div>
          
          {/* Rodapé */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {value.length} de {teamMembers.length} selecionados
            </p>
          </div>
        </div>
      )}
      
      {value.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 Vazio = visível para toda equipe
        </p>
      )}
    </div>
  )
}

export default TaskAssigneeSelector
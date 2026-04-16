import React, { useEffect, useRef, useCallback } from 'react'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'

// Funções de máscara
const applyMask = (value, mask) => {
  if (!value) return ''
  
  let cleanValue = value.replace(/\D/g, '')
  let maskedValue = ''
  let valueIndex = 0

  for (let i = 0; i < mask.length && valueIndex < cleanValue.length; i++) {
    if (mask[i] === '9') {
      maskedValue += cleanValue[valueIndex]
      valueIndex++
    } else {
      maskedValue += mask[i]
    }
  }

  return maskedValue
}

const getMask = (maskType, value) => {
  switch (maskType) {
    case 'phone':
      const clean = value?.replace(/\D/g, '') || ''
      return clean.length <= 10 ? '(99) 9999-9999' : '(99) 99999-9999'
    case 'cpf':
      return '999.999.999-99'
    case 'cnpj':
      return '99.999.999/9999-99'
    case 'cpfCnpj':
      const cleanDoc = value?.replace(/\D/g, '') || ''
      return cleanDoc.length <= 11 ? '999.999.999-99' : '99.999.999/9999-99'
    case 'cep':
      return '99999-999'
    case 'currency':
      return null // Tratamento especial
    default:
      return null
  }
}

// Placeholder padrão baseado na máscara
const getPlaceholder = (mask) => {
  const placeholders = {
    phone: '(11) 99999-9999',
    cpf: '123.456.789-00',
    cnpj: '12.345.678/0001-90',
    cpfCnpj: 'CPF ou CNPJ',
    cep: '12345-678'
  }
  return placeholders[mask] || ''
}

// Formatar descrição do atalho
const formatShortcutHint = (shortcut) => {
  if (!shortcut) return null
  
  const keys = []
  if (shortcut.ctrl) keys.push('⌘')
  if (shortcut.alt) keys.push('⌥')
  if (shortcut.shift) keys.push('⇧')
  
  let key = shortcut.key
  if (key === 'Enter') key = '↵'
  else if (key === 'Escape') key = 'Esc'
  else if (key === ' ') key = '␣'
  else key = key.toUpperCase()
  
  keys.push(key)
  
  return keys.join('')
}

const FormInput = ({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  required = false,
  disabled = false,
  placeholder,
  error,
  helperText,
  icon: Icon,
  autoComplete = 'off',
  mask = null,
  maxLength = null,
  min = null,
  max = null,
  step = null,
  
  // NOVAS PROPS PARA ATALHOS
  shortcut = null,
  shortcutAction = null,
  autoFocus = false,
  focusOnShortcut = true,
  onShortcutTriggered = null,
  showShortcutHint = true,
  shortcutEnabled = true
}) => {
  const inputRef = useRef(null)

  // Handler para quando o atalho é acionado
  const handleShortcut = useCallback((event) => {
    if (disabled) return
    if (!shortcutEnabled) return
    
    // Focar o input se configurado
    if (focusOnShortcut && inputRef.current) {
      inputRef.current.focus()
      
      // Selecionar texto se já tiver valor
      if (value && inputRef.current.select) {
        inputRef.current.select()
      }
    }
    
    // Executar ação personalizada
    if (shortcutAction) {
      shortcutAction(event, inputRef.current)
    }
    
    // Callback de notificação
    if (onShortcutTriggered) {
      onShortcutTriggered(shortcut)
    }
  }, [disabled, shortcutEnabled, focusOnShortcut, value, shortcutAction, onShortcutTriggered, shortcut])

  // Registrar atalho de teclado
  useKeyboardShortcuts(
    shortcut ? [{
      ...shortcut,
      handler: handleShortcut,
      enabled: shortcutEnabled && !disabled
    }] : [],
    { enabled: shortcutEnabled && !disabled }
  )

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleChange = (e) => {
    let newValue = e.target.value
    
    // Aplicar máscara se necessário
    if (mask) {
      const maskPattern = getMask(mask, newValue)
      if (maskPattern) {
        newValue = applyMask(newValue, maskPattern)
      }
    }
    
    // Limitar tamanho
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength)
    }
    
    // Criar evento sintético
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: newValue
      }
    }
    
    onChange(syntheticEvent)
  }

  // Handler para tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Prevenir submit do form se não for textarea
      if (type !== 'textarea') {
        e.preventDefault()
      }
      
      // Disparar evento personalizado
      const enterEvent = new CustomEvent('forminput:enter', {
        detail: { name, value, inputRef: inputRef.current }
      })
      window.dispatchEvent(enterEvent)
    }
  }

  const shortcutHint = shortcut && showShortcutHint ? formatShortcutHint(shortcut) : null

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
            {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          </label>
          
          {/* Indicador de atalho no label */}
          {shortcutHint && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300">
                {shortcutHint}
              </kbd>
              {shortcut.description && (
                <span className="hidden sm:inline">{shortcut.description}</span>
              )}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <Icon size={18} />
          </div>
        )}
        
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          required={required}
          disabled={disabled}
          placeholder={placeholder || getPlaceholder(mask)}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          className={`
            w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
            ${Icon ? 'pl-10' : ''}
            ${shortcutHint && showShortcutHint ? 'pr-16' : ''}
            ${error 
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-800' 
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800'
            }
            ${disabled ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}
            placeholder-gray-400 dark:placeholder-gray-500
          `}
        />
        
        {/* Indicador de atalho dentro do input */}
        {shortcutHint && showShortcutHint && !Icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400">
              {shortcutHint}
            </kbd>
          </div>
        )}
        
        {/* Indicador de atalho quando tem ícone (posição ajustada) */}
        {shortcutHint && showShortcutHint && Icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400">
              {shortcutHint}
            </kbd>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>
      )}
      
      {/* Dica de atalho adicional */}
      {shortcut && shortcut.description && showShortcutHint && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
          Atalho: {shortcut.description}
        </p>
      )}
    </div>
  )
}

export default FormInput
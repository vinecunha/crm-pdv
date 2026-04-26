import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, EyeOff, X, CheckCircle } from '@lib/icons'
import { useKeyboardShortcuts } from '@/hooks/utils/useKeyboardShortcuts'

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
  onBlur,
  required = false,
  disabled = false,
  loading = false,
  placeholder,
  error: externalError,
  helperText,
  icon: Icon,
  autoComplete = 'off',
  mask = null,
  maxLength = null,
  min = null,
  max = null,
  step = null,
  rows = 3,
  clearable = true,
  showPasswordToggle = true,
  showCharCounter = true,
  validateOnBlur = true,
  validationRules = {},
  
  // Props de atalho
  shortcut = null,
  shortcutAction = null,
  autoFocus = false,
  focusOnShortcut = true,
  onShortcutTriggered = null,
  showShortcutHint = true,
  shortcutEnabled = true,
  rightElement = null
}) => {
  const inputRef = useRef(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [internalError, setInternalError] = useState('')

  // Validação
  const validate = useCallback((val) => {
    if (required && !val) return 'Campo obrigatório'
    
    if (type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return 'Email inválido'
    }
    
    if (validationRules.pattern && val && !validationRules.pattern.test(val)) {
      return validationRules.message || 'Formato inválido'
    }
    
    if (validationRules.minLength && val.length < validationRules.minLength) {
      return `Mínimo ${validationRules.minLength} caracteres`
    }
    
    if (validationRules.maxLength && val.length > validationRules.maxLength) {
      return `Máximo ${validationRules.maxLength} caracteres`
    }
    
    if (validationRules.custom) {
      return validationRules.custom(val) || ''
    }
    
    return ''
  }, [required, type, validationRules])

  // Handler para quando o atalho é acionado
  const handleShortcut = useCallback((event) => {
    if (disabled || loading) return
    if (!shortcutEnabled) return
    
    if (focusOnShortcut && inputRef.current) {
      inputRef.current.focus()
      if (value && inputRef.current.select) {
        inputRef.current.select()
      }
    }
    
    if (shortcutAction) {
      shortcutAction(event, inputRef.current)
    }
    
    if (onShortcutTriggered) {
      onShortcutTriggered(shortcut)
    }
  }, [disabled, loading, shortcutEnabled, focusOnShortcut, value, shortcutAction, onShortcutTriggered, shortcut])

  // Registrar atalho
  useKeyboardShortcuts(
    shortcut ? [{
      ...shortcut,
      handler: handleShortcut,
      enabled: shortcutEnabled && !disabled && !loading
    }] : [],
    { enabled: shortcutEnabled && !disabled && !loading }
  )

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [autoFocus, disabled])

  const handleChange = (e) => {
    let newValue = e.target.value
    
    if (mask) {
      const maskPattern = getMask(mask, newValue)
      if (maskPattern) {
        newValue = applyMask(newValue, maskPattern)
      }
    }
    
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength)
    }
    
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: newValue
      },
      // Para compatibilidade com padrão React
      preventDefault: () => {},
      stopPropagation: () => {}
    }
    
    onChange(syntheticEvent)
    
    // Limpar erro interno ao digitar
    if (internalError) {
      setInternalError('')
    }
  }

  const handleBlur = (e) => {
    setIsTouched(true)
    setIsFocused(false)
    
    if (validateOnBlur) {
      const error = validate(value)
      setInternalError(error)
    }
    
    onBlur?.(e)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && type !== 'textarea') {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('forminput:enter', {
        detail: { name, value, inputRef: inputRef.current }
      }))
    }
  }

  const handleClear = () => {
    onChange({ target: { name, value: '' } })
    inputRef.current?.focus()
    setInternalError('')
  }

  const error = externalError || internalError
  const isValid = isTouched && !error && value && !loading
  const showClearButton = clearable && value && !disabled && !loading
  const showPasswordButton = type === 'password' && showPasswordToggle && value && !disabled && !loading
  const showSuccessIcon = isValid && !showClearButton && !showPasswordButton
  const shortcutHint = shortcut && showShortcutHint ? formatShortcutHint(shortcut) : null
  
  const InputComponent = type === 'textarea' ? 'textarea' : 'input'

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {shortcutHint && (
            <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
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
        {/* Ícone esquerdo */}
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        
        {/* Input/Textarea */}
        <InputComponent
          ref={inputRef}
          type={type === 'textarea' ? undefined : (type === 'password' && showPassword ? 'text' : type)}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          required={required}
          disabled={disabled || loading}
          placeholder={placeholder || getPlaceholder(mask)}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          rows={type === 'textarea' ? rows : undefined}
          className={`
            w-full px-3 py-2 border rounded-lg transition-all
            focus:outline-none focus:ring-2
            ${Icon ? 'pl-10' : ''}
            ${(showClearButton || showPasswordButton || showSuccessIcon || loading || shortcutHint) ? 'pr-10' : ''}
            
            /* Estados de erro */
            ${error 
              ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30' 
              : isValid
                ? 'border-green-300 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-200 dark:focus:ring-green-900/30'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-200 dark:focus:ring-blue-900/30'
            }
            
            /* Estados de disabled/loading */
            ${(disabled || loading) 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
            }
            
            /* Placeholder */
            placeholder-gray-400 dark:placeholder-gray-500
            
            /* Textarea específico */
            ${type === 'textarea' ? 'resize-y min-h-[80px]' : ''}
          `}
        />
        
        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500" />
          </div>
        )}
        
        {/* Ícone de sucesso */}
        {showSuccessIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <CheckCircle size={18} />
          </div>
        )}
        
        {/* Botão de mostrar senha */}
        {showPasswordButton && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
            title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        
        {/* Botão de limpar */}
        {showClearButton && !showPasswordButton && !rightElement && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
            title="Limpar"
          >
            <X size={16} />
          </button>
        )}
        
        {/* Elemento direito customizado */}
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-auto">
            {rightElement}
          </div>
        )}
        
        {/* Contador de caracteres */}
        {showCharCounter && maxLength && isFocused && (
          <div className="absolute right-3 -bottom-5 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      
      {/* Mensagem de erro */}
      {error && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-red-400 rounded-full" />
          {error}
        </p>
      )}
      
      {/* Helper text */}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  )
}

export default FormInput

import React from 'react'

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
  mask = null,        // NOVO: 'phone', 'cpf', 'cnpj', 'cpfCnpj', 'cep'
  maxLength = null,   // NOVO: limite de caracteres
  min = null,
  max = null,
  step = null
}) => {
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

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
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
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
      </div>
      
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  )
}

// Função auxiliar para placeholder padrão
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

export default FormInput
import DOMPurify from 'dompurify'

const purifyConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
}

export const sanitizeInput = (input) => {
  if (input === null || input === undefined) return ''
  if (typeof input !== 'string') return input
  return DOMPurify.sanitize(input, purifyConfig).trim()
}

export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      )
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export const sanitizeFields = (obj, fieldsToSanitize) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = { ...obj }
  fieldsToSanitize.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeInput(sanitized[field])
    }
  })
  return sanitized
}

export const isSafeString = (str) => {
  if (typeof str !== 'string') return false
  const sanitized = sanitizeInput(str)
  return sanitized === str
}

export const escapeHtml = (text) => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return String(text).replace(/[&<>"']/g, m => map[m])
}

export default {
  sanitizeInput,
  sanitizeObject,
  sanitizeFields,
  isSafeString,
  escapeHtml
}
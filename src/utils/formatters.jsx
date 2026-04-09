export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

export const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR')
}

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('pt-BR')
}
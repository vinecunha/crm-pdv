import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').transform(v => v.replace(/\D/g, '')),
  document: z.string().optional().transform(v => v ? v.replace(/\D/g, '') : null),
  zip_code: z.string().length(8, 'CEP deve ter 8 dígitos').optional().or(z.literal('')).transform(v => v ? v.replace(/\D/g, '') : null),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  birth_date: z.string().optional(),
  status: z.string().default('active')
})

export const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  cost_price: z.number({ invalid_type_error: 'Preço de custo inválido' }).min(0, 'Preço não pode ser negativo').optional(),
  sale_price: z.number({ invalid_type_error: 'Preço de venda inválido' }).min(0, 'Preço não pode ser negativo'),
  stock: z.number({ invalid_type_error: 'Estoque inválido' }).int('Estoque deve ser inteiro').min(0, 'Estoque não pode ser negativo').default(0),
  min_stock: z.number({ invalid_type_error: 'Estoque mínimo inválido' }).int('Estoque deve ser inteiro').min(0, 'Estoque não pode ser negativo').default(0),
  unit: z.string().default('un'),
  status: z.string().default('active')
})

export const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  role: z.enum(['admin', 'gerente', 'vendedor'], { error_message: 'Selecione um perfil' }),
  status: z.string().default('active')
})

export const couponSchema = z.object({
  code: z.string().min(3, 'Código deve ter pelo menos 3 caracteres').toUpperCase(),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.number({ invalid_type_error: 'Valor inválido' }).min(0, 'Valor não pode ser negativo'),
  min_purchase: z.number({ invalid_type_error: 'Valor mínimo inválido' }).min(0, 'Valor não pode ser negativo').default(0),
  max_discount: z.number({ invalid_type_error: 'Desconto máximo inválido' }).min(0, 'Valor não pode ser negativo').optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  usage_limit: z.number().int('Limite deve ser inteiro').min(1, 'Limite deve ser pelo menos 1').optional(),
  applicable_products: z.array(z.number()).optional(),
  applicable_categories: z.array(z.number()).optional(),
  status: z.string().default('active')
})

export const quickCustomerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').transform(v => v ? v.replace(/\D/g, '') : undefined),
  document: z.string().optional().transform(v => v ? v.replace(/\D/g, '') : undefined)
})
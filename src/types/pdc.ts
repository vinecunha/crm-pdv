export interface CartItem {
  id: number
  name: string
  code: string | null
  quantity: number
  price: number
  total: number
  unit?: string
  product_id?: number
  product_name?: string
  unit_price?: number
  [key: string]: unknown
}

export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  document?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  birth_date?: string | null
  status?: string | null
  [key: string]: unknown
}

export interface Coupon {
  id: number
  code: string
  name?: string
  description?: string | null
  discount_type: 'fixed' | 'percent'
  discount_value: number
  max_discount?: number | null
  min_purchase?: number | null
  is_global?: boolean | null
  is_active?: boolean | null
  valid_from?: string | null
  valid_to?: string | null
  usage_limit?: number | null
  used_count?: number | null
  [key: string]: unknown
}

export interface Product {
  id: number
  code?: string | null
  name: string
  description?: string | null
  category?: string | null
  brand?: string | null
  unit?: string
  price?: number
  stock_quantity?: number
  min_stock?: number | null
  max_stock?: number | null
  location?: string | null
  weight?: number | string | null
  is_active?: boolean
  deleted_at?: string | null
  [key: string]: unknown
}

export interface Discount {
  type: 'fixed' | 'percent'
  value: number
}

export interface Sale {
  id: number
  sale_number: string
  customer_id: number | null
  customer_name: string | null
  customer_phone: string | null
  total_amount: number
  discount_amount: number | null
  discount_percent: number | null
  coupon_code: string | null
  final_amount: number
  payment_method: string | null
  payment_status: string | null
  status: string | null
  notes: string | null
  created_at: string | null
  created_by: string | null
  updated_at: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  cancellation_notes: string | null
  approved_by: string | null
  created_by_name: string | null
  [key: string]: unknown
}

export interface Budget {
  id: number
  budget_number: number
  customer_id: number | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  total_amount: number
  discount_amount: number | null
  discount_percent: number | null
  coupon_code: string | null
  final_amount: number
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'converted'
  valid_until: string | null
  notes: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  approved_by: string | null
  approved_at: string | null
  converted_sale_id: number | null
  [key: string]: unknown
}

export interface BudgetItem {
  id: number
  budget_id: number | null
  product_id: number | null
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
  total_price: number
  unit: string | null
  created_at: string | null
  [key: string]: unknown
}

export interface Profile {
  id: string
  email?: string
  role?: string
  full_name?: string | null
  registration_number?: string | null
  status?: string | null
  [key: string]: unknown
}

export interface SaleItem {
  product_id: number
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
  total_price: number
  [key: string]: unknown
}
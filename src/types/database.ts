// ============================================
// Tipos base do Supabase/Auth
// ============================================
export type UUID = string;
export type Timestamp = string; // ISO 8601 format
export type Json = Record<string, unknown>;

// ============================================
// Budget Items
// ============================================
export interface BudgetItem {
  id: number;
  budget_id: number | null;
  product_id: number | null;
  product_name: string;
  product_code: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string | null;
  created_at: Timestamp | null;
}

export interface BudgetItemInsert {
  budget_id?: number | null;
  product_id?: number | null;
  product_name: string;
  product_code?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit?: string | null;
}

export interface BudgetItemUpdate extends Partial<BudgetItemInsert> {
  id: number;
}

// ============================================
// Budgets
// ============================================
export type BudgetStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "converted";

export interface Budget {
  id: number;
  budget_number: number;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  total_amount: number;
  discount_amount: number | null;
  discount_percent: number | null;
  coupon_code: string | null;
  final_amount: number;
  status: BudgetStatus | null;
  valid_until: string | null;
  notes: string | null;
  created_by: UUID | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  approved_by: UUID | null;
  approved_at: Timestamp | null;
  converted_sale_id: number | null;
}

export interface BudgetInsert {
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  total_amount?: number;
  discount_amount?: number | null;
  discount_percent?: number | null;
  coupon_code?: string | null;
  final_amount?: number;
  status?: BudgetStatus | null;
  valid_until?: string | null;
  notes?: string | null;
  created_by?: UUID | null;
  approved_by?: UUID | null;
  converted_sale_id?: number | null;
}

export interface BudgetUpdate extends Partial<BudgetInsert> {
  id: number;
}

// ============================================
// Cashier Closing
// ============================================
export interface CashierClosing {
  id: number;
  closing_date: string; // date
  start_time: Timestamp | null;
  end_time: Timestamp | null;
  total_sales: number | null;
  total_discounts: number | null;
  total_cancellations: number | null;
  total_cash: number | null;
  total_card: number | null;
  total_pix: number | null;
  expected_total: number | null;
  declared_total: number | null;
  difference: number | null;
  notes: string | null;
  closed_by: UUID | null;
  closed_at: Timestamp | null;
  status: string | null;
  details: Json | null;
  created_at: Timestamp | null;
}

// ============================================
// Companies
// ============================================
export interface Company {
  id: UUID;
  name: string;
  slug: string;
  domain: string | null;
  settings: Json | null;
  status: string | null;
  created_at: string | null; // timestamp without timezone
  updated_at: string | null; // timestamp without timezone
}

// ============================================
// Company Settings
// ============================================
export interface CompanySettings {
  id: UUID;
  company_name: string;
  company_logo: string | null;
  company_logo: string | null;
  favicon: string | null;
  domain: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  cnpj: string | null;
  social_media: Json | null;
  primary_color: string | null;
  secondary_color: string | null;
  custom_css: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// Coupons
// ============================================
export type DiscountType = "fixed" | "percent";

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount: number | null;
  min_purchase: number | null;
  is_global: boolean | null;
  is_active: boolean | null;
  valid_from: Timestamp | null;
  valid_to: Timestamp | null;
  usage_limit: number | null;
  used_count: number | null;
  created_at: Timestamp | null;
  created_by: UUID | null;
  updated_at: Timestamp | null;
  updated_by: UUID | null;
  deleted_at: Timestamp | null;
  deleted_by: UUID | null;
}

// ============================================
// Coupon Allowed Customers
// ============================================
export interface CouponAllowedCustomer {
  id: number;
  coupon_id: number | null;
  customer_id: number | null;
  created_at: Timestamp | null;
}

// ============================================
// Customer Coupons
// ============================================
export interface CustomerCoupon {
  id: number;
  coupon_id: number | null;
  customer_id: number | null;
  sale_id: number | null;
  used_at: Timestamp | null;
}

// ============================================
// Customers
// ============================================
export type CustomerStatus = "active" | "inactive";
export type RFVScore = string; // char(3)

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  birth_date: string | null; // date
  status: CustomerStatus | null;
  total_purchases: number | null;
  last_purchase: string | null; // date
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  deleted_at: Timestamp | null;
  deleted_by: UUID | null;
  rfv_score: RFVScore | null;
  rfv_recency: number | null;
  rfv_frequency: number | null;
  rfv_monetary: number | null;
}

// ============================================
// Customer Communications
// ============================================
export type CommunicationChannel = string; // WhatsApp, Email, etc
export type CommunicationStatus = "sent" | "delivered" | "read" | "failed";

export interface CustomerCommunication {
  id: UUID;
  customer_id: number;
  channel: CommunicationChannel;
  subject: string | null;
  content: string;
  status: CommunicationStatus | null;
  sent_by: UUID | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  details: Json | null;
}

// ============================================
// Login Attempts
// ============================================
export interface LoginAttempt {
  id: UUID;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  attempts: number | null;
  is_blocked: boolean | null;
  blocked_until: Timestamp | null;
  last_attempt: Timestamp | null;
  unlocked_by: UUID | null;
  unlocked_at: Timestamp | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
}

// ============================================
// Notifications
// ============================================
export type NotificationType = "info" | "warning" | "error" | "success";

export interface Notification {
  id: UUID;
  user_id: UUID | null;
  title: string;
  message: string;
  type: NotificationType | null;
  read: boolean | null;
  read_at: Timestamp | null;
  link: string | null;
  entity_id: string | null;
  entity_type: string | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
}

// ============================================
// Permissions
// ============================================
export interface Permission {
  id: number;
  name: string;
  description: string | null;
  module: string | null;
  created_at: Timestamp | null;
}

// ============================================
// Role Permissions
// ============================================
export interface RolePermission {
  id: number;
  role_name: string;
  permission_id: number | null;
  created_at: Timestamp | null;
}

// ============================================
// PIX Charges
// ============================================
export type PixStatus = "pending" | "paid" | "expired" | "cancelled";

export interface PixCharge {
  id: number;
  sale_id: number | null;
  txid: string;
  qrcode: string | null;
  qrcode_text: string | null;
  amount: number;
  status: PixStatus | null;
  expires_at: Timestamp | null;
  paid_at: Timestamp | null;
  created_at: Timestamp | null;
}

// ============================================
// Products
// ============================================
export interface Product {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  category: string | null;
  unit: string | null;
  price: number | null;
  cost_price: number | null;
  stock_quantity: number | null;
  reserved_quantity: number | null;
  min_stock: number | null;
  max_stock: number | null;
  location: string | null;
  brand: string | null;
  weight: number | null;
  is_active: boolean | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  created_by: UUID | null;
  updated_by: UUID | null;
  deleted_at: Timestamp | null;
  deleted_by: UUID | null;
}

// ============================================
// Product Entries
// ============================================
export interface ProductEntry {
  id: number;
  product_id: number;
  invoice_number: string;
  invoice_series: string | null;
  supplier_name: string | null;
  supplier_cnpj: string | null;
  batch_number: string | null;
  manufacture_date: string | null; // date
  expiration_date: string | null; // date
  quantity: number;
  unit_cost: number;
  total_cost: number;
  entry_date: string | null; // date
  notes: string | null;
  created_at: Timestamp | null;
  created_by: UUID | null;
}

// ============================================
// Profiles
// ============================================
export type UserRole = string; // 'admin', 'operador', etc
export type TableDensity = "compact" | "comfortable" | "spacious";
export type ThemeMode = "auto" | "system" | "manual";
export type ProfileStatus = "active" | "inactive" | "blocked" | "locked";

export interface Profile {
  id: UUID;
  email: string | null;
  role: UserRole | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  phone: string | null;
  document: string | null;
  birth_date: string | null; // date
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  language: string | null;
  timezone: string | null;
  notifications_enabled: boolean | null;
  dark_mode: boolean | null;
  last_login: Timestamp | null;
  login_count: number | null;
  metadata: Json | null;
  display_name: string | null;
  status: ProfileStatus | null;
  registration_number: string | null;
  sidebar_collapsed: boolean | null;
  table_density: TableDensity | null;
  theme_mode: ThemeMode;
}

// ============================================
// Rate Limits
// ============================================
export interface RateLimit {
  id: number;
  user_id: UUID | null;
  action: string;
  ip_address: string | null; // inet type
  created_at: Timestamp | null;
}

// ============================================
// Sales
// ============================================
export type PaymentMethod = "cash" | "card" | "pix" | "transfer";
export type PaymentStatus = "pending" | "paid" | "cancelled";
export type SaleStatus = "completed" | "pending" | "cancelled";

export interface Sale {
  id: number;
  sale_number: string;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  discount_amount: number | null;
  discount_percent: number | null;
  coupon_code: string | null;
  final_amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus | null;
  status: SaleStatus | null;
  notes: string | null;
  created_at: Timestamp | null;
  created_by: UUID | null;
  updated_at: Timestamp | null;
  cancelled_at: string | null;
  cancelled_by: UUID | null;
  cancellation_reason: string | null;
  cancellation_notes: string | null;
  approved_by: UUID | null;
  created_by_name: string | null;
}

// ============================================
// Sale Items
// ============================================
export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  product_code: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Timestamp | null;
}

// ============================================
// Stock Movements
// ============================================
export type MovementType =
  | "entry"
  | "sale"
  | "adjustment"
  | "reserve"
  | "unreserve";

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: MovementType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference_id: UUID | null;
  reference_type: string | null;
  reason: string | null;
  created_at: Timestamp | null;
  created_by: UUID | null;
  sale_id: number | null;
}

// ============================================
// Stock Count Sessions
// ============================================
export type CountSessionStatus = "in_progress" | "completed" | "cancelled";

export interface StockCountSession {
  id: UUID;
  name: string;
  description: string | null;
  location: string | null;
  responsible: string;
  status: CountSessionStatus;
  created_by: UUID | null;
  started_at: Timestamp;
  completed_at: Timestamp | null;
  completed_by: UUID | null;
  cancelled_at: Timestamp | null;
  cancelled_by: UUID | null;
  total_items: number | null;
  counted_items: number | null;
  diverged_items: number | null;
  adjustments: Json | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================
// Stock Count Items
// ============================================
export type CountItemStatus = "pending" | "counted" | "verified";

export interface StockCountItem {
  id: UUID;
  count_session_id: UUID;
  product_id: number;
  system_quantity: number;
  system_cost: number | null;
  counted_quantity: number | null;
  difference: number | null;
  status: CountItemStatus;
  notes: string | null;
  counted_by: UUID | null;
  counted_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================
// System Logs
// ============================================
export interface SystemLog {
  id: UUID;
  user_id: UUID | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Json | null;
  created_at: Timestamp | null;
}

// ============================================
// Access Logs
// ============================================
export interface AccessLog {
  id: UUID;
  user_id: UUID | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  action_label: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Json | null;
  created_at: Timestamp | null;
  severity: string | null;
  component: string | null;
  original_source: string | null;
}

// ============================================
// Goals
// ============================================
export type GoalType = "daily" | "monthly" | "yearly";

export interface Goal {
  id: UUID;
  user_id: UUID;
  goal_type: GoalType;
  target_amount: number;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  created_by: UUID | null;
  updated_by: UUID | null;
}

// ============================================
// Tasks
// ============================================
export type TaskType = "personal" | "team";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskVisibility = "assigned" | "team" | "all";

export interface Task {
  id: UUID;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority | null;
  status: TaskStatus | null;
  assigned_to: UUID[] | null;
  assigned_to_name: string | null;
  created_by: UUID | null;
  created_by_name: string | null;
  due_date: string | null; // date
  completed_at: Timestamp | null;
  completed_by: UUID | null;
  category: string | null;
  tags: string[] | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  assigned_to_names: string[] | null;
  priority_order: number | null;
  visibility: TaskVisibility | null;
  assigned_by: UUID | null;
  assigned_by_name: string | null;
}

// ============================================
// Task Status History
// ============================================
export interface TaskStatusHistory {
  id: UUID;
  task_id: UUID | null;
  changed_by: UUID | null;
  changed_by_name: string | null;
  old_status: string | null;
  new_status: string | null;
  created_at: Timestamp | null;
}

// ============================================
// Task Comments
// ============================================
export interface TaskComment {
  id: UUID;
  task_id: UUID | null;
  user_id: UUID | null;
  user_name: string | null;
  content: string;
  created_at: Timestamp | null;
}

// ============================================
// Task Assignment History
// ============================================
export type AssignmentAction = "assigned" | "unassigned" | "claimed";

export interface TaskAssignmentHistory {
  id: UUID;
  task_id: UUID | null;
  assigned_by: UUID | null;
  assigned_by_name: string | null;
  assigned_to: UUID | null;
  assigned_to_name: string | null;
  action: AssignmentAction | null;
  created_at: Timestamp | null;
}

// ============================================
// Commissions
// ============================================
export type CommissionStatus = "pending" | "paid" | "cancelled";

export interface Commission {
  id: UUID;
  user_id: UUID;
  sale_id: number | null;
  amount: number;
  percentage: number;
  period: string; // 'YYYY-MM' or 'daily'/'monthly'/'yearly'
  status: CommissionStatus | null;
  paid_at: Timestamp | null;
  paid_by: UUID | null;
  notes: string | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
}

// ============================================
// Commission Rules
// ============================================
export type CommissionRuleType = "percentage" | "fixed";

export interface CommissionRule {
  id: UUID;
  name: string;
  percentage: number;
  min_sales: number | null;
  max_sales: number | null;
  applies_to: string[] | null;
  is_active: boolean | null;
  priority: number | null;
  created_by: UUID | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  description: string | null;
  rule_type: CommissionRuleType | null;
}

// ============================================
// System Settings
// ============================================
export interface SystemSettings {
  id: UUID;
  currency: string | null;
  date_format: string | null;
  time_format: string | null;
  language: string | null;
  timezone: string | null;
  updated_at: Timestamp | null;
}

// ============================================
// Unified Logs (View)
// ============================================
export interface UnifiedLog {
  id: UUID;
  user_id: UUID | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  action_label: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Json | null;
  created_at: Timestamp | null;
  severity: string | null;
  component: string | null;
  original_source: string;
}

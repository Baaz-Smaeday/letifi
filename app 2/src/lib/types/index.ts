// ============================================
// Letifi – Database Types
// ============================================

export type PropertyType = 'house' | 'flat' | 'hmo' | 'room';
export type OwnershipType = 'personal' | 'company';
export type TenancyType = 'ast' | 'periodic' | 'contractual_periodic' | 'company_let';
export type DepositScheme = 'dps' | 'tds' | 'mydeposits' | 'other';
export type ComplianceType =
  | 'gas_safety'
  | 'eicr'
  | 'epc'
  | 'smoke_co_alarm'
  | 'deposit_protection'
  | 'right_to_rent'
  | 'legionella'
  | 'property_licence'
  | 'fire_safety'
  | 'landlord_insurance'
  | 'rent_agreement';
export type ComplianceStatus = 'valid' | 'due_soon' | 'overdue' | 'not_set';
export type MoneyType = 'income' | 'expense';
export type ExpenseCategory =
  | 'rent_income'
  | 'other_income'
  | 'mortgage_interest'
  | 'repairs_maintenance'
  | 'insurance'
  | 'utilities'
  | 'management_fees'
  | 'legal_professional'
  | 'travel'
  | 'advertising'
  | 'ground_rent_service_charge'
  | 'council_tax'
  | 'other_expense';

export type AccountStatus = 'active' | 'inactive' | 'trial' | 'suspended';
export type StaffRole = 'admin' | 'viewer' | 'editor';

// ============================================
// Table Row Types
// ============================================

export interface Account {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  onboarding_completed: boolean;
  status: AccountStatus;
  trial_ends_at: string | null;
  is_owner: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  account_id: string;
  nickname: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  property_type: PropertyType;
  bedrooms: number | null;
  ownership: OwnershipType;
  is_active: boolean;
  notes: string | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenancy {
  id: string;
  account_id: string;
  property_id: string;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone: string | null;
  tenancy_type: TenancyType;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  rent_frequency: 'weekly' | 'monthly';
  rent_due_day: number | null;
  payment_method: string | null;
  deposit_amount: number | null;
  deposit_scheme: DepositScheme | null;
  deposit_protected_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRecord {
  id: string;
  account_id: string;
  property_id: string;
  compliance_type: ComplianceType;
  status: ComplianceStatus;
  last_completed_date: string | null;
  due_date: string | null;
  reminder_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoneyEntry {
  id: string;
  account_id: string;
  property_id: string | null;
  entry_type: MoneyType;
  category: ExpenseCategory;
  amount: number;
  entry_date: string;
  description: string | null;
  notes: string | null;
  tax_year: string | null;
  quarter: number | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  account_id: string;
  property_id: string | null;
  tenancy_id: string | null;
  compliance_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number | null;
  storage_path: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffUser {
  id: string;
  account_id: string;
  user_id: string;
  email: string;
  name: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Extended types
// ============================================

export interface PropertyWithRelations extends Property {
  tenancies?: Tenancy[];
  compliance_records?: ComplianceRecord[];
  documents?: Document[];
}

export interface MoneyEntryWithProperty extends MoneyEntry {
  properties?: Pick<Property, 'id' | 'nickname'> | null;
}

// ============================================
// Form types
// ============================================

export interface PropertyFormData {
  nickname: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  county?: string;
  postcode: string;
  property_type: PropertyType;
  bedrooms?: number;
  ownership: OwnershipType;
}

export interface TenancyFormData {
  property_id: string;
  tenant_name: string;
  tenant_email?: string;
  tenant_phone?: string;
  tenancy_type: TenancyType;
  start_date: string;
  end_date?: string;
  rent_amount: number;
  rent_frequency: 'weekly' | 'monthly';
  rent_due_day?: number;
  payment_method?: string;
  deposit_amount?: number;
  deposit_scheme?: DepositScheme;
  deposit_protected_date?: string;
}

export interface ComplianceFormData {
  property_id: string;
  compliance_type: ComplianceType;
  last_completed_date?: string;
  due_date?: string;
  reminder_days: number;
}

export interface MoneyFormData {
  property_id?: string;
  entry_type: MoneyType;
  category: ExpenseCategory;
  amount: number;
  entry_date: string;
  description?: string;
  notes?: string;
}

export interface DashboardStats {
  totalProperties: number;
  overdueCompliance: number;
  dueSoonCompliance: number;
  rentDueThisMonth: number;
  quarterIncome: number;
  quarterExpenses: number;
  quarterProfit: number;
  estimatedTax: number;
  overallScore: number;
}

// ============================================
// Label maps
// ============================================

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: 'House', flat: 'Flat', hmo: 'HMO', room: 'Room',
};

export const OWNERSHIP_LABELS: Record<OwnershipType, string> = {
  personal: 'Personal', company: 'Company',
};

export const TENANCY_TYPE_LABELS: Record<TenancyType, string> = {
  ast: 'Assured Shorthold (AST)', periodic: 'Periodic',
  contractual_periodic: 'Contractual Periodic', company_let: 'Company Let',
};

export const DEPOSIT_SCHEME_LABELS: Record<DepositScheme, string> = {
  dps: 'DPS', tds: 'TDS', mydeposits: 'myDeposits', other: 'Other',
};

export const COMPLIANCE_TYPE_LABELS: Record<ComplianceType, string> = {
  gas_safety: 'Gas Safety (CP12)',
  eicr: 'EICR',
  epc: 'EPC',
  smoke_co_alarm: 'Smoke & CO Alarms',
  deposit_protection: 'Deposit Protection',
  right_to_rent: 'Right to Rent',
  legionella: 'Legionella Risk Assessment',
  property_licence: 'Property Licence',
  fire_safety: 'Fire Safety',
  landlord_insurance: 'Landlord Insurance',
  rent_agreement: 'Rent Agreement',
};

export const COMPLIANCE_TYPE_ICONS: Record<ComplianceType, string> = {
  gas_safety: '🔥',
  eicr: '⚡',
  epc: '📊',
  smoke_co_alarm: '🚨',
  deposit_protection: '🏦',
  right_to_rent: '📋',
  legionella: '💧',
  property_licence: '📜',
  fire_safety: '🧯',
  landlord_insurance: '🛡️',
  rent_agreement: '📝',
};

export const ALL_COMPLIANCE_TYPES: ComplianceType[] = [
  'gas_safety', 'eicr', 'epc', 'smoke_co_alarm', 'deposit_protection',
  'right_to_rent', 'legionella', 'property_licence', 'fire_safety',
  'landlord_insurance', 'rent_agreement',
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent_income: 'Rent Income', other_income: 'Other Income',
  mortgage_interest: 'Mortgage Interest', repairs_maintenance: 'Repairs & Maintenance',
  insurance: 'Insurance', utilities: 'Utilities', management_fees: 'Management Fees',
  legal_professional: 'Legal & Professional', travel: 'Travel', advertising: 'Advertising',
  ground_rent_service_charge: 'Ground Rent / Service Charge', council_tax: 'Council Tax',
  other_expense: 'Other Expense',
};

export const INCOME_CATEGORIES: ExpenseCategory[] = ['rent_income', 'other_income'];
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'mortgage_interest', 'repairs_maintenance', 'insurance', 'utilities',
  'management_fees', 'legal_professional', 'travel', 'advertising',
  'ground_rent_service_charge', 'council_tax', 'other_expense',
];

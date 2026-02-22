-- ============================================
-- Migration 003: Commercial Property Support
-- ============================================

-- Add new property types (update check constraint)
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_property_type_check 
  CHECK (property_type IN ('house', 'flat', 'hmo', 'room', 'office', 'retail', 'restaurant', 'warehouse', 'mixed_use'));

-- Add new compliance types to enum
DO $$
BEGIN
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'food_hygiene';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'premises_licence';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'asbestos_survey';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'fire_risk_assessment';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'commercial_epc';
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Add new tenancy types
ALTER TABLE public.tenancies DROP CONSTRAINT IF EXISTS tenancies_tenancy_type_check;
ALTER TABLE public.tenancies ADD CONSTRAINT tenancies_tenancy_type_check 
  CHECK (tenancy_type IN ('ast', 'periodic', 'contractual_periodic', 'company_let', 'commercial_lease', 'license_to_occupy'));

-- Add new expense categories
ALTER TABLE public.money_entries DROP CONSTRAINT IF EXISTS money_entries_category_check;
ALTER TABLE public.money_entries ADD CONSTRAINT money_entries_category_check 
  CHECK (category IN (
    'rent_income', 'other_income', 'mortgage_interest', 'repairs_maintenance',
    'insurance', 'utilities', 'management_fees', 'legal_professional', 'travel',
    'advertising', 'ground_rent_service_charge', 'council_tax', 'business_rates',
    'commercial_insurance', 'fit_out_costs', 'cleaning', 'security', 'other_expense'
  ));

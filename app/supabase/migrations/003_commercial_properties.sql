-- ============================================
-- Migration 003: Commercial Properties + Score Toggle
-- ============================================

-- Add enabled_compliance_types to properties (for score toggle)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS enabled_compliance_types text[];

-- Add new property types
DO $$
BEGIN
  ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'office';
  ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'retail';
  ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'restaurant';
  ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'warehouse';
  ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'mixed_use';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add new compliance types
DO $$
BEGIN
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'food_hygiene';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'premises_licence';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'asbestos_survey';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'fire_risk_assessment';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'commercial_epc';
EXCEPTION WHEN others THEN NULL;
END $$;

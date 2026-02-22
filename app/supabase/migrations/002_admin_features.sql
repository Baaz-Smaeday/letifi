-- ============================================
-- Letifi V2 – Admin Features Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new fields to accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial', 'suspended'));
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Add QR code field to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS qr_code text;

-- Add new compliance types (extend the enum)
-- Note: Postgres enums can be extended with ALTER TYPE ... ADD VALUE
DO $$
BEGIN
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'fire_safety';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'landlord_insurance';
  ALTER TYPE compliance_type ADD VALUE IF NOT EXISTS 'rent_agreement';
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Staff users table
CREATE TABLE IF NOT EXISTS public.staff_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Owner can manage their staff
CREATE POLICY "Owners can view their staff" ON public.staff_users
  FOR SELECT USING (owner_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid() AND is_owner = true));

CREATE POLICY "Owners can insert staff" ON public.staff_users
  FOR INSERT WITH CHECK (owner_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid() AND is_owner = true));

CREATE POLICY "Owners can update staff" ON public.staff_users
  FOR UPDATE USING (owner_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid() AND is_owner = true));

CREATE POLICY "Owners can delete staff" ON public.staff_users
  FOR DELETE USING (owner_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid() AND is_owner = true));

-- Allow owners to view ALL accounts (for admin panel)
CREATE POLICY "Owners can view all accounts" ON public.accounts
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.accounts WHERE user_id = auth.uid() AND is_owner = true)
  );

-- Allow owners to update all accounts (for activate/deactivate)
CREATE POLICY "Owners can update all accounts" ON public.accounts
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.accounts WHERE user_id = auth.uid() AND is_owner = true)
  );

-- Allow owners to view all properties (for admin panel)
CREATE POLICY "Owners can view all properties" ON public.properties
  FOR SELECT USING (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.accounts WHERE user_id = auth.uid() AND is_owner = true)
  );

-- Allow owners to view all money entries (for revenue)
CREATE POLICY "Owners can view all money" ON public.money_entries
  FOR SELECT USING (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.accounts WHERE user_id = auth.uid() AND is_owner = true)
  );

-- Allow owners to view all tenancies (for revenue)
CREATE POLICY "Owners can view all tenancies" ON public.tenancies
  FOR SELECT USING (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.accounts WHERE user_id = auth.uid() AND is_owner = true)
  );

-- Index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_is_owner ON public.accounts(is_owner);
CREATE INDEX IF NOT EXISTS idx_staff_owner ON public.staff_users(owner_account_id);

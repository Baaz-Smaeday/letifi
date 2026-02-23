'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type {
  PropertyFormData,
  TenancyFormData,
  ComplianceFormData,
  MoneyFormData,
} from '@/lib/types';
import { getUKTaxYear, getUKTaxQuarter, computeComplianceStatus } from '@/lib/utils';

// ============================================
// Helper: get current user's account_id
// ============================================
async function getAccountId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!account) throw new Error('No account found');

  return account.id;
}

// ============================================
// PROPERTIES
// ============================================
export async function createProperty(data: PropertyFormData) {
  const supabase = await createClient();
  const accountId = await getAccountId();

  const { data: property, error } = await supabase
    .from('properties')
    .insert({
      account_id: accountId,
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/app/properties');
  revalidatePath('/app/dashboard');

  return property;
}

export async function updateProperty(id: string, data: Partial<PropertyFormData>) {
  const supabase = await createClient();

  const { error } = await supabase.from('properties').update(data).eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/properties');
  revalidatePath(`/app/properties/${id}`);
  revalidatePath('/app/dashboard');
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('properties').delete().eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/properties');
  revalidatePath('/app/dashboard');
  redirect('/app/properties');
}

// ============================================
// TENANCIES
// ============================================
export async function createTenancy(data: TenancyFormData) {
  const supabase = await createClient();
  const accountId = await getAccountId();

  const { data: tenancy, error } = await supabase
    .from('tenancies')
    .insert({
      account_id: accountId,
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/app/properties');
  revalidatePath(`/app/properties/${data.property_id}`);
  revalidatePath('/app/dashboard');

  return tenancy;
}

export async function updateTenancy(id: string, data: Partial<TenancyFormData>) {
  const supabase = await createClient();

  const { error } = await supabase.from('tenancies').update(data).eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/properties');
  revalidatePath('/app/dashboard');
}

// ============================================
// COMPLIANCE
// ============================================
export async function createComplianceRecord(data: ComplianceFormData) {
  const supabase = await createClient();
  const accountId = await getAccountId();

  const status = computeComplianceStatus(data.due_date || data.expiry_date || null);

  const { data: record, error } = await supabase
    .from('compliance_records')
    .insert({
      account_id: accountId,
      status,
      property_id: data.property_id,
      compliance_type: data.compliance_type,
      last_completed_date: data.last_completed_date || data.issue_date || null,
      due_date: data.due_date || data.expiry_date || null,
      issue_date: data.issue_date || null,
      expiry_date: data.expiry_date || null,
      provider_name: data.provider_name || null,
      certificate_ref: data.certificate_ref || null,
      reminder_days: data.reminder_days,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/app/compliance');
  revalidatePath(`/app/properties/${data.property_id}`);
  revalidatePath('/app/dashboard');

  return record;
}

export async function updateComplianceRecord(
  id: string,
  data: Partial<ComplianceFormData>
) {
  const supabase = await createClient();

  const status = data.due_date ? computeComplianceStatus(data.due_date) :
                 data.expiry_date ? computeComplianceStatus(data.expiry_date) : undefined;

  const updates: Record<string, unknown> = {};
  if (data.last_completed_date !== undefined) updates.last_completed_date = data.last_completed_date || null;
  if (data.due_date !== undefined) updates.due_date = data.due_date || null;
  if (data.issue_date !== undefined) updates.issue_date = data.issue_date || null;
  if (data.expiry_date !== undefined) updates.expiry_date = data.expiry_date || null;
  if (data.provider_name !== undefined) updates.provider_name = data.provider_name || null;
  if (data.certificate_ref !== undefined) updates.certificate_ref = data.certificate_ref || null;
  if (data.reminder_days !== undefined) updates.reminder_days = data.reminder_days;
  if (data.notes !== undefined) updates.notes = data.notes || null;
  if (status) updates.status = status;

  const { error } = await supabase
    .from('compliance_records')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/compliance');
  revalidatePath('/app/dashboard');
}

export async function deleteComplianceRecord(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('compliance_records').delete().eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/compliance');
  revalidatePath('/app/dashboard');
}

// ============================================
// MONEY ENTRIES
// ============================================
export async function createMoneyEntry(data: MoneyFormData) {
  const supabase = await createClient();
  const accountId = await getAccountId();

  const entryDate = new Date(data.entry_date);
  const taxYear = getUKTaxYear(entryDate);
  const quarter = getUKTaxQuarter(entryDate);

  const { data: entry, error } = await supabase
    .from('money_entries')
    .insert({
      account_id: accountId,
      tax_year: taxYear,
      quarter,
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/app/money');
  revalidatePath('/app/tax');
  revalidatePath('/app/dashboard');

  return entry;
}

export async function updateMoneyEntry(id: string, data: Partial<MoneyFormData>) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = { ...data };

  if (data.entry_date) {
    const d = new Date(data.entry_date);
    updates.tax_year = getUKTaxYear(d);
    updates.quarter = getUKTaxQuarter(d);
  }

  const { error } = await supabase.from('money_entries').update(updates).eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/money');
  revalidatePath('/app/tax');
  revalidatePath('/app/dashboard');
}

export async function deleteMoneyEntry(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('money_entries').delete().eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/money');
  revalidatePath('/app/tax');
  revalidatePath('/app/dashboard');
}

// ============================================
// DOCUMENTS
// ============================================
export async function createDocument(formData: FormData) {
  const supabase = await createClient();
  const accountId = await getAccountId();

  const file = formData.get('file') as File;
  const propertyId = formData.get('property_id') as string | null;
  const tenancyId = formData.get('tenancy_id') as string | null;
  const complianceId = formData.get('compliance_id') as string | null;
  const description = formData.get('description') as string | null;

  if (!file) throw new Error('No file provided');

  // Upload to Supabase Storage
  const filePath = `${accountId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) throw new Error(uploadError.message);

  // Create document record
  const { data: doc, error } = await supabase
    .from('documents')
    .insert({
      account_id: accountId,
      property_id: propertyId || null,
      tenancy_id: tenancyId || null,
      compliance_id: complianceId || null,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: filePath,
      description: description || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/app/documents');
  return doc;
}

export async function deleteDocument(id: string, storagePath: string) {
  const supabase = await createClient();

  // Delete from storage
  await supabase.storage.from('documents').remove([storagePath]);

  // Delete record
  const { error } = await supabase.from('documents').delete().eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/app/documents');
}

// ============================================
// ACCOUNT
// ============================================
export async function updateAccount(data: {
  full_name: string;
  company_name?: string;
  phone?: string;
}) {
  const supabase = await createClient();
  const accountId = await getAccountId();

  const { error } = await supabase
    .from('accounts')
    .update({
      full_name: data.full_name,
      company_name: data.company_name || null,
      phone: data.phone || null,
    })
    .eq('id', accountId);

  if (error) throw new Error(error.message);

  revalidatePath('/app/settings');
  revalidatePath('/app/dashboard');
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message);
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Delete account row (cascade will clean up properties, tenancies, etc.)
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  await supabase.auth.signOut();
  redirect('/login');
}

// ============================================
// ONBOARDING
// ============================================
export async function completeOnboarding() {
  const supabase = await createClient();
  const accountId = await getAccountId();

  const { error } = await supabase
    .from('accounts')
    .update({ onboarding_completed: true })
    .eq('id', accountId);

  if (error) throw new Error(error.message);

  redirect('/app/dashboard');
}

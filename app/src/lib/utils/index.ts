import { type ComplianceStatus, type ComplianceRecord, type ComplianceType, ALL_COMPLIANCE_TYPES } from '@/lib/types';

// ============================================
// Currency formatting
// ============================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP', minimumFractionDigits: 2,
  }).format(amount);
}

// ============================================
// Date formatting
// ============================================
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short',
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

// ============================================
// UK Tax Year helpers
// ============================================
export function getUKTaxYear(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month >= 4) return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
  return `${year - 1}-${String(year % 100).padStart(2, '0')}`;
}

export function getUKTaxQuarter(date: Date = new Date()): number {
  const month = date.getMonth() + 1;
  if (month >= 4 && month <= 6) return 1;
  if (month >= 7 && month <= 9) return 2;
  if (month >= 10 && month <= 12) return 3;
  return 4;
}

export function getQuarterDateRange(taxYear: string, quarter: number): { start: Date; end: Date } {
  const startYear = parseInt(taxYear.split('-')[0]);
  const ranges: Record<number, { start: Date; end: Date }> = {
    1: { start: new Date(startYear, 3, 6), end: new Date(startYear, 6, 5) },
    2: { start: new Date(startYear, 6, 6), end: new Date(startYear, 9, 5) },
    3: { start: new Date(startYear, 9, 6), end: new Date(startYear + 1, 0, 5) },
    4: { start: new Date(startYear + 1, 0, 6), end: new Date(startYear + 1, 3, 5) },
  };
  return ranges[quarter];
}

export const QUARTER_LABELS: Record<number, string> = {
  1: 'Q1 (Apr–Jun)', 2: 'Q2 (Jul–Sep)', 3: 'Q3 (Oct–Dec)', 4: 'Q4 (Jan–Mar)',
};

// ============================================
// Compliance status helpers
// ============================================
export function computeComplianceStatus(dueDate: string | null): ComplianceStatus {
  if (!dueDate) return 'not_set';
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 30) return 'due_soon';
  return 'valid';
}

export const STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; bg: string; ring: string }> = {
  valid: { label: 'Valid', color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-600/20' },
  due_soon: { label: 'Due Soon', color: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-600/20' },
  overdue: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-600/20' },
  not_set: { label: 'Not Set', color: 'text-slate-500', bg: 'bg-slate-50', ring: 'ring-slate-500/20' },
};

// ============================================
// Compliance Score Calculation
// ============================================
export function calculatePropertyScore(records: ComplianceRecord[]): number {
  const totalTypes = ALL_COMPLIANCE_TYPES.length;
  if (totalTypes === 0) return 0;

  let score = 0;
  const perItem = 100 / totalTypes;

  for (const type of ALL_COMPLIANCE_TYPES) {
    const record = records.find((r) => r.compliance_type === type);
    if (!record) continue; // 0 for missing
    if (record.status === 'valid') score += perItem;
    else if (record.status === 'due_soon') score += perItem * 0.5;
    // overdue and not_set = 0
  }

  return Math.round(score);
}

export function calculateOverallScore(allRecords: ComplianceRecord[], propertyIds: string[]): number {
  if (propertyIds.length === 0) return 0;
  let total = 0;
  for (const pid of propertyIds) {
    total += calculatePropertyScore(allRecords.filter((r) => r.property_id === pid));
  }
  return Math.round(total / propertyIds.length);
}

// ============================================
// Tax estimation
// ============================================
export function estimateBasicRateTax(profit: number): number {
  if (profit <= 0) return 0;
  return profit * 0.2;
}

// ============================================
// QR Code helpers
// ============================================
export function getPropertyUploadUrl(propertyId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || '';
  return `${base}/app/documents/new?property=${propertyId}`;
}

export function getPropertyFullAddress(property: { address_line_1: string; address_line_2?: string | null; city: string; county?: string | null; postcode: string }): string {
  const parts = [property.address_line_1];
  if (property.address_line_2) parts.push(property.address_line_2);
  parts.push(property.city);
  if (property.county) parts.push(property.county);
  parts.push(property.postcode);
  return parts.join(', ');
}

// ============================================
// Classname helper
// ============================================
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

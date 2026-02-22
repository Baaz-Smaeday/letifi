import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/ui/shared';
import { StatusBadge } from '@/components/ui/badge';
import {
  IconAlert, IconClock, IconCurrency, IconBuilding,
  IconShield, IconUpload, IconChevronRight,
} from '@/components/ui/icons';
import {
  formatCurrency, formatDate, getUKTaxYear, getUKTaxQuarter, QUARTER_LABELS,
  estimateBasicRateTax, calculateOverallScore,
} from '@/lib/utils';
import type { ComplianceRecord, MoneyEntry, Property, Tenancy } from '@/lib/types';
import { ScoreCircle } from '@/components/ui/score-circle';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase
    .from('accounts').select('id, full_name').eq('user_id', user.id).single();
  if (!account) return null;

  const [{ data: properties }, { data: compliance }, { data: tenancies }, { data: moneyEntries }] = await Promise.all([
    supabase.from('properties').select('*').eq('account_id', account.id).eq('is_active', true),
    supabase.from('compliance_records').select('*').eq('account_id', account.id),
    supabase.from('tenancies').select('*').eq('account_id', account.id).eq('is_active', true),
    supabase.from('money_entries').select('*').eq('account_id', account.id),
  ]);

  const allProperties = (properties || []) as Property[];
  const allCompliance = (compliance || []) as ComplianceRecord[];
  const allTenancies = (tenancies || []) as Tenancy[];
  const allMoney = (moneyEntries || []) as MoneyEntry[];

  const overdue = allCompliance.filter((c) => c.status === 'overdue');
  const dueSoon = allCompliance.filter((c) => c.status === 'due_soon');

  const now = new Date();
  const currentTaxYear = getUKTaxYear(now);
  const currentQuarter = getUKTaxQuarter(now);

  const quarterMoney = allMoney.filter((m) => m.tax_year === currentTaxYear && m.quarter === currentQuarter);
  const quarterIncome = quarterMoney.filter((m) => m.entry_type === 'income').reduce((s, m) => s + Number(m.amount), 0);
  const quarterExpenses = quarterMoney.filter((m) => m.entry_type === 'expense').reduce((s, m) => s + Number(m.amount), 0);
  const quarterProfit = quarterIncome - quarterExpenses;
  const estimatedTax = estimateBasicRateTax(quarterProfit);

  const monthlyRent = allTenancies.reduce((sum, t) => {
    if (t.rent_frequency === 'monthly') return sum + Number(t.rent_amount);
    if (t.rent_frequency === 'weekly') return sum + Number(t.rent_amount) * 4.33;
    return sum;
  }, 0);

  const propertiesMap = new Map(allProperties.map((p) => [p.id, p.enabled_compliance_types]));
  const overallScore = calculateOverallScore(allCompliance, allProperties.map((p) => p.id), propertiesMap);
  const firstName = account.full_name.split(' ')[0];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 sm:p-8 shadow-[0_20px_60px_rgba(99,102,241,0.3)] animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Good {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-sm text-white/70 mt-1.5">Here&apos;s your property overview</p>
          </div>
          {allProperties.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
              <ScoreCircle score={overallScore} size={90} label="Overall" />
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/app/compliance" className="animate-slide-up delay-75">
          <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 cursor-pointer hover:translate-y-[-6px] ${
            overdue.length > 0
              ? 'bg-gradient-to-br from-red-50 via-white to-rose-50 border-red-200/60 hover:shadow-[0_20px_50px_rgba(239,68,68,0.2),0_0_0_1px_rgba(239,68,68,0.1)]'
              : 'bg-gradient-to-br from-white to-slate-50 border-slate-200/60 hover:shadow-[0_20px_50px_rgba(99,102,241,0.12),0_0_0_1px_rgba(99,102,241,0.08)]'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/3 ${overdue.length > 0 ? 'bg-red-100/50' : 'bg-slate-100/50'}`} />
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overdue</p>
                <p className={`text-3xl font-black tracking-tight ${overdue.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdue.length}</p>
              </div>
              <div className={`p-2.5 rounded-xl shadow-sm ${overdue.length > 0 ? 'text-red-500 bg-red-100 shadow-red-100' : 'text-slate-400 bg-slate-100'}`}>
                <IconAlert className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/app/compliance" className="animate-slide-up delay-150">
          <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 cursor-pointer hover:translate-y-[-6px] ${
            dueSoon.length > 0
              ? 'bg-gradient-to-br from-amber-50 via-white to-orange-50 border-amber-200/60 hover:shadow-[0_20px_50px_rgba(245,158,11,0.2),0_0_0_1px_rgba(245,158,11,0.1)]'
              : 'bg-gradient-to-br from-white to-slate-50 border-slate-200/60 hover:shadow-[0_20px_50px_rgba(99,102,241,0.12),0_0_0_1px_rgba(99,102,241,0.08)]'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/3 ${dueSoon.length > 0 ? 'bg-amber-100/50' : 'bg-slate-100/50'}`} />
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Due Soon</p>
                <p className={`text-3xl font-black tracking-tight ${dueSoon.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{dueSoon.length}</p>
              </div>
              <div className={`p-2.5 rounded-xl shadow-sm ${dueSoon.length > 0 ? 'text-amber-500 bg-amber-100 shadow-amber-100' : 'text-slate-400 bg-slate-100'}`}>
                <IconClock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/app/money" className="animate-slide-up delay-225">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 p-5 bg-gradient-to-br from-emerald-50 via-white to-teal-50 transition-all duration-500 cursor-pointer hover:translate-y-[-6px] hover:shadow-[0_20px_50px_rgba(16,185,129,0.2),0_0_0_1px_rgba(16,185,129,0.1)]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rent Due</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(monthlyRent)}</p>
              </div>
              <div className="p-2.5 rounded-xl text-emerald-500 bg-emerald-100 shadow-sm shadow-emerald-100">
                <IconCurrency className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/app/properties" className="animate-slide-up delay-300">
          <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 p-5 bg-gradient-to-br from-indigo-50 via-white to-purple-50 transition-all duration-500 cursor-pointer hover:translate-y-[-6px] hover:shadow-[0_20px_50px_rgba(99,102,241,0.2),0_0_0_1px_rgba(99,102,241,0.1)]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/50 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Properties</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{allProperties.length}</p>
              </div>
              <div className="p-2.5 rounded-xl text-indigo-500 bg-indigo-100 shadow-sm shadow-indigo-100">
                <IconBuilding className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Overdue Alerts */}
      {overdue.length > 0 && (
        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50/80 to-white p-5 animate-slide-up shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
          <SectionHeading
            title="⚠️ Overdue Compliance"
            action={<Link href="/app/compliance" className="text-sm text-red-600 hover:underline font-medium">View all →</Link>}
          />
          <div className="space-y-2">
            {overdue.slice(0, 3).map((item) => (
              <Link key={item.id} href="/app/compliance">
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-red-100 hover:border-red-300 hover:shadow-[0_8px_24px_rgba(239,68,68,0.1)] hover:translate-y-[-2px] transition-all duration-300 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {item.compliance_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    {item.due_date && <p className="text-xs text-slate-500">Due: {formatDate(item.due_date)}</p>}
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quarter Snapshot */}
      <Link href="/app/tax">
        <div className="rounded-2xl bg-white border border-slate-200/60 p-5 animate-slide-up transition-all duration-500 cursor-pointer hover:translate-y-[-4px] hover:shadow-[0_20px_50px_rgba(99,102,241,0.12),0_0_0_1px_rgba(99,102,241,0.08)]">
          <SectionHeading
            title={`${QUARTER_LABELS[currentQuarter]} – ${currentTaxYear}`}
            action={<span className="text-sm text-brand-600 font-medium">Tax Centre →</span>}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-100/50 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)] hover:translate-y-[-2px]">
              <p className="text-xs font-bold text-emerald-600 mb-1">Income</p>
              <p className="text-lg font-black text-slate-900">{formatCurrency(quarterIncome)}</p>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-red-50 to-rose-100/30 border border-red-100/50 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(239,68,68,0.12)] hover:translate-y-[-2px]">
              <p className="text-xs font-bold text-red-500 mb-1">Expenses</p>
              <p className="text-lg font-black text-slate-900">{formatCurrency(quarterExpenses)}</p>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-indigo-100/30 border border-blue-100/50 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(59,130,246,0.12)] hover:translate-y-[-2px]">
              <p className="text-xs font-bold text-blue-600 mb-1">Profit</p>
              <p className="text-lg font-black text-slate-900">{formatCurrency(quarterProfit)}</p>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-50 to-orange-100/30 border border-amber-100/50 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(245,158,11,0.12)] hover:translate-y-[-2px]">
              <p className="text-xs font-bold text-amber-600 mb-1">Est. Tax (20%)</p>
              <p className="text-lg font-black text-slate-900">{formatCurrency(estimatedTax)}</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="animate-slide-up delay-300">
        <SectionHeading title="Quick Actions" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/app/properties/new', label: 'Add Property', icon: IconBuilding, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', border: 'border-blue-100', glow: 'hover:shadow-[0_16px_40px_rgba(59,130,246,0.2)]' },
            { href: '/app/compliance', label: 'Add Compliance', icon: IconShield, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50', border: 'border-emerald-100', glow: 'hover:shadow-[0_16px_40px_rgba(16,185,129,0.2)]' },
            { href: '/app/money/new', label: 'Add Entry', icon: IconCurrency, color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50', border: 'border-purple-100', glow: 'hover:shadow-[0_16px_40px_rgba(139,92,246,0.2)]' },
            { href: '/app/documents/new', label: 'Upload Doc', icon: IconUpload, color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', border: 'border-amber-100', glow: 'hover:shadow-[0_16px_40px_rgba(245,158,11,0.2)]' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <div className={`flex items-center gap-3 rounded-2xl border ${action.border} bg-white p-4 transition-all duration-500 cursor-pointer hover:translate-y-[-5px] hover:scale-[1.02] active:scale-[0.98] ${action.glow}`}>
                <div className={`p-2.5 rounded-xl ${action.bg}`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{action.label}</p>
                </div>
                <IconChevronRight className="text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

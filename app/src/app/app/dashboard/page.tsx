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

  const overallScore = calculateOverallScore(allCompliance, allProperties.map((p) => p.id));
  const firstName = account.full_name.split(' ')[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good {getGreeting()}, <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Here&apos;s your property overview</p>
        </div>
        {allProperties.length > 0 && (
          <div className="animate-slide-up delay-150">
            <ScoreCircle score={overallScore} size={100} label="Overall" />
          </div>
        )}
      </div>

      {/* Stat Cards - ALL CLICKABLE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/app/compliance" className="animate-slide-up delay-75">
          <div className={`stat-glow ${overdue.length > 0 ? 'stat-glow-danger' : ''} rounded-2xl border border-slate-100/80 p-5 bg-gradient-to-br ${overdue.length > 0 ? 'from-red-50 to-red-50/30' : 'from-white to-slate-50/50'}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Overdue</p>
                <p className={`text-2xl font-bold tracking-tight ${overdue.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdue.length}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${overdue.length > 0 ? 'text-red-500 bg-red-100' : 'text-slate-400 bg-slate-100'}`}>
                <IconAlert className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/app/compliance" className="animate-slide-up delay-150">
          <div className={`stat-glow ${dueSoon.length > 0 ? 'stat-glow-warning' : ''} rounded-2xl border border-slate-100/80 p-5 bg-gradient-to-br ${dueSoon.length > 0 ? 'from-amber-50 to-amber-50/30' : 'from-white to-slate-50/50'}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Due Soon</p>
                <p className={`text-2xl font-bold tracking-tight ${dueSoon.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{dueSoon.length}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${dueSoon.length > 0 ? 'text-amber-500 bg-amber-100' : 'text-slate-400 bg-slate-100'}`}>
                <IconClock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/app/money" className="animate-slide-up delay-225">
          <div className="stat-glow stat-glow-success rounded-2xl border border-slate-100/80 p-5 bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Rent Due</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(monthlyRent)}</p>
              </div>
              <div className="p-2.5 rounded-xl text-emerald-500 bg-emerald-100">
                <IconCurrency className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/app/properties" className="animate-slide-up delay-300">
          <div className="stat-glow stat-glow-brand rounded-2xl border border-slate-100/80 p-5 bg-gradient-to-br from-brand-50 to-brand-50/30">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Properties</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{allProperties.length}</p>
              </div>
              <div className="p-2.5 rounded-xl text-brand-500 bg-brand-100">
                <IconBuilding className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Overdue Alerts */}
      {overdue.length > 0 && (
        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50/80 to-white p-5 animate-slide-up card-glow-red">
          <SectionHeading
            title="⚠️ Overdue Compliance"
            action={<Link href="/app/compliance" className="text-sm text-red-600 hover:underline font-medium">View all →</Link>}
          />
          <div className="space-y-2">
            {overdue.slice(0, 3).map((item) => (
              <Link key={item.id} href="/app/compliance">
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-red-100 hover:border-red-300 hover:shadow-md transition-all duration-300 cursor-pointer">
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
        <div className="rounded-2xl bg-white border border-slate-100/80 shadow-card p-5 animate-slide-up hover:shadow-lg transition-all duration-400 cursor-pointer card-glow">
          <SectionHeading
            title={`${QUARTER_LABELS[currentQuarter]} – ${currentTaxYear}`}
            action={<span className="text-sm text-brand-600 font-medium">Tax Centre →</span>}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="finance-card finance-card-green">
              <p className="text-xs font-semibold text-emerald-600 mb-1">Income</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(quarterIncome)}</p>
            </div>
            <div className="finance-card finance-card-red">
              <p className="text-xs font-semibold text-red-500 mb-1">Expenses</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(quarterExpenses)}</p>
            </div>
            <div className="finance-card finance-card-blue">
              <p className="text-xs font-semibold text-blue-600 mb-1">Profit</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(quarterProfit)}</p>
            </div>
            <div className="finance-card finance-card-amber">
              <p className="text-xs font-semibold text-amber-600 mb-1">Est. Tax (20%)</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(estimatedTax)}</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="animate-slide-up delay-300">
        <SectionHeading title="Quick Actions" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/app/properties/new', label: 'Add Property', icon: IconBuilding, color: 'text-blue-600', bg: 'bg-blue-50', glow: 'hover:shadow-[0_16px_40px_rgba(59,130,246,0.15)]' },
            { href: '/app/compliance', label: 'Add Compliance', icon: IconShield, color: 'text-emerald-600', bg: 'bg-emerald-50', glow: 'hover:shadow-[0_16px_40px_rgba(16,185,129,0.15)]' },
            { href: '/app/money/new', label: 'Add Entry', icon: IconCurrency, color: 'text-purple-600', bg: 'bg-purple-50', glow: 'hover:shadow-[0_16px_40px_rgba(139,92,246,0.15)]' },
            { href: '/app/documents/new', label: 'Upload Doc', icon: IconUpload, color: 'text-amber-600', bg: 'bg-amber-50', glow: 'hover:shadow-[0_16px_40px_rgba(245,158,11,0.15)]' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <div className={`action-card ${action.glow}`}>
                <div className={`p-2.5 rounded-xl ${action.bg}`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{action.label}</p>
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

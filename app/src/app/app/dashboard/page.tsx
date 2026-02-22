import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, StatCard, SectionHeading } from '@/components/ui/shared';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import {
  IconAlert, IconClock, IconCurrency, IconBuilding, IconPlus,
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
      {/* Header with Score */}
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

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="animate-slide-up delay-75">
          <StatCard
            label="Overdue" value={overdue.length}
            variant={overdue.length > 0 ? 'danger' : 'default'}
            icon={<IconAlert className="w-5 h-5" />}
          />
        </div>
        <div className="animate-slide-up delay-150">
          <StatCard
            label="Due Soon" value={dueSoon.length}
            variant={dueSoon.length > 0 ? 'warning' : 'default'}
            icon={<IconClock className="w-5 h-5" />}
          />
        </div>
        <div className="animate-slide-up delay-225">
          <StatCard
            label="Rent Due" value={formatCurrency(monthlyRent)}
            icon={<IconCurrency className="w-5 h-5" />}
          />
        </div>
        <div className="animate-slide-up delay-300">
          <StatCard
            label="Properties" value={allProperties.length}
            variant="brand"
            icon={<IconBuilding className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Overdue Alerts */}
      {overdue.length > 0 && (
        <Card padding="md" className="border-red-200 bg-red-50/30 animate-slide-up">
          <SectionHeading
            title="⚠️ Overdue Compliance"
            action={<Link href="/app/compliance" className="text-sm text-red-600 hover:underline font-medium">View all</Link>}
          />
          <div className="space-y-2">
            {overdue.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-red-100">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {item.compliance_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                  {item.due_date && <p className="text-xs text-slate-500">Due: {formatDate(item.due_date)}</p>}
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quarter Snapshot */}
      <Card padding="md" className="animate-slide-up">
        <SectionHeading
          title={`${QUARTER_LABELS[currentQuarter]} – ${currentTaxYear}`}
          action={<Link href="/app/tax" className="text-sm text-slate-500 hover:text-brand-600 font-medium">Tax Centre →</Link>}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-emerald-50/60 rounded-xl p-4 card-glow-green cursor-default transition-all duration-300 hover:shadow-glow-green">
            <p className="text-xs font-medium text-emerald-600 mb-1">Income</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(quarterIncome)}</p>
          </div>
          <div className="bg-red-50/60 rounded-xl p-4 card-glow-red cursor-default transition-all duration-300 hover:shadow-glow-red">
            <p className="text-xs font-medium text-red-500 mb-1">Expenses</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(quarterExpenses)}</p>
          </div>
          <div className="bg-blue-50/60 rounded-xl p-4 card-glow-blue cursor-default transition-all duration-300 hover:shadow-glow-blue">
            <p className="text-xs font-medium text-blue-600 mb-1">Profit</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(quarterProfit)}</p>
          </div>
          <div className="bg-amber-50/60 rounded-xl p-4 card-glow-amber cursor-default transition-all duration-300 hover:shadow-glow-amber">
            <p className="text-xs font-medium text-amber-600 mb-1">Est. Tax (20%)</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(estimatedTax)}</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="animate-slide-up">
        <SectionHeading title="Quick Actions" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/app/properties/new', label: 'Add Property', icon: IconBuilding, color: 'text-blue-600 bg-blue-50' },
            { href: '/app/compliance', label: 'Add Compliance', icon: IconShield, color: 'text-emerald-600 bg-emerald-50' },
            { href: '/app/money/new', label: 'Add Entry', icon: IconCurrency, color: 'text-purple-600 bg-purple-50' },
            { href: '/app/documents/new', label: 'Upload Doc', icon: IconUpload, color: 'text-amber-600 bg-amber-50' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <Card interactive glow padding="md" className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{action.label}</p>
                </div>
                <IconChevronRight className="text-slate-300" />
              </Card>
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

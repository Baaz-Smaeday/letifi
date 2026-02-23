import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, SectionHeading, EmptyState } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconCurrency, IconPlus } from '@/components/ui/icons';
import { EXPENSE_CATEGORY_LABELS, type MoneyEntry, type Property } from '@/lib/types';
import { formatCurrency, formatDate, getUKTaxYear, getUKTaxQuarter, QUARTER_LABELS } from '@/lib/utils';

export default async function MoneyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase.from('accounts').select('id').eq('user_id', user.id).single();
  if (!account) return null;

  const now = new Date();
  const currentTaxYear = getUKTaxYear(now);
  const currentQuarter = getUKTaxQuarter(now);

  const [{ data: moneyEntries }, { data: properties }] = await Promise.all([
    supabase.from('money_entries').select('*, properties(id, nickname)')
      .eq('account_id', account.id).order('entry_date', { ascending: false }),
    supabase.from('properties').select('id, nickname').eq('account_id', account.id),
  ]);

  const allEntries = (moneyEntries || []) as (MoneyEntry & { properties: { id: string; nickname: string } | null })[];

  // Current month
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthEntries = allEntries.filter(e => {
    const d = new Date(e.entry_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthIncome = monthEntries.filter(e => e.entry_type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const monthExpenses = monthEntries.filter(e => e.entry_type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
  const monthProfit = monthIncome - monthExpenses;

  // Quarter
  const quarterEntries = allEntries.filter(e => e.tax_year === currentTaxYear && e.quarter === currentQuarter);
  const quarterIncome = quarterEntries.filter(e => e.entry_type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const quarterExpenses = quarterEntries.filter(e => e.entry_type === 'expense').reduce((s, e) => s + Number(e.amount), 0);

  // Top expense categories this quarter
  const expenseByCategory: Record<string, number> = {};
  quarterEntries.filter(e => e.entry_type === 'expense').forEach(e => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + Number(e.amount);
  });
  const topExpenses = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const monthName = now.toLocaleString('en-GB', { month: 'long' });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Money" description="Track rental income and expenses"
        action={<Link href="/app/money/new"><Button><IconPlus className="w-4 h-4" /> Add Entry</Button></Link>} />

      {/* Monthly Summary Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.25)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="relative">
          <h2 className="text-lg font-bold text-white/80 mb-4">{monthName} {currentYear}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-white/60 font-medium mb-1">Income</p>
              <p className="text-2xl sm:text-3xl font-black text-white">{formatCurrency(monthIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 font-medium mb-1">Expenses</p>
              <p className="text-2xl sm:text-3xl font-black text-red-200">{formatCurrency(monthExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 font-medium mb-1">Net Profit</p>
              <p className={`text-2xl sm:text-3xl font-black ${monthProfit >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                {formatCurrency(monthProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quarter + Top Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/60 p-5 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.1)]">
          <SectionHeading title={`${QUARTER_LABELS[currentQuarter]} – ${currentTaxYear}`}
            action={<Link href="/app/tax" className="text-xs text-brand-600 font-semibold">Tax Centre →</Link>} />
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-100/50">
              <p className="text-[10px] font-bold text-emerald-600 mb-0.5">Income</p>
              <p className="text-base font-black text-slate-900">{formatCurrency(quarterIncome)}</p>
            </div>
            <div className="rounded-2xl p-3 bg-gradient-to-br from-red-50 to-rose-100/30 border border-red-100/50">
              <p className="text-[10px] font-bold text-red-500 mb-0.5">Expenses</p>
              <p className="text-base font-black text-slate-900">{formatCurrency(quarterExpenses)}</p>
            </div>
            <div className="rounded-2xl p-3 bg-gradient-to-br from-blue-50 to-indigo-100/30 border border-blue-100/50">
              <p className="text-[10px] font-bold text-blue-600 mb-0.5">Profit</p>
              <p className="text-base font-black text-slate-900">{formatCurrency(quarterIncome - quarterExpenses)}</p>
            </div>
          </div>
        </div>

        {topExpenses.length > 0 && (
          <div className="rounded-2xl bg-white border border-slate-200/60 p-5 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.1)]">
            <SectionHeading title="Top Expenses" />
            <div className="space-y-2.5">
              {topExpenses.map(([cat, amount]) => {
                const pct = quarterExpenses > 0 ? Math.round((amount / quarterExpenses) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{EXPENSE_CATEGORY_LABELS[cat as keyof typeof EXPENSE_CATEGORY_LABELS] || cat}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Entries */}
      <div>
        <SectionHeading title="All Entries" />
        {allEntries.length === 0 ? (
          <EmptyState icon={<IconCurrency />} title="No entries yet" description="Add your first income or expense entry"
            action={<Link href="/app/money/new"><Button><IconPlus className="w-4 h-4" /> Add Entry</Button></Link>} />
        ) : (
          <div className="space-y-2">
            {allEntries.map((entry, i) => (
              <div key={entry.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-200/60 transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_12px_32px_rgba(99,102,241,0.08)] animate-slide-up"
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  entry.entry_type === 'income'
                    ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600'
                    : 'bg-gradient-to-br from-red-100 to-red-50 text-red-500'
                }`}>
                  {entry.entry_type === 'income' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {EXPENSE_CATEGORY_LABELS[entry.category]}
                    </p>
                    <p className={`text-sm font-bold flex-shrink-0 ${
                      entry.entry_type === 'income' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {entry.entry_type === 'income' ? '+' : '-'}{formatCurrency(Number(entry.amount))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{formatDate(entry.entry_date)}</span>
                    {entry.properties && <Badge className="text-[10px]">{entry.properties.nickname}</Badge>}
                    {entry.description && <span className="text-xs text-slate-400 truncate">{entry.description}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { PageHeader, SectionHeading } from '@/components/ui/shared';
import { Badge } from '@/components/ui/badge';
import { IconCheck } from '@/components/ui/icons';
import { TaxExportButton } from '@/components/tax/export-button';
import type { MoneyEntry } from '@/lib/types';
import { formatCurrency, getUKTaxYear, getUKTaxQuarter, QUARTER_LABELS, estimateBasicRateTax } from '@/lib/utils';

export default async function TaxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase.from('accounts').select('id').eq('user_id', user.id).single();
  if (!account) return null;

  const now = new Date();
  const currentTaxYear = getUKTaxYear(now);
  const currentQuarter = getUKTaxQuarter(now);

  const { data: moneyEntries } = await supabase
    .from('money_entries').select('*').eq('account_id', account.id).eq('tax_year', currentTaxYear).order('entry_date', { ascending: true });

  const entries = (moneyEntries || []) as MoneyEntry[];

  const quarters = [1, 2, 3, 4].map((q) => {
    const qEntries = entries.filter((e) => e.quarter === q);
    const income = qEntries.filter((e) => e.entry_type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
    const expenses = qEntries.filter((e) => e.entry_type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
    return { quarter: q, income, expenses, profit: income - expenses, isCurrent: q === currentQuarter, hasData: qEntries.length > 0 };
  });

  const ytdIncome = quarters.reduce((s, q) => s + q.income, 0);
  const ytdExpenses = quarters.reduce((s, q) => s + q.expenses, 0);
  const ytdProfit = ytdIncome - ytdExpenses;
  const ytdTax = estimateBasicRateTax(ytdProfit);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Tax Centre" description={`Tax year ${currentTaxYear} • MTD-ready tracking`}
        action={<TaxExportButton taxYear={currentTaxYear} />} />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 shadow-[0_20px_60px_rgba(245,158,11,0.25)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-white/20"><IconCheck className="w-4 h-4 text-white" /></div>
            <span className="text-sm font-semibold text-white/90">Digital Records Ready</span>
            <Badge variant="success" className="ml-auto bg-white/20 text-white border-0">Active</Badge>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div><p className="text-xs text-white/60 font-medium mb-1">Total Income</p><p className="text-2xl font-black text-white">{formatCurrency(ytdIncome)}</p></div>
            <div><p className="text-xs text-white/60 font-medium mb-1">Expenses</p><p className="text-2xl font-black text-red-100">{formatCurrency(ytdExpenses)}</p></div>
            <div><p className="text-xs text-white/60 font-medium mb-1">Net Profit</p><p className="text-2xl font-black text-white">{formatCurrency(ytdProfit)}</p></div>
            <div><p className="text-xs text-white/60 font-medium mb-1">Est. Tax (20%)</p><p className="text-2xl font-black text-yellow-100">{formatCurrency(ytdTax)}</p></div>
          </div>
        </div>
      </div>

      {/* Quarterly Breakdown */}
      <div className="rounded-2xl bg-white border border-slate-200/60 p-5 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)]">
        <SectionHeading title="Quarterly Breakdown" />
        <div className="space-y-3">
          {quarters.map((q) => (
            <div key={q.quarter}
              className={`rounded-2xl p-4 border-2 transition-all duration-500 hover:translate-y-[-2px] ${
                q.isCurrent
                  ? 'border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white hover:shadow-[0_12px_32px_rgba(99,102,241,0.12)]'
                  : 'border-slate-100 bg-white hover:shadow-[0_12px_32px_rgba(99,102,241,0.06)]'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{QUARTER_LABELS[q.quarter]}</h3>
                  {q.isCurrent && <Badge variant="info">Current</Badge>}
                </div>
                {q.hasData && <Badge variant={q.profit >= 0 ? 'success' : 'danger'}>{formatCurrency(q.profit)}</Badge>}
              </div>
              {q.hasData ? (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="rounded-xl p-2.5 bg-emerald-50/50">
                    <p className="text-[10px] font-bold text-emerald-600">Income</p>
                    <p className="font-bold text-slate-900">{formatCurrency(q.income)}</p>
                  </div>
                  <div className="rounded-xl p-2.5 bg-red-50/50">
                    <p className="text-[10px] font-bold text-red-500">Expenses</p>
                    <p className="font-bold text-slate-900">{formatCurrency(q.expenses)}</p>
                  </div>
                  <div className="rounded-xl p-2.5 bg-blue-50/50">
                    <p className="text-[10px] font-bold text-blue-600">Profit</p>
                    <p className="font-bold text-slate-900">{formatCurrency(q.profit)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No entries recorded</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* End of Year */}
      <div className="rounded-2xl bg-white border border-slate-200/60 p-5 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)]">
        <SectionHeading title="End of Year Summary" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2.5 border-b border-slate-100"><span className="text-slate-600">Total Rental Income</span><span className="font-bold">{formatCurrency(ytdIncome)}</span></div>
          <div className="flex justify-between py-2.5 border-b border-slate-100"><span className="text-slate-600">Total Allowable Expenses</span><span className="font-bold">{formatCurrency(ytdExpenses)}</span></div>
          <div className="flex justify-between py-2.5 border-b border-slate-100"><span className="text-slate-600">Net Rental Profit</span><span className="font-black text-slate-900">{formatCurrency(ytdProfit)}</span></div>
          <div className="flex justify-between py-2.5"><span className="text-slate-600">Estimated Income Tax (20%)</span><span className="font-black text-amber-600">{formatCurrency(ytdTax)}</span></div>
        </div>
        <p className="text-xs text-slate-400 mt-4">This is an estimate. Consult your accountant for accurate calculations.</p>
      </div>
    </div>
  );
}

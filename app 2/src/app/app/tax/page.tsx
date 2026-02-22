import { createClient } from '@/lib/supabase/server';
import { PageHeader, SectionHeading } from '@/components/ui/shared';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconCheck, IconDownload } from '@/components/ui/icons';
import { TaxExportButton } from '@/components/tax/export-button';
import type { MoneyEntry } from '@/lib/types';
import {
  formatCurrency,
  getUKTaxYear,
  getUKTaxQuarter,
  QUARTER_LABELS,
  estimateBasicRateTax,
} from '@/lib/utils';

export default async function TaxPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!account) return null;

  const now = new Date();
  const currentTaxYear = getUKTaxYear(now);
  const currentQuarter = getUKTaxQuarter(now);

  const { data: moneyEntries } = await supabase
    .from('money_entries')
    .select('*')
    .eq('account_id', account.id)
    .eq('tax_year', currentTaxYear)
    .order('entry_date', { ascending: true });

  const entries = (moneyEntries || []) as MoneyEntry[];

  // Quarterly breakdown
  const quarters = [1, 2, 3, 4].map((q) => {
    const qEntries = entries.filter((e) => e.quarter === q);
    const income = qEntries
      .filter((e) => e.entry_type === 'income')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const expenses = qEntries
      .filter((e) => e.entry_type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      quarter: q,
      income,
      expenses,
      profit: income - expenses,
      isCurrent: q === currentQuarter,
      hasData: qEntries.length > 0,
    };
  });

  // YTD totals
  const ytdIncome = quarters.reduce((s, q) => s + q.income, 0);
  const ytdExpenses = quarters.reduce((s, q) => s + q.expenses, 0);
  const ytdProfit = ytdIncome - ytdExpenses;
  const ytdTax = estimateBasicRateTax(ytdProfit);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tax Centre"
        description={`Tax year ${currentTaxYear} • MTD-ready tracking`}
        action={<TaxExportButton taxYear={currentTaxYear} />}
      />

      {/* Digital Records Status */}
      <Card padding="md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50">
            <IconCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Digital Records Ready</p>
            <p className="text-xs text-slate-500">
              Your income and expenses are digitally tracked for MTD compliance
            </p>
          </div>
          <Badge variant="success" className="ml-auto">
            Active
          </Badge>
        </div>
      </Card>

      {/* Year to Date */}
      <Card padding="md">
        <SectionHeading title="Year to Date" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-50/50 rounded-xl p-4">
            <p className="text-xs font-medium text-emerald-600 mb-1">Total Income</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(ytdIncome)}</p>
          </div>
          <div className="bg-red-50/50 rounded-xl p-4">
            <p className="text-xs font-medium text-red-500 mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(ytdExpenses)}</p>
          </div>
          <div className="bg-blue-50/50 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-600 mb-1">Net Profit</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(ytdProfit)}</p>
          </div>
          <div className="bg-amber-50/50 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-600 mb-1">Estimated Tax (20%)</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(ytdTax)}</p>
          </div>
        </div>
      </Card>

      {/* Quarterly Breakdown */}
      <Card padding="md">
        <SectionHeading title="Quarterly Breakdown" />
        <div className="space-y-3">
          {quarters.map((q) => (
            <div
              key={q.quarter}
              className={`rounded-xl p-4 border transition-colors ${
                q.isCurrent
                  ? 'border-slate-900 bg-slate-50/50'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {QUARTER_LABELS[q.quarter]}
                  </h3>
                  {q.isCurrent && (
                    <Badge variant="info">Current</Badge>
                  )}
                </div>
                {q.hasData && (
                  <Badge variant={q.profit >= 0 ? 'success' : 'danger'}>
                    {formatCurrency(q.profit)}
                  </Badge>
                )}
              </div>

              {q.hasData ? (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Income</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(q.income)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Expenses</p>
                    <p className="font-semibold text-red-600">{formatCurrency(q.expenses)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Profit</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(q.profit)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No entries recorded</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* End of Year Summary */}
      <Card padding="md">
        <SectionHeading title="End of Year Summary" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Total Rental Income</span>
            <span className="font-semibold text-slate-900">{formatCurrency(ytdIncome)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Total Allowable Expenses</span>
            <span className="font-semibold text-slate-900">{formatCurrency(ytdExpenses)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Net Rental Profit</span>
            <span className="font-bold text-slate-900">{formatCurrency(ytdProfit)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-600">Estimated Income Tax (Basic Rate 20%)</span>
            <span className="font-bold text-amber-600">{formatCurrency(ytdTax)}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          This is an estimate only. Personal allowances and other income sources are not factored in.
          Consult your accountant for accurate tax calculations.
        </p>
      </Card>
    </div>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, SectionHeading, EmptyState } from '@/components/ui/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconCurrency, IconPlus } from '@/components/ui/icons';
import {
  EXPENSE_CATEGORY_LABELS,
  type MoneyEntry,
  type Property,
} from '@/lib/types';
import {
  formatCurrency,
  formatDate,
  getUKTaxYear,
  getUKTaxQuarter,
  QUARTER_LABELS,
} from '@/lib/utils';

export default async function MoneyPage() {
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

  const [{ data: moneyEntries }, { data: properties }] = await Promise.all([
    supabase
      .from('money_entries')
      .select('*, properties(id, nickname)')
      .eq('account_id', account.id)
      .order('entry_date', { ascending: false }),
    supabase.from('properties').select('id, nickname').eq('account_id', account.id),
  ]);

  const allEntries = (moneyEntries || []) as (MoneyEntry & {
    properties: { id: string; nickname: string } | null;
  })[];

  // Quarter summary
  const quarterEntries = allEntries.filter(
    (e) => e.tax_year === currentTaxYear && e.quarter === currentQuarter
  );

  const quarterIncome = quarterEntries
    .filter((e) => e.entry_type === 'income')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const quarterExpenses = quarterEntries
    .filter((e) => e.entry_type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Money"
        description="Track rental income and expenses"
        action={
          <Link href="/app/money/new">
            <Button>
              <IconPlus className="w-4 h-4" />
              Add Entry
            </Button>
          </Link>
        }
      />

      {/* Quarter Summary */}
      <Card padding="md">
        <SectionHeading title={`${QUARTER_LABELS[currentQuarter]} – ${currentTaxYear}`} />
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50/50 rounded-xl p-4">
            <p className="text-xs font-medium text-emerald-600 mb-1">Income</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(quarterIncome)}</p>
          </div>
          <div className="bg-red-50/50 rounded-xl p-4">
            <p className="text-xs font-medium text-red-500 mb-1">Expenses</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(quarterExpenses)}</p>
          </div>
          <div className="bg-blue-50/50 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-600 mb-1">Profit</p>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(quarterIncome - quarterExpenses)}
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Entries */}
      <div>
        <SectionHeading title="All Entries" />
        {allEntries.length === 0 ? (
          <EmptyState
            icon={<IconCurrency />}
            title="No entries yet"
            description="Add your first income or expense entry"
            action={
              <Link href="/app/money/new">
                <Button>
                  <IconPlus className="w-4 h-4" />
                  Add Entry
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {allEntries.map((entry) => (
              <Card key={entry.id} padding="sm" className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    entry.entry_type === 'income' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {EXPENSE_CATEGORY_LABELS[entry.category]}
                    </p>
                    <p
                      className={`text-sm font-semibold flex-shrink-0 ${
                        entry.entry_type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {entry.entry_type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(entry.amount))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{formatDate(entry.entry_date)}</span>
                    {entry.properties && (
                      <Badge className="text-[10px]">{entry.properties.nickname}</Badge>
                    )}
                    {entry.description && (
                      <span className="text-xs text-slate-400 truncate">{entry.description}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

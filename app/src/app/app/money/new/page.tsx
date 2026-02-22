'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createMoneyEntry } from '@/lib/actions';
import {
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  type MoneyType,
  type ExpenseCategory,
  type Property,
} from '@/lib/types';

export default function NewMoneyEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);

  const [entryType, setEntryType] = useState<MoneyType>('income');
  const [category, setCategory] = useState<ExpenseCategory>('rent_income');
  const [propertyId, setPropertyId] = useState('');
  const [amount, setAmount] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!account) return;

      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('account_id', account.id);
      setProperties((data || []) as Property[]);
    }
    load();
  }, []);

  const categories =
    entryType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Reset category when type changes
  useEffect(() => {
    setCategory(entryType === 'income' ? 'rent_income' : 'repairs_maintenance');
  }, [entryType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createMoneyEntry({
        entry_type: entryType,
        category,
        property_id: propertyId || undefined,
        amount: parseFloat(amount),
        entry_date: entryDate,
        description: description || undefined,
        notes: notes || undefined,
      });
      router.push('/app/money');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Add Entry" description="Record income or expense" />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['income', 'expense'] as MoneyType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEntryType(type)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  entryType === type
                    ? type === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                {type === 'income' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            options={categories.map((c) => ({
              value: c,
              label: EXPENSE_CATEGORY_LABELS[c],
            }))}
          />

          <Select
            label="Property (optional)"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            options={[
              { value: '', label: 'General / Not linked' },
              ...properties.map((p) => ({ value: p.id, label: p.nickname })),
            ]}
          />

          <Input
            label="Amount (£)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <Input
            label="Date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />

          <Input
            label="Description (optional)"
            placeholder="e.g. Boiler repair"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            label="Notes (optional)"
            placeholder="Additional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Save Entry
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { IconDownload } from '@/components/ui/icons';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/types';

interface Props {
  taxYear: string;
}

export function TaxExportButton({ taxYear }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);

    try {
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

      const { data: entries } = await supabase
        .from('money_entries')
        .select('*, properties(nickname)')
        .eq('account_id', account.id)
        .eq('tax_year', taxYear)
        .order('entry_date', { ascending: true });

      if (!entries || entries.length === 0) {
        alert('No entries to export for this tax year.');
        return;
      }

      // Build CSV
      const headers = ['Date', 'Type', 'Category', 'Property', 'Amount', 'Description', 'Quarter'];
      const rows = entries.map((e: any) => [
        e.entry_date,
        e.entry_type,
        EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] || e.category,
        e.properties?.nickname || 'General',
        e.amount,
        e.description || '',
        `Q${e.quarter}`,
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `letifi-${taxYear}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="md" onClick={handleExport} loading={loading}>
      <IconDownload className="w-4 h-4" />
      Export CSV
    </Button>
  );
}

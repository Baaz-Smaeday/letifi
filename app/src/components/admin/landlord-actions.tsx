'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface Props {
  accountId: string;
  currentStatus: string;
}

export function LandlordActions({ accountId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function updateStatus(newStatus: string, trialDays?: number) {
    setLoading(true);
    try {
      const supabase = createClient();
      const updates: Record<string, unknown> = { status: newStatus };
      if (trialDays) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        updates.trial_ends_at = trialEnd.toISOString();
      }
      await supabase.from('accounts').update(updates).eq('id', accountId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-1.5">
      {currentStatus !== 'active' && (
        <Button variant="ghost" size="sm" loading={loading} onClick={() => updateStatus('active')}>
          Activate
        </Button>
      )}
      {currentStatus !== 'inactive' && currentStatus !== 'suspended' && (
        <Button variant="ghost" size="sm" loading={loading} onClick={() => updateStatus('inactive')}>
          Deactivate
        </Button>
      )}
      {currentStatus !== 'trial' && (
        <Button variant="ghost" size="sm" loading={loading} onClick={() => updateStatus('trial', 30)}>
          1mo Trial
        </Button>
      )}
    </div>
  );
}

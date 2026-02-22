import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconUser } from '@/components/ui/icons';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import type { Account, Property } from '@/lib/types';
import { LandlordActions } from '@/components/admin/landlord-actions';

export default async function AdminLandlordsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: ownerAccount } = await supabase.from('accounts').select('*').eq('user_id', user.id).single();
  if (!ownerAccount?.is_owner) redirect('/admin/login');

  const [{ data: accounts }, { data: properties }] = await Promise.all([
    supabase.from('accounts').select('*').order('created_at', { ascending: false }),
    supabase.from('properties').select('id, account_id'),
  ]);

  const allAccounts = (accounts || []) as Account[];
  const allProperties = (properties || []) as Property[];

  const propCount = (accountId: string) => allProperties.filter((p) => p.account_id === accountId).length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-40 glass border-b border-slate-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-sm">
              <span className="text-white text-xs font-bold">Le</span>
            </div>
            <span className="text-base font-semibold text-slate-900">Admin Panel</span>
          </div>
          <Link href="/login"><Button variant="ghost" size="sm">← Exit Admin</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <nav className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
          {[
            { href: '/admin/dashboard', label: 'Dashboard' },
            { href: '/admin/landlords', label: 'Landlords' },
            { href: '/admin/staff', label: 'Staff' },
            { href: '/admin/revenue', label: 'Revenue' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              l.href === '/admin/landlords' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}>{l.label}</Link>
          ))}
        </nav>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Landlords</h1>
        <p className="text-sm text-slate-500 mb-6">{allAccounts.length} total accounts</p>

        <div className="space-y-3">
          {allAccounts.map((acc) => (
            <Card key={acc.id} padding="md" glow>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {acc.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{acc.full_name}</h3>
                    {acc.is_owner && <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">OWNER</span>}
                  </div>
                  <p className="text-xs text-slate-500">{acc.email}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                    <span>{propCount(acc.id)} properties</span>
                    <span>Joined {formatDate(acc.created_at)}</span>
                    {acc.last_login_at && <span>Last login: {formatRelativeDate(acc.last_login_at)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    acc.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    acc.status === 'trial' ? 'bg-amber-50 text-amber-700' :
                    acc.status === 'inactive' ? 'bg-slate-100 text-slate-500' :
                    'bg-red-50 text-red-700'
                  }`}>{acc.status || 'active'}</span>
                  <LandlordActions accountId={acc.id} currentStatus={acc.status || 'active'} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

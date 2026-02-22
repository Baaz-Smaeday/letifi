import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/shared';
import { IconCurrency, IconBuilding, IconUser } from '@/components/ui/icons';
import { formatCurrency } from '@/lib/utils';
import type { Account, MoneyEntry, Tenancy } from '@/lib/types';

export default async function AdminRevenuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: ownerAccount } = await supabase.from('accounts').select('*').eq('user_id', user.id).single();
  if (!ownerAccount?.is_owner) redirect('/admin/login');

  const [{ data: accounts }, { data: money }, { data: tenancies }] = await Promise.all([
    supabase.from('accounts').select('*'),
    supabase.from('money_entries').select('*'),
    supabase.from('tenancies').select('*').eq('is_active', true),
  ]);

  const allMoney = (money || []) as MoneyEntry[];
  const allTenancies = (tenancies || []) as Tenancy[];
  const allAccounts = (accounts || []) as Account[];

  const totalIncome = allMoney.filter((m) => m.entry_type === 'income').reduce((s, m) => s + Number(m.amount), 0);
  const totalExpenses = allMoney.filter((m) => m.entry_type === 'expense').reduce((s, m) => s + Number(m.amount), 0);
  const monthlyRent = allTenancies.reduce((s, t) => {
    if (t.rent_frequency === 'monthly') return s + Number(t.rent_amount);
    return s + Number(t.rent_amount) * 4.33;
  }, 0);

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
              l.href === '/admin/revenue' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}>{l.label}</Link>
          ))}
        </nav>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Revenue Overview</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Income" value={formatCurrency(totalIncome)} variant="success" icon={<IconCurrency className="w-5 h-5" />} />
          <StatCard label="Total Expenses" value={formatCurrency(totalExpenses)} variant="danger" icon={<IconCurrency className="w-5 h-5" />} />
          <StatCard label="Net Profit" value={formatCurrency(totalIncome - totalExpenses)} variant="brand" icon={<IconCurrency className="w-5 h-5" />} />
          <StatCard label="Monthly Rent (All)" value={formatCurrency(monthlyRent)} icon={<IconBuilding className="w-5 h-5" />} />
        </div>

        <Card padding="md">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Revenue by Landlord</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Landlord</th>
                  <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Income</th>
                  <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Expenses</th>
                  <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {allAccounts.map((acc) => {
                  const accMoney = allMoney.filter((m) => m.account_id === acc.id);
                  const inc = accMoney.filter((m) => m.entry_type === 'income').reduce((s, m) => s + Number(m.amount), 0);
                  const exp = accMoney.filter((m) => m.entry_type === 'expense').reduce((s, m) => s + Number(m.amount), 0);
                  return (
                    <tr key={acc.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium">{acc.full_name}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">{formatCurrency(inc)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500">{formatCurrency(exp)}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(inc - exp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

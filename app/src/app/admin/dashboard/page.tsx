import { AdminNav } from "@/components/admin/admin-nav";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/shared';
import { IconBuilding, IconUser, IconCurrency, IconShield } from '@/components/ui/icons';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import type { Account, Property, MoneyEntry } from '@/lib/types';


export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: ownerAccount } = await supabase
    .from('accounts').select('*').eq('user_id', user.id).single();
  if (!ownerAccount?.is_owner) redirect('/admin/login');

  const [{ data: accounts }, { data: properties }, { data: money }] = await Promise.all([
    supabase.from('accounts').select('*').order('created_at', { ascending: false }),
    supabase.from('properties').select('*'),
    supabase.from('money_entries').select('*'),
  ]);

  const allAccounts = (accounts || []) as Account[];
  const allProperties = (properties || []) as Property[];
  const allMoney = (money || []) as MoneyEntry[];

  const activeAccounts = allAccounts.filter((a) => a.status === 'active' || a.status === 'trial');
  const trialAccounts = allAccounts.filter((a) => a.status === 'trial');
  const totalRevenue = allMoney.filter((m) => m.entry_type === 'income').reduce((s, m) => s + Number(m.amount), 0);

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
        <AdminNav current="/admin/dashboard" />

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Landlords" value={allAccounts.length} variant="brand" icon={<IconUser className="w-5 h-5" />} />
          <StatCard label="Active" value={activeAccounts.length} variant="success" icon={<IconUser className="w-5 h-5" />} />
          <StatCard label="On Trial" value={trialAccounts.length} variant="warning" icon={<IconShield className="w-5 h-5" />} />
          <StatCard label="Total Properties" value={allProperties.length} icon={<IconBuilding className="w-5 h-5" />} />
        </div>

        {/* Recent Landlords */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Landlords</h2>
            <Link href="/admin/landlords"><Button variant="ghost" size="sm">View All →</Button></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Email</th>
                  <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allAccounts.slice(0, 10).map((acc) => (
                  <tr key={acc.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{acc.full_name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{acc.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        acc.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        acc.status === 'trial' ? 'bg-amber-50 text-amber-700' :
                        acc.status === 'inactive' ? 'bg-slate-100 text-slate-500' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {acc.status || 'active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{formatRelativeDate(acc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}


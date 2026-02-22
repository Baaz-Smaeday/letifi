import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/shared';
import { IconUser } from '@/components/ui/icons';
import { AddStaffForm } from '@/components/admin/add-staff-form';

export default async function AdminStaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: ownerAccount } = await supabase.from('accounts').select('*').eq('user_id', user.id).single();
  if (!ownerAccount?.is_owner) redirect('/admin/login');

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
              l.href === '/admin/staff' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}>{l.label}</Link>
          ))}
        </nav>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Staff Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="lg">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Add Staff Member</h2>
            <AddStaffForm />
          </Card>

          <Card padding="lg">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Current Staff</h2>
            <EmptyState
              icon={<IconUser />}
              title="No staff added yet"
              description="Add team members to help manage landlords"
            />
          </Card>
        </div>
      </main>
    </div>
  );
}

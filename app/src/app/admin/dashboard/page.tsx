import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminNav } from '@/components/admin/admin-nav';
import { formatRelativeDate } from '@/lib/utils';
import type { Account, Property } from '@/lib/types';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: accounts } = await supabase.from('accounts').select('*').order('created_at', { ascending: false });
  const { data: properties } = await supabase.from('properties').select('*');

  const allAccounts = (accounts || []) as Account[];
  const allProperties = (properties || []) as Property[];
  const activeCount = allAccounts.filter(a => a.status === 'active').length;
  const trialCount = allAccounts.filter(a => a.status === 'trial').length;

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trial: 'bg-amber-100 text-amber-700',
    inactive: 'bg-slate-100 text-slate-600',
    suspended: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <header className="glass border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_2px_10px_rgba(99,102,241,0.3)]">
              <span className="text-white text-xs font-bold">Le</span>
            </div>
            <span className="text-lg font-bold text-slate-900">Admin Panel</span>
          </div>
          <Link href="/login" className="text-sm text-slate-500 hover:text-brand-600 transition-colors font-medium">
            ← Exit Admin
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AdminNav current="/admin/dashboard" />

        <h1 className="text-2xl font-bold text-slate-900 animate-fade-in">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          <div className="stat-glow stat-glow-brand rounded-2xl border border-slate-100/80 p-5 bg-gradient-to-br from-brand-50/60 to-white">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Total Landlords</p>
                <p className="text-2xl font-bold text-slate-900">{allAccounts.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-brand-100 text-brand-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            </div>
          </div>

          <div className="stat-glow stat-glow-success rounded-2xl border border-slate-100/80 p-5 bg-gradient-to-br from-emerald-50/60 to-white">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>

          <div className="stat-glow stat-glow-warning rounded-2xl border border-slate-100/80 p-5 bg-gradient-to-br from-amber-50/60 to-white">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">On Trial</p>
                <p className="text-2xl font-bold text-amber-600">{trialCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>

          <div className="stat-glow rounded-2xl border border-slate-100/80 p-5 bg-gradient-to-br from-blue-50/60 to-white">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Total Properties</p>
                <p className="text-2xl font-bold text-slate-900">{allProperties.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Landlords */}
        <div className="rounded-2xl bg-white border border-slate-100/80 shadow-card overflow-hidden animate-slide-up delay-150">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Recent Landlords</h2>
            <Link href="/admin/landlords" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left font-medium text-slate-500 px-6 py-3">Name</th>
                  <th className="text-left font-medium text-slate-500 px-6 py-3">Email</th>
                  <th className="text-left font-medium text-slate-500 px-6 py-3">Status</th>
                  <th className="text-left font-medium text-slate-500 px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allAccounts.slice(0, 5).map((acc) => (
                  <tr key={acc.id} className="border-t border-slate-50 hover:bg-brand-50/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-medium text-slate-900">{acc.full_name}</td>
                    <td className="px-6 py-4 text-slate-500">{acc.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${statusColors[acc.status || 'active']}`}>
                        {acc.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatRelativeDate(acc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

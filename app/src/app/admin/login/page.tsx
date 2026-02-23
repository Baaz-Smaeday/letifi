'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }

      // Check if user is an owner
      const { data: account } = await supabase
        .from('accounts').select('is_owner').eq('email', email).single();

      if (!account?.is_owner) {
        await supabase.auth.signOut();
        setError('Access denied. Owner account required.');
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
            <span className="text-white text-sm font-bold">Le</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Letifi</span>
          <span className="text-xs font-medium text-brand-300 bg-brand-900/50 px-2 py-0.5 rounded-full">Admin</span>
        </div>

        <Card padding="lg" className="animate-scale-in">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Owner Login</h1>
          <p className="text-sm text-slate-500 mb-6">Access the admin dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</div>}
            <Button type="submit" loading={loading} className="w-full">Sign in as Owner</Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            <a href="/login" className="text-brand-600 font-medium hover:underline">← Back to landlord login</a>
          </p>
        </Card>
      </div>
    </div>
  );
}

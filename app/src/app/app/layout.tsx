import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get account
  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If no account, create one
  if (!account) {
    const { error } = await supabase.from('accounts').insert({
      user_id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email!,
    });

    if (error) {
      console.error('Failed to create account:', error);
    }

    redirect('/app/onboarding');
  }

  // Check onboarding
  if (!account.onboarding_completed) {
    // Allow access to onboarding page
    // The actual redirect is handled per-page
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <AppHeader userName={account.full_name} userEmail={account.email} />

      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar />

        <main className="flex-1 overflow-y-auto pb-20 sm:pb-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

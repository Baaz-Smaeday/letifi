'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateAccount, updatePassword, deleteAccount } from '@/lib/actions';
import { PageHeader } from '@/components/ui/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AccountData {
  full_name: string;
  email: string;
  company_name: string;
  phone: string;
}

export default function SettingsPage() {
  const [account, setAccount] = useState<AccountData>({
    full_name: '',
    email: '',
    company_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('accounts')
        .select('full_name, email, company_name, phone')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setAccount({
          full_name: data.full_name || '',
          email: data.email || '',
          company_name: data.company_name || '',
          phone: data.phone || '',
        });
      }
      setLoading(false);
    }

    loadAccount();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await updateAccount({
        full_name: account.full_name,
        company_name: account.company_name || undefined,
        phone: account.phone || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);

    try {
      await updatePassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch {
      setPasswordError('Failed to update password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);

    try {
      await deleteAccount();
    } catch {
      alert('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-32 mb-6" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 pb-28 sm:pb-6">
      <PageHeader title="Settings" />

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={account.full_name}
              onChange={(e) =>
                setAccount({ ...account, full_name: e.target.value })
              }
              required
            />
            <Input
              label="Email"
              value={account.email}
              disabled
              hint="Email cannot be changed here"
            />
            <Input
              label="Company Name"
              value={account.company_name}
              onChange={(e) =>
                setAccount({ ...account, company_name: e.target.value })
              }
              placeholder="Optional"
            />
            <Input
              label="Phone"
              type="tel"
              value={account.phone}
              onChange={(e) =>
                setAccount({ ...account, phone: e.target.value })
              }
              placeholder="Optional"
            />

            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
              {saveSuccess && (
                <span className="text-sm text-emerald-600 font-medium animate-fadeIn">
                  ✓ Saved
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              error={passwordError}
              required
            />

            <div className="flex items-center gap-3">
              <Button type="submit" loading={passwordSaving}>
                Update Password
              </Button>
              {passwordSuccess && (
                <span className="text-sm text-emerald-600 font-medium animate-fadeIn">
                  ✓ Password updated
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Permanently delete your account and all associated data including
            properties, tenancies, compliance records, financial entries, and
            documents. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm font-medium text-red-700">
                Type <strong>DELETE</strong> to confirm:
              </p>
              <Input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="Type DELETE"
              />
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  loading={deleting}
                  disabled={deleteText !== 'DELETE'}
                >
                  Permanently Delete
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

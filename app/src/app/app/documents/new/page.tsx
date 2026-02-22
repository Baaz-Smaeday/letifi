'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { IconUpload } from '@/components/ui/icons';
import { createDocument } from '@/lib/actions';
import type { Property } from '@/lib/types';

export default function UploadDocumentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [propertyId, setPropertyId] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function load() {
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

      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('account_id', account.id);
      setProperties((data || []) as Property[]);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (propertyId) formData.append('property_id', propertyId);
      if (description) formData.append('description', description);

      await createDocument(formData);
      router.push('/app/documents');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Upload Document" description="Upload PDF, JPG, or PNG files" />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-slate-300 hover:bg-slate-50/50 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024).toFixed(0)} KB • Click to change
                </p>
              </div>
            ) : (
              <div>
                <IconUpload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">
                  Click to select a file
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, or PNG up to 10MB</p>
              </div>
            )}
          </div>

          <Select
            label="Link to property (optional)"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            options={[
              { value: '', label: 'Not linked' },
              ...properties.map((p) => ({ value: p.id, label: p.nickname })),
            ]}
          />

          <Input
            label="Description (optional)"
            placeholder="e.g. Gas safety certificate 2024"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} disabled={!file}>
              Upload Document
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

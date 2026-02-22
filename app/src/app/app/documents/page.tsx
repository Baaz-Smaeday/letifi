import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, EmptyState } from '@/components/ui/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconDocument, IconPlus, IconUpload } from '@/components/ui/icons';
import type { Document as DocType, Property } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!account) return null;

  const { data: documents } = await supabase
    .from('documents')
    .select('*, properties(id, nickname)')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false });

  const allDocs = (documents || []) as (DocType & {
    properties: { id: string; nickname: string } | null;
  })[];

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Documents"
        description={`${allDocs.length} document${allDocs.length !== 1 ? 's' : ''} uploaded`}
        action={
          <Link href="/app/documents/new">
            <Button>
              <IconUpload className="w-4 h-4" />
              Upload
            </Button>
          </Link>
        }
      />

      {allDocs.length === 0 ? (
        <EmptyState
          icon={<IconDocument />}
          title="No documents uploaded"
          description="Upload contracts, certificates, and inspection reports"
          action={
            <Link href="/app/documents/new">
              <Button>
                <IconUpload className="w-4 h-4" />
                Upload Document
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {allDocs.map((doc) => (
            <Card key={doc.id} padding="sm" className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <IconDocument className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{doc.file_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{formatDate(doc.created_at)}</span>
                  {doc.file_size && (
                    <span className="text-xs text-slate-400">{formatFileSize(doc.file_size)}</span>
                  )}
                  {doc.properties && (
                    <Badge className="text-[10px]">{doc.properties.nickname}</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader, SectionHeading, EmptyState } from '@/components/ui/shared';
import { ScoreCircle } from '@/components/ui/score-circle';
import { QRCode } from '@/components/ui/qr-code';
import {
  IconBuilding, IconUser, IconShield, IconDocument, IconChevronRight,
} from '@/components/ui/icons';
import { ComplianceToggle } from '@/components/compliance/compliance-toggle';
import { ComplianceList } from '@/components/compliance/compliance-list';
import {
  PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS,
  type Property, type Tenancy, type ComplianceRecord, type Document,
} from '@/lib/types';
import {
  formatCurrency, formatDate, calculatePropertyScore, getPropertyUploadUrl,
  getPropertyFullAddress,
} from '@/lib/utils';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase.from('accounts').select('id').eq('user_id', user.id).single();
  if (!account) return null;

  const { data: property } = await supabase
    .from('properties').select('*').eq('id', id).eq('account_id', account.id).single();
  if (!property) notFound();

  const p = property as Property;

  const [{ data: tenancies }, { data: compliance }, { data: documents }] = await Promise.all([
    supabase.from('tenancies').select('*').eq('property_id', id).eq('is_active', true),
    supabase.from('compliance_records').select('*').eq('property_id', id).order('due_date', { ascending: true }),
    supabase.from('documents').select('*').eq('property_id', id).order('created_at', { ascending: false }).limit(5),
  ]);

  const allTenancies = (tenancies || []) as Tenancy[];
  const allCompliance = (compliance || []) as ComplianceRecord[];
  const allDocuments = (documents || []) as Document[];
  const activeTenant = allTenancies[0];
  const score = calculatePropertyScore(allCompliance, p.enabled_compliance_types);
  const fullAddress = getPropertyFullAddress(p);
  const uploadUrl = getPropertyUploadUrl(p.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={p.nickname} description={fullAddress}
        action={<Link href={`/app/properties/${id}/edit`}><Button variant="secondary" size="sm">Edit Property</Button></Link>} />

      {/* Hero Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Score */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-200/60 p-6 flex flex-col items-center justify-center transition-all duration-500 hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/30 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="relative">
            <ScoreCircle score={score} size={140} />
            <p className="text-sm font-semibold text-slate-600 mt-3 text-center">Compliance Score</p>
            <p className="text-xs text-slate-400 mt-1 text-center">
              {p.enabled_compliance_types ? `${p.enabled_compliance_types.length} items tracked` : 'All items tracked'}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl bg-white border border-slate-200/60 p-6 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.1)]">
          <SectionHeading title="Details" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <Badge variant="brand">{PROPERTY_TYPE_ICONS[p.property_type]} {PROPERTY_TYPE_LABELS[p.property_type]}</Badge>
            </div>
            {p.bedrooms && (
              <div className="flex justify-between">
                <span className="text-slate-500">Bedrooms</span>
                <span className="font-semibold">{p.bedrooms}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Ownership</span>
              <span className="font-semibold capitalize">{p.ownership}</span>
            </div>
            {activeTenant && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenant</span>
                  <span className="font-semibold">{activeTenant.tenant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rent</span>
                  <Badge variant="success">{formatCurrency(Number(activeTenant.rent_amount))}/mo</Badge>
                </div>
              </>
            )}
          </div>
        </div>

        {/* QR */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 p-6 flex flex-col items-center justify-center transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.1)]">
          <QRCode value={uploadUrl} size={140} label={`Scan to upload docs for ${p.nickname}`} />
        </div>
      </div>

      {/* Compliance Records */}
      <div className="rounded-2xl bg-white border border-slate-200/60 p-5 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)]">
        <SectionHeading title="🛡️ Compliance"
          action={<Link href="/app/compliance"><Button variant="ghost" size="sm">Manage →</Button></Link>} />
        <ComplianceList records={allCompliance} />
      </div>

      {/* Score Settings */}
      <div className="rounded-2xl bg-white border border-slate-200/60 p-5 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)]">
        <ComplianceToggle propertyId={p.id} propertyType={p.property_type} enabledTypes={p.enabled_compliance_types} />
      </div>

      {/* Documents */}
      <div className="rounded-2xl bg-white border border-slate-200/60 p-5 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.08)]">
        <SectionHeading title="📄 Recent Documents"
          action={<Link href={`/app/documents/new?property=${id}`}><Button size="sm">Upload</Button></Link>} />
        {allDocuments.length > 0 ? (
          <div className="space-y-2">
            {allDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 hover:shadow-sm hover:translate-y-[-1px] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
                  <IconDocument className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.file_name}</p>
                  <p className="text-xs text-slate-500">{formatDate(doc.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<IconDocument />} title="No documents yet" description="Upload documents or scan the QR code above" />
        )}
      </div>
    </div>
  );
}

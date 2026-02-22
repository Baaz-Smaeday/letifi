import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { PageHeader, SectionHeading, EmptyState } from '@/components/ui/shared';
import { ScoreCircle } from '@/components/ui/score-circle';
import { QRCode } from '@/components/ui/qr-code';
import {
  IconBuilding, IconUser, IconShield, IconDocument, IconChevronRight,
} from '@/components/ui/icons';
import { ComplianceToggle } from '@/components/compliance/compliance-toggle';
import {
  PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, COMPLIANCE_TYPE_LABELS, COMPLIANCE_TYPE_ICONS,
  type Property, type Tenancy, type ComplianceRecord, type Document,
} from '@/lib/types';
import {
  formatCurrency, formatDate, calculatePropertyScore, getPropertyUploadUrl,
  getPropertyFullAddress, STATUS_CONFIG,
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
      <PageHeader
        title={p.nickname}
        description={fullAddress}
        action={
          <Link href={`/app/properties/${id}/edit`}>
            <Button variant="secondary" size="sm">Edit Property</Button>
          </Link>
        }
      />

      {/* Score + QR Code Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Compliance Score */}
        <Card padding="lg" glow glowColor="default" className="flex flex-col items-center justify-center">
          <ScoreCircle score={score} size={140} />
          <p className="text-sm font-medium text-slate-600 mt-3">Compliance Score</p>
          <p className="text-xs text-slate-400 mt-1">
            {p.enabled_compliance_types ? `${p.enabled_compliance_types.length} items tracked` : 'All items tracked'}
          </p>
        </Card>

        {/* Property Info */}
        <Card padding="lg">
          <SectionHeading title="Details" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <Badge variant="brand">{PROPERTY_TYPE_ICONS[p.property_type]} {PROPERTY_TYPE_LABELS[p.property_type]}</Badge>
            </div>
            {p.bedrooms && (
              <div className="flex justify-between">
                <span className="text-slate-500">Bedrooms</span>
                <span className="font-medium">{p.bedrooms}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Ownership</span>
              <span className="font-medium capitalize">{p.ownership}</span>
            </div>
            {activeTenant && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenant</span>
                  <span className="font-medium">{activeTenant.tenant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rent</span>
                  <Badge variant="success">{formatCurrency(Number(activeTenant.rent_amount))}/mo</Badge>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* QR Code */}
        <Card padding="lg" glow className="flex flex-col items-center justify-center">
          <QRCode value={uploadUrl} size={140} label={`Scan to upload documents for ${p.nickname}`} />
        </Card>
      </div>

      {/* Compliance Records */}
      <Card padding="md">
        <SectionHeading
          title="🛡️ Compliance"
          action={
            <Link href="/app/compliance">
              <Button variant="ghost" size="sm">Manage →</Button>
            </Link>
          }
        />
        {allCompliance.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allCompliance.map((item) => {
              const icon = COMPLIANCE_TYPE_ICONS[item.compliance_type] || '📋';
              const statusConf = STATUS_CONFIG[item.status];
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 hover:shadow-md ${
                    item.status === 'valid' ? 'border-emerald-100 bg-emerald-50/30 card-glow-green' :
                    item.status === 'due_soon' ? 'border-amber-100 bg-amber-50/30 card-glow-amber' :
                    item.status === 'overdue' ? 'border-red-100 bg-red-50/30 card-glow-red' :
                    'border-slate-100 bg-slate-50/30'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {COMPLIANCE_TYPE_LABELS[item.compliance_type]}
                    </p>
                    {item.due_date && (
                      <p className="text-xs text-slate-500">Due: {formatDate(item.due_date)}</p>
                    )}
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<IconShield />}
            title="No compliance records"
            description="Add compliance tracking for this property"
          />
        )}
      </Card>

      {/* Compliance Score Settings */}
      <Card padding="md">
        <ComplianceToggle
          propertyId={p.id}
          propertyType={p.property_type}
          enabledTypes={p.enabled_compliance_types}
        />
      </Card>

      {/* Recent Documents */}
      <Card padding="md">
        <SectionHeading
          title="📄 Recent Documents"
          action={
            <Link href={`/app/documents/new?property=${id}`}>
              <Button size="sm">Upload</Button>
            </Link>
          }
        />
        {allDocuments.length > 0 ? (
          <div className="space-y-2">
            {allDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
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
          <EmptyState
            icon={<IconDocument />}
            title="No documents yet"
            description="Upload documents or scan the QR code above"
          />
        )}
      </Card>
    </div>
  );
}

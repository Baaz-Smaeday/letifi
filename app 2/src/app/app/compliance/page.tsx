import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, EmptyState, SectionHeading } from '@/components/ui/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { ScoreCircle, ScoreCircleSmall } from '@/components/ui/score-circle';
import { IconShield, IconPlus } from '@/components/ui/icons';
import {
  COMPLIANCE_TYPE_LABELS, COMPLIANCE_TYPE_ICONS,
  type Property, type ComplianceRecord,
} from '@/lib/types';
import { formatDate, calculatePropertyScore, calculateOverallScore, STATUS_CONFIG } from '@/lib/utils';
import { ComplianceAddModal } from '@/components/onboarding/compliance-modal';

export default async function CompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase.from('accounts').select('id').eq('user_id', user.id).single();
  if (!account) return null;

  const [{ data: properties }, { data: compliance }] = await Promise.all([
    supabase.from('properties').select('*').eq('account_id', account.id),
    supabase.from('compliance_records').select('*').eq('account_id', account.id).order('due_date', { ascending: true }),
  ]);

  const allProperties = (properties || []) as Property[];
  const allCompliance = (compliance || []) as ComplianceRecord[];

  const grouped = allProperties.map((prop) => ({
    property: prop,
    records: allCompliance.filter((c) => c.property_id === prop.id),
    score: calculatePropertyScore(allCompliance.filter((c) => c.property_id === prop.id)),
  }));

  const overallScore = calculateOverallScore(allCompliance, allProperties.map((p) => p.id));
  const overdue = allCompliance.filter((c) => c.status === 'overdue').length;
  const dueSoon = allCompliance.filter((c) => c.status === 'due_soon').length;
  const valid = allCompliance.filter((c) => c.status === 'valid').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compliance"
        description="Track certificates, inspections and legal requirements"
        action={<ComplianceAddModal properties={allProperties} />}
      />

      {/* Overall Score + Summary */}
      {allProperties.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-brand-50/50 to-white border border-brand-100/50">
          <ScoreCircle score={overallScore} size={110} label="Portfolio" />
          <div className="flex-1 grid grid-cols-3 gap-4 text-center sm:text-left">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{valid}</p>
              <p className="text-xs text-slate-500 font-medium">Valid</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{dueSoon}</p>
              <p className="text-xs text-slate-500 font-medium">Due Soon</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{overdue}</p>
              <p className="text-xs text-slate-500 font-medium">Overdue</p>
            </div>
          </div>
        </div>
      )}

      {/* By Property */}
      {grouped.length === 0 ? (
        <EmptyState
          icon={<IconShield />}
          title="No compliance records"
          description="Add a property first, then set up compliance tracking"
          action={<Link href="/app/properties/new"><Button><IconPlus className="w-4 h-4" /> Add Property</Button></Link>}
        />
      ) : (
        grouped.map(({ property, records, score }) => (
          <Card key={property.id} padding="md">
            <div className="flex items-center gap-3 mb-4">
              <ScoreCircleSmall score={score} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900">{property.nickname}</h3>
                <p className="text-xs text-slate-500">{property.address_line_1}, {property.postcode}</p>
              </div>
              <Link href={`/app/properties/${property.id}`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                View →
              </Link>
            </div>
            {records.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {records.map((item) => {
                  const icon = COMPLIANCE_TYPE_ICONS[item.compliance_type] || '📋';
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 hover:shadow-md ${
                        item.status === 'valid' ? 'border-emerald-100 bg-emerald-50/30' :
                        item.status === 'due_soon' ? 'border-amber-100 bg-amber-50/30' :
                        item.status === 'overdue' ? 'border-red-100 bg-red-50/30' :
                        'border-slate-100 bg-slate-50/30'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {COMPLIANCE_TYPE_LABELS[item.compliance_type]}
                        </p>
                        {item.due_date && <p className="text-xs text-slate-500">Due: {formatDate(item.due_date)}</p>}
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-2">No compliance records for this property</p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

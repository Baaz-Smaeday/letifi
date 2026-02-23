import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, EmptyState, SectionHeading } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { ScoreCircle, ScoreCircleSmall } from '@/components/ui/score-circle';
import { IconShield, IconPlus } from '@/components/ui/icons';
import {
  COMPLIANCE_TYPE_LABELS, COMPLIANCE_TYPE_ICONS, COMPLIANCE_HELP_TEXT,
  RESIDENTIAL_COMPLIANCE_TYPES, COMMERCIAL_COMPLIANCE_TYPES,
  isCommercialProperty,
  type Property, type ComplianceRecord, type ComplianceType,
} from '@/lib/types';
import { formatDate, calculatePropertyScore, calculateOverallScore } from '@/lib/utils';
import { ComplianceAddModal } from '@/components/onboarding/compliance-modal';
import { ComplianceFilters } from '@/components/compliance/compliance-filters';

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

  // Score per property + missing items
  const grouped = allProperties.map((prop) => {
    const records = allCompliance.filter((c) => c.property_id === prop.id);
    const enabledTypes = prop.enabled_compliance_types as ComplianceType[] | null;
    const relevantTypes = enabledTypes && enabledTypes.length > 0
      ? enabledTypes
      : (isCommercialProperty(prop.property_type) ? COMMERCIAL_COMPLIANCE_TYPES : RESIDENTIAL_COMPLIANCE_TYPES);
    const trackedTypes = records.map(r => r.compliance_type);
    const missingTypes = relevantTypes.filter(t => !trackedTypes.includes(t));
    const score = calculatePropertyScore(records, prop.enabled_compliance_types);

    return { property: prop, records, score, missingTypes, relevantTypes };
  });

  const propertiesMap = new Map(allProperties.map((p) => [p.id, p.enabled_compliance_types]));
  const overallScore = calculateOverallScore(allCompliance, allProperties.map((p) => p.id), propertiesMap);
  const overdue = allCompliance.filter((c) => c.status === 'overdue').length;
  const dueSoon = allCompliance.filter((c) => c.status === 'due_soon').length;
  const valid = allCompliance.filter((c) => c.status === 'valid').length;

  // Next 30 days actions
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const upcoming = allCompliance
    .filter(c => c.due_date && new Date(c.due_date) <= in30Days && new Date(c.due_date) >= now)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compliance"
        description="Track certificates, inspections and legal requirements"
        action={<ComplianceAddModal properties={allProperties} />}
      />

      {/* Overall Score */}
      {allProperties.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 shadow-[0_20px_60px_rgba(99,102,241,0.25)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <ScoreCircle score={overallScore} size={100} label="Portfolio" />
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 text-center sm:text-left">
              <div>
                <p className="text-3xl font-black text-white">{valid}</p>
                <p className="text-xs text-white/60 font-medium">Valid</p>
              </div>
              <div>
                <p className="text-3xl font-black text-amber-300">{dueSoon}</p>
                <p className="text-xs text-white/60 font-medium">Due Soon</p>
              </div>
              <div>
                <p className="text-3xl font-black text-red-300">{overdue}</p>
                <p className="text-xs text-white/60 font-medium">Overdue</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next 30 Days */}
      {upcoming.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-[0_8px_30px_rgba(245,158,11,0.08)]">
          <SectionHeading title="📅 Next 30 Days" />
          <div className="space-y-2">
            {upcoming.slice(0, 5).map((item) => {
              const prop = allProperties.find(p => p.id === item.property_id);
              return (
                <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100 hover:border-amber-200 hover:shadow-[0_8px_24px_rgba(245,158,11,0.1)] hover:translate-y-[-2px] transition-all duration-300">
                  <span className="text-base">{COMPLIANCE_TYPE_ICONS[item.compliance_type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{COMPLIANCE_TYPE_LABELS[item.compliance_type]}</p>
                    <p className="text-xs text-slate-500">{prop?.nickname} · Due: {formatDate(item.due_date!)}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <ComplianceFilters
        allProperties={allProperties}
        allCompliance={allCompliance}
        grouped={grouped}
      />
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/badge';
import { ScoreCircleSmall } from '@/components/ui/score-circle';
import { IconShield, IconPlus } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { EmptyState, SectionHeading } from '@/components/ui/shared';
import {
  COMPLIANCE_TYPE_LABELS, COMPLIANCE_TYPE_ICONS, COMPLIANCE_HELP_TEXT,
  type Property, type ComplianceRecord, type ComplianceType,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface GroupedProperty {
  property: Property;
  records: ComplianceRecord[];
  score: number;
  missingTypes: ComplianceType[];
  relevantTypes: ComplianceType[];
}

interface Props {
  allProperties: Property[];
  allCompliance: ComplianceRecord[];
  grouped: GroupedProperty[];
}

export function ComplianceFilters({ allProperties, allCompliance, grouped }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'name' | 'date'>('risk');

  const filtered = useMemo(() => {
    let result = [...grouped];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        g.property.nickname.toLowerCase().includes(q) ||
        g.property.address_line_1.toLowerCase().includes(q) ||
        g.property.postcode.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'risk') result.sort((a, b) => a.score - b.score);
    else if (sortBy === 'name') result.sort((a, b) => a.property.nickname.localeCompare(b.property.nickname));

    return result;
  }, [grouped, search, sortBy]);

  const filteredRecords = (records: ComplianceRecord[]) => {
    if (statusFilter === 'all') return records;
    return records.filter(r => r.status === statusFilter);
  };

  const statuses = [
    { value: 'all', label: 'All', color: 'bg-slate-100 text-slate-700' },
    { value: 'valid', label: 'Valid', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'due_soon', label: 'Due Soon', color: 'bg-amber-100 text-amber-700' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {statuses.map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                statusFilter === s.value
                  ? `${s.color} shadow-sm`
                  : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-200">
          <option value="risk">Sort: Risk ↑</option>
          <option value="name">Sort: A-Z</option>
        </select>
      </div>

      {/* Properties */}
      {filtered.length === 0 ? (
        <EmptyState icon={<IconShield />} title="No compliance records"
          description="Add a property first, then set up compliance tracking"
          action={<Link href="/app/properties/new"><Button><IconPlus className="w-4 h-4" /> Add Property</Button></Link>} />
      ) : (
        filtered.map(({ property, records, score, missingTypes }, idx) => {
          const visibleRecords = filteredRecords(records);
          return (
            <div key={property.id}
              className="rounded-2xl bg-white border border-slate-200/60 p-5 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.1),0_0_0_1px_rgba(99,102,241,0.06)] animate-slide-up"
              style={{ animationDelay: `${idx * 75}ms` }}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <ScoreCircleSmall score={score} />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">{property.nickname}</h3>
                  <p className="text-xs text-slate-500">{property.address_line_1}, {property.postcode}</p>
                </div>
                <Link href={`/app/properties/${property.id}`}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-all">
                  View →
                </Link>
              </div>

              {/* Records */}
              {visibleRecords.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visibleRecords.map((item) => (
                    <div key={item.id}
                      className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 hover:translate-y-[-2px] ${
                        item.status === 'valid' ? 'border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)]' :
                        item.status === 'due_soon' ? 'border-amber-100 bg-gradient-to-br from-amber-50/50 to-white hover:shadow-[0_8px_24px_rgba(245,158,11,0.12)]' :
                        item.status === 'overdue' ? 'border-red-100 bg-gradient-to-br from-red-50/50 to-white hover:shadow-[0_8px_24px_rgba(239,68,68,0.12)]' :
                        'border-slate-100 bg-gradient-to-br from-slate-50/50 to-white hover:shadow-[0_8px_24px_rgba(99,102,241,0.08)]'
                      }`}>
                      <span className="text-lg">{COMPLIANCE_TYPE_ICONS[item.compliance_type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {COMPLIANCE_TYPE_LABELS[item.compliance_type]}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.due_date && <p className="text-xs text-slate-500">Due: {formatDate(item.due_date)}</p>}
                          {item.provider_name && <p className="text-xs text-slate-400">· {item.provider_name}</p>}
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              ) : statusFilter !== 'all' ? (
                <p className="text-sm text-slate-400 py-2">No {statusFilter.replace('_', ' ')} records</p>
              ) : (
                <p className="text-sm text-slate-400 py-2">No compliance records yet</p>
              )}

              {/* Missing Items */}
              {missingTypes.length > 0 && statusFilter === 'all' && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Missing — add to improve score</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingTypes.map(type => (
                      <span key={type} className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100 border-dashed">
                        {COMPLIANCE_TYPE_ICONS[type]} {COMPLIANCE_TYPE_LABELS[type]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

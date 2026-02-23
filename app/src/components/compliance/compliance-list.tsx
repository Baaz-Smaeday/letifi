'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/shared';
import { IconShield } from '@/components/ui/icons';
import { ComplianceEditModal } from './compliance-edit-modal';
import {
  COMPLIANCE_TYPE_LABELS, COMPLIANCE_TYPE_ICONS,
  type ComplianceRecord,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface Props {
  records: ComplianceRecord[];
}

export function ComplianceList({ records }: Props) {
  const [editRecord, setEditRecord] = useState<ComplianceRecord | null>(null);

  if (records.length === 0) {
    return <EmptyState icon={<IconShield />} title="No compliance records" description="Add compliance tracking for this property" />;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {records.map((item) => {
          const icon = COMPLIANCE_TYPE_ICONS[item.compliance_type] || '📋';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setEditRecord(item)}
              className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 hover:translate-y-[-3px] text-left w-full cursor-pointer ${
                item.status === 'valid' ? 'border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white hover:shadow-[0_16px_40px_rgba(16,185,129,0.2),0_0_30px_rgba(16,185,129,0.08)]' :
                item.status === 'due_soon' ? 'border-amber-100 bg-gradient-to-br from-amber-50/50 to-white hover:shadow-[0_16px_40px_rgba(245,158,11,0.2),0_0_30px_rgba(245,158,11,0.08)]' :
                item.status === 'overdue' ? 'border-red-100 bg-gradient-to-br from-red-50/50 to-white hover:shadow-[0_16px_40px_rgba(239,68,68,0.2),0_0_30px_rgba(239,68,68,0.08)]' :
                'border-slate-100 bg-gradient-to-br from-slate-50/50 to-white hover:shadow-[0_16px_40px_rgba(99,102,241,0.15)]'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{COMPLIANCE_TYPE_LABELS[item.compliance_type]}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.due_date && <p className="text-xs text-slate-500">Due: {formatDate(item.due_date)}</p>}
                  {item.provider_name && <p className="text-xs text-slate-400">· {item.provider_name}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                <span className="text-xs text-slate-300">✏️</span>
              </div>
            </button>
          );
        })}
      </div>

      {editRecord && (
        <ComplianceEditModal
          record={editRecord}
          open={!!editRecord}
          onClose={() => setEditRecord(null)}
        />
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  COMPLIANCE_TYPE_LABELS,
  COMPLIANCE_TYPE_ICONS,
  RESIDENTIAL_COMPLIANCE_TYPES,
  COMMERCIAL_COMPLIANCE_TYPES,
  isCommercialProperty,
  type ComplianceType,
  type PropertyType,
} from '@/lib/types';

interface ComplianceToggleProps {
  propertyId: string;
  propertyType: PropertyType;
  enabledTypes: string[] | null;
}

export function ComplianceToggle({ propertyId, propertyType, enabledTypes }: ComplianceToggleProps) {
  const isCommercial = isCommercialProperty(propertyType);
  const suggestedTypes = isCommercial ? COMMERCIAL_COMPLIANCE_TYPES : RESIDENTIAL_COMPLIANCE_TYPES;
  
  const [selected, setSelected] = useState<Set<string>>(
    new Set(enabledTypes || suggestedTypes)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function toggle(type: ComplianceType) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setSaved(false);
  }

  function selectAll() {
    setSelected(new Set(suggestedTypes));
    setSaved(false);
  }

  function clearAll() {
    setSelected(new Set());
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from('properties')
        .update({ enabled_compliance_types: Array.from(selected) })
        .eq('id', propertyId);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Score Tracking</h3>
          <p className="text-xs text-slate-500 mt-0.5">Choose which items count towards your score</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="text-xs text-brand-600 hover:text-brand-700 font-medium">All</button>
          <span className="text-slate-300">|</span>
          <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-700 font-medium">None</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestedTypes.map((type) => {
          const isOn = selected.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm border-2 transition-all duration-300 ${
                isOn
                  ? 'border-brand-200 bg-brand-50/50 text-brand-700'
                  : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
              }`}
            >
              <span className="text-base">{COMPLIANCE_TYPE_ICONS[type]}</span>
              <span className={`flex-1 font-medium ${isOn ? 'text-slate-900' : 'text-slate-400'}`}>
                {COMPLIANCE_TYPE_LABELS[type]}
              </span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                isOn 
                  ? 'bg-brand-500 text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]'
                  : 'bg-slate-100'
              }`}>
                {isOn && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
            saved 
              ? 'bg-emerald-100 text-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
              : 'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
          } disabled:opacity-50`}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : `Save (${selected.size} items)`}
        </button>
        <span className="text-xs text-slate-400">
          Score based on {selected.size} compliance {selected.size === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  );
}

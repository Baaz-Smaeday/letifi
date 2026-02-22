'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { IconPlus } from '@/components/ui/icons';
import { createComplianceRecord } from '@/lib/actions';
import {
  COMPLIANCE_TYPE_LABELS,
  COMPLIANCE_TYPE_ICONS,
  RESIDENTIAL_COMPLIANCE_TYPES,
  COMMERCIAL_COMPLIANCE_TYPES,
  isCommercialProperty,
  type Property,
  type ComplianceType,
} from '@/lib/types';

interface Props {
  properties: Property[];
}

export function ComplianceAddModal({ properties }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [complianceType, setComplianceType] = useState<ComplianceType>('gas_safety');
  const [lastCompleted, setLastCompleted] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderDays, setReminderDays] = useState(30);

  // Get the selected property and filter compliance types
  const selectedProperty = properties.find(p => p.id === propertyId);
  const relevantTypes = useMemo(() => {
    if (!selectedProperty) return RESIDENTIAL_COMPLIANCE_TYPES;
    return isCommercialProperty(selectedProperty.property_type)
      ? COMMERCIAL_COMPLIANCE_TYPES
      : RESIDENTIAL_COMPLIANCE_TYPES;
  }, [selectedProperty]);

  // Reset compliance type when property changes and current type isn't relevant
  function handlePropertyChange(newId: string) {
    setPropertyId(newId);
    const newProp = properties.find(p => p.id === newId);
    if (newProp) {
      const newTypes = isCommercialProperty(newProp.property_type)
        ? COMMERCIAL_COMPLIANCE_TYPES
        : RESIDENTIAL_COMPLIANCE_TYPES;
      if (!newTypes.includes(complianceType)) {
        setComplianceType(newTypes[0]);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createComplianceRecord({
        property_id: propertyId,
        compliance_type: complianceType,
        last_completed_date: lastCompleted || undefined,
        due_date: dueDate || undefined,
        reminder_days: reminderDays,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (properties.length === 0) return null;

  const isCommercial = selectedProperty ? isCommercialProperty(selectedProperty.property_type) : false;

  return (
    <>
      <Button size="md" onClick={() => setOpen(true)}>
        <IconPlus className="w-4 h-4" />
        Add Record
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Compliance Record">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Property"
            value={propertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
            options={properties.map((p) => ({ value: p.id, label: p.nickname }))}
          />

          {/* Show property type indicator */}
          <div className={`text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${
            isCommercial 
              ? 'bg-blue-50 text-blue-700' 
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            {isCommercial ? '🏪 Commercial' : '🏠 Residential'} compliance
          </div>

          <Select
            label="Compliance type"
            value={complianceType}
            onChange={(e) => setComplianceType(e.target.value as ComplianceType)}
            options={relevantTypes.map((type) => ({
              value: type,
              label: `${COMPLIANCE_TYPE_ICONS[type]} ${COMPLIANCE_TYPE_LABELS[type]}`,
            }))}
          />

          <Input
            label="Last completed date"
            type="date"
            value={lastCompleted}
            onChange={(e) => setLastCompleted(e.target.value)}
          />

          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Input
            label="Reminder (days before due)"
            type="number"
            min={0}
            max={365}
            value={reminderDays}
            onChange={(e) => setReminderDays(parseInt(e.target.value) || 30)}
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

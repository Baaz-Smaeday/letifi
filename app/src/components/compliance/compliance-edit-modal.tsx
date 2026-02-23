'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { updateComplianceRecord, deleteComplianceRecord } from '@/lib/actions';
import {
  COMPLIANCE_TYPE_LABELS, COMPLIANCE_TYPE_ICONS, COMPLIANCE_HELP_TEXT,
  COMPLIANCE_EXPIRY_MONTHS,
  type ComplianceRecord, type ComplianceType,
} from '@/lib/types';

interface Props {
  record: ComplianceRecord;
  open: boolean;
  onClose: () => void;
}

export function ComplianceEditModal({ record, open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [issueDate, setIssueDate] = useState(record.issue_date || record.last_completed_date || '');
  const [dueDate, setDueDate] = useState(record.due_date || '');
  const [providerName, setProviderName] = useState(record.provider_name || '');
  const [certificateRef, setCertificateRef] = useState(record.certificate_ref || '');
  const [reminderDays, setReminderDays] = useState(record.reminder_days || 30);
  const [notes, setNotes] = useState(record.notes || '');

  const helpText = COMPLIANCE_HELP_TEXT[record.compliance_type];
  const expiryMonths = COMPLIANCE_EXPIRY_MONTHS[record.compliance_type];

  function handleIssueDateChange(date: string) {
    setIssueDate(date);
    if (date && expiryMonths && expiryMonths > 0) {
      const d = new Date(date);
      d.setMonth(d.getMonth() + expiryMonths);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      await updateComplianceRecord(record.id, {
        last_completed_date: issueDate || undefined,
        issue_date: issueDate || undefined,
        due_date: dueDate || undefined,
        expiry_date: dueDate || undefined,
        provider_name: providerName || undefined,
        certificate_ref: certificateRef || undefined,
        reminder_days: reminderDays,
        notes: notes || undefined,
      });
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm('Delete this compliance record? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteComplianceRecord(record.id);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally { setDeleting(false); }
  }

  const icon = COMPLIANCE_TYPE_ICONS[record.compliance_type] || '📋';
  const label = COMPLIANCE_TYPE_LABELS[record.compliance_type];

  return (
    <Modal open={open} onClose={onClose} title="Edit Compliance Record">
      <div className="space-y-4">
        {/* Type header */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50/50 border border-brand-100">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm font-bold text-slate-900">{label}</p>
            {helpText && <p className="text-xs text-slate-500 mt-0.5">{helpText}</p>}
          </div>
        </div>

        <Input label="Provider / Engineer name" placeholder="e.g. SafeGas Ltd"
          value={providerName} onChange={(e) => setProviderName(e.target.value)} />

        <Input label="Certificate / Reference number" placeholder="e.g. CP12-2025-001"
          value={certificateRef} onChange={(e) => setCertificateRef(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Issue date" type="date" value={issueDate}
            onChange={(e) => handleIssueDateChange(e.target.value)} />
          <div>
            <Input label="Expiry / Due date" type="date" value={dueDate}
              onChange={(e) => setDueDate(e.target.value)} />
            {expiryMonths && expiryMonths > 0 && (
              <p className="text-[10px] text-brand-500 mt-1">
                ⚡ Auto: {expiryMonths >= 12 ? `${expiryMonths/12}yr` : `${expiryMonths}mo`} from issue
              </p>
            )}
          </div>
        </div>

        <Input label="Reminder (days before due)" type="number" min={0} max={365}
          value={reminderDays} onChange={(e) => setReminderDays(parseInt(e.target.value) || 30)} />

        <Input label="Notes (optional)" placeholder="Any additional notes..."
          value={notes} onChange={(e) => setNotes(e.target.value)} />

        {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</div>}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} loading={loading}>Update</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <button onClick={handleDelete} disabled={deleting}
            className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all">
            {deleting ? 'Deleting...' : '🗑 Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

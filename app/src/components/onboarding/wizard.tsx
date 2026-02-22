'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { IconCheck } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { createProperty, createTenancy, createComplianceRecord, completeOnboarding } from '@/lib/actions';
import {
  PROPERTY_TYPE_LABELS,
  OWNERSHIP_LABELS,
  TENANCY_TYPE_LABELS,
  DEPOSIT_SCHEME_LABELS,
  COMPLIANCE_TYPE_LABELS,
  type PropertyType,
  type OwnershipType,
  type TenancyType,
  type DepositScheme,
  type ComplianceType,
} from '@/lib/types';

const STEPS = [
  { label: 'Property', description: 'Add your first property' },
  { label: 'Tenancy', description: 'Set up a tenancy' },
  { label: 'Rent', description: 'Rent details' },
  { label: 'Compliance', description: 'Set up compliance items' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Property state
  const [nickname, setNickname] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('house');
  const [ownership, setOwnership] = useState<OwnershipType>('personal');

  // Tenancy state
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenancyType, setTenancyType] = useState<TenancyType>('ast');
  const [startDate, setStartDate] = useState('');

  // Rent state
  const [rentAmount, setRentAmount] = useState('');
  const [rentFrequency, setRentFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [rentDueDay, setRentDueDay] = useState('1');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositScheme, setDepositScheme] = useState<DepositScheme>('dps');

  // Compliance state
  const [complianceItems, setComplianceItems] = useState<
    { type: ComplianceType; dueDate: string; enabled: boolean }[]
  >(
    (Object.keys(COMPLIANCE_TYPE_LABELS) as ComplianceType[]).map((type) => ({
      type,
      dueDate: '',
      enabled: false,
    }))
  );

  // Created IDs
  const [propertyId, setPropertyId] = useState('');

  async function handleNext() {
    setError('');
    setLoading(true);

    try {
      if (step === 0) {
        // Create property
        const property = await createProperty({
          nickname,
          address_line_1: addressLine1,
          city,
          postcode,
          property_type: propertyType,
          ownership,
        });
        setPropertyId(property.id);
        setStep(1);
      } else if (step === 1) {
        // Validation only – tenancy created with rent in step 2
        if (!tenantName || !startDate) {
          setError('Please enter tenant name and start date');
          return;
        }
        setStep(2);
      } else if (step === 2) {
        // Create tenancy with rent details
        await createTenancy({
          property_id: propertyId,
          tenant_name: tenantName,
          tenant_email: tenantEmail || undefined,
          tenant_phone: tenantPhone || undefined,
          tenancy_type: tenancyType,
          start_date: startDate,
          rent_amount: parseFloat(rentAmount),
          rent_frequency: rentFrequency,
          rent_due_day: parseInt(rentDueDay) || undefined,
          deposit_amount: depositAmount ? parseFloat(depositAmount) : undefined,
          deposit_scheme: depositScheme,
        });
        setStep(3);
      } else if (step === 3) {
        // Create compliance records
        const enabled = complianceItems.filter((c) => c.enabled);
        for (const item of enabled) {
          await createComplianceRecord({
            property_id: propertyId,
            compliance_type: item.type,
            due_date: item.dueDate || undefined,
            reminder_days: 30,
          });
        }
        await completeOnboarding();
        // completeOnboarding redirects to dashboard
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    if (step === 3) {
      setLoading(true);
      await completeOnboarding();
    } else {
      setStep(step + 1);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-bold">Le</span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Letifi</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 px-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  i <= step ? 'bg-slate-900' : 'bg-slate-200'
                )}
              />
              <p
                className={cn(
                  'text-[10px] mt-1.5 font-medium',
                  i <= step ? 'text-slate-900' : 'text-slate-400'
                )}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <Card padding="lg" className="animate-scale-in">
          <h2 className="text-lg font-bold text-slate-900 mb-1">{STEPS[step].description}</h2>
          <p className="text-sm text-slate-500 mb-6">
            Step {step + 1} of {STEPS.length}
          </p>

          {/* Step 0: Property */}
          {step === 0 && (
            <div className="space-y-4">
              <Input
                label="Property nickname"
                placeholder='e.g. "Flat 2, Oak Street"'
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
              <Input
                label="Address"
                placeholder="123 Oak Street"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Manchester"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Input
                  label="Postcode"
                  placeholder="M1 1AA"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  options={Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => ({
                    value: v,
                    label: l,
                  }))}
                />
                <Select
                  label="Ownership"
                  value={ownership}
                  onChange={(e) => setOwnership(e.target.value as OwnershipType)}
                  options={Object.entries(OWNERSHIP_LABELS).map(([v, l]) => ({
                    value: v,
                    label: l,
                  }))}
                />
              </div>
            </div>
          )}

          {/* Step 1: Tenancy */}
          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="Tenant full name"
                placeholder="Jane Smith"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
              />
              <Input
                label="Email (optional)"
                type="email"
                placeholder="jane@example.com"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
              />
              <Input
                label="Phone (optional)"
                type="tel"
                placeholder="07700 900000"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
              />
              <Select
                label="Tenancy type"
                value={tenancyType}
                onChange={(e) => setTenancyType(e.target.value as TenancyType)}
                options={Object.entries(TENANCY_TYPE_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
              />
              <Input
                label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          )}

          {/* Step 2: Rent */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Rent amount (£)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="850.00"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  required
                />
                <Select
                  label="Frequency"
                  value={rentFrequency}
                  onChange={(e) => setRentFrequency(e.target.value as 'monthly' | 'weekly')}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'weekly', label: 'Weekly' },
                  ]}
                />
              </div>
              <Input
                label="Rent due day"
                type="number"
                min={1}
                max={31}
                value={rentDueDay}
                onChange={(e) => setRentDueDay(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Deposit amount (£)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="850.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <Select
                  label="Deposit scheme"
                  value={depositScheme}
                  onChange={(e) => setDepositScheme(e.target.value as DepositScheme)}
                  options={Object.entries(DEPOSIT_SCHEME_LABELS).map(([v, l]) => ({
                    value: v,
                    label: l,
                  }))}
                />
              </div>
            </div>
          )}

          {/* Step 3: Compliance */}
          {step === 3 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {complianceItems.map((item, i) => (
                <div
                  key={item.type}
                  className={cn(
                    'rounded-xl border p-4 transition-all',
                    item.enabled ? 'border-slate-900 bg-slate-50' : 'border-slate-100'
                  )}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => {
                        const updated = [...complianceItems];
                        updated[i].enabled = e.target.checked;
                        setComplianceItems(updated);
                      }}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500"
                    />
                    <span className="text-sm font-medium text-slate-900">
                      {COMPLIANCE_TYPE_LABELS[item.type]}
                    </span>
                  </label>
                  {item.enabled && (
                    <div className="mt-3 ml-7">
                      <Input
                        label="Due date"
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => {
                          const updated = [...complianceItems];
                          updated[i].dueDate = e.target.value;
                          setComplianceItems(updated);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mt-4">{error}</div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              <Button onClick={handleNext} loading={loading}>
                {step === STEPS.length - 1 ? 'Finish Setup' : 'Continue'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { createProperty, updateProperty } from '@/lib/actions';
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  OWNERSHIP_LABELS,
  RESIDENTIAL_TYPES,
  COMMERCIAL_TYPES,
  isCommercialProperty,
  type Property,
  type PropertyType,
  type PropertyFormData,
} from '@/lib/types';

interface PropertyFormProps {
  property?: Property;
}

export function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = !!property;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<PropertyFormData>({
    nickname: property?.nickname || '',
    address_line_1: property?.address_line_1 || '',
    address_line_2: property?.address_line_2 || '',
    city: property?.city || '',
    county: property?.county || '',
    postcode: property?.postcode || '',
    property_type: property?.property_type || 'house',
    bedrooms: property?.bedrooms || undefined,
    ownership: property?.ownership || 'personal',
  });

  const isCommercial = isCommercialProperty(form.property_type);

  function updateField<K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await updateProperty(property.id, form);
        router.push(`/app/properties/${property.id}`);
      } else {
        const newProp = await createProperty(form);
        router.push(`/app/properties/${newProp.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Property nickname"
          placeholder={isCommercial ? 'e.g. "High Street Shop"' : 'e.g. "Flat 2, Oak Street"'}
          value={form.nickname}
          onChange={(e) => updateField('nickname', e.target.value)}
          required
        />

        {/* Property Type Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Property type</label>
          
          {/* Residential */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">🏠 Residential</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {RESIDENTIAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField('property_type', type)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-300 ${
                  form.property_type === type
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-[0_4px_12px_rgba(99,102,241,0.15)]'
                    : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{PROPERTY_TYPE_ICONS[type]}</span>
                <span>{PROPERTY_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>

          {/* Commercial */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">🏪 Commercial</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COMMERCIAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField('property_type', type)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-300 ${
                  form.property_type === type
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-[0_4px_12px_rgba(99,102,241,0.15)]'
                    : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{PROPERTY_TYPE_ICONS[type]}</span>
                <span>{PROPERTY_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        <Select
          label="Ownership"
          value={form.ownership}
          onChange={(e) => updateField('ownership', e.target.value as PropertyFormData['ownership'])}
          options={Object.entries(OWNERSHIP_LABELS).map(([v, l]) => ({
            value: v,
            label: l,
          }))}
        />

        <Input
          label="Address line 1"
          placeholder={isCommercial ? '123 High Street' : '123 Oak Street'}
          value={form.address_line_1}
          onChange={(e) => updateField('address_line_1', e.target.value)}
          required
        />

        <Input
          label="Address line 2 (optional)"
          placeholder={isCommercial ? 'Unit 5' : 'Flat 2'}
          value={form.address_line_2 || ''}
          onChange={(e) => updateField('address_line_2', e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="City"
            placeholder="Manchester"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
            required
          />
          <Input
            label="County (optional)"
            placeholder="Greater Manchester"
            value={form.county || ''}
            onChange={(e) => updateField('county', e.target.value)}
          />
          <Input
            label="Postcode"
            placeholder="M1 1AA"
            value={form.postcode}
            onChange={(e) => updateField('postcode', e.target.value.toUpperCase())}
            required
          />
        </div>

        {!isCommercial && (
          <Input
            label="Bedrooms (optional)"
            type="number"
            min={0}
            max={20}
            value={form.bedrooms || ''}
            onChange={(e) => updateField('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        )}

        {/* Info box based on type */}
        {isCommercial && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">📋 Commercial Property</p>
            <p className="text-blue-600">
              {form.property_type === 'restaurant' 
                ? 'Food Hygiene Rating and Premises Licence compliance will be available for this property.'
                : form.property_type === 'retail'
                ? 'Premises Licence and Fire Risk Assessment compliance will be available.'
                : 'Commercial EPC, Fire Risk Assessment, and Asbestos Survey compliance will be available.'}
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Add Property'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

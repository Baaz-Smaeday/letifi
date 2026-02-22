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
  OWNERSHIP_LABELS,
  type Property,
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Property nickname"
          placeholder='e.g. "Flat 2, Oak Street"'
          value={form.nickname}
          onChange={(e) => updateField('nickname', e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Property type"
            value={form.property_type}
            onChange={(e) => updateField('property_type', e.target.value as PropertyFormData['property_type'])}
            options={Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />
          <Select
            label="Ownership"
            value={form.ownership}
            onChange={(e) => updateField('ownership', e.target.value as PropertyFormData['ownership'])}
            options={Object.entries(OWNERSHIP_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />
        </div>

        <Input
          label="Address line 1"
          placeholder="123 Oak Street"
          value={form.address_line_1}
          onChange={(e) => updateField('address_line_1', e.target.value)}
          required
        />

        <Input
          label="Address line 2 (optional)"
          placeholder="Flat 2"
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

        <Input
          label="Bedrooms (optional)"
          type="number"
          min={0}
          max={20}
          value={form.bedrooms || ''}
          onChange={(e) => updateField('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
        />

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

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/shared';
import { PropertyForm } from '@/components/properties/property-form';
import type { Property } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from('properties').select('*').eq('id', id).single();

  if (!data) notFound();

  const property = data as Property;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Edit ${property.nickname}`}
        description="Update property details"
      />
      <PropertyForm property={property} />
    </div>
  );
}

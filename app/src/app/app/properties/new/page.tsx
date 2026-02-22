import { PageHeader } from '@/components/ui/shared';
import { PropertyForm } from '@/components/properties/property-form';

export default function NewPropertyPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Add Property"
        description="Add a new rental property to your portfolio"
      />
      <PropertyForm />
    </div>
  );
}

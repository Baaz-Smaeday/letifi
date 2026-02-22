import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, EmptyState } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreCircleSmall } from '@/components/ui/score-circle';
import { IconBuilding, IconPlus, IconChevronRight, IconUser } from '@/components/ui/icons';
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, type Property, type Tenancy, type ComplianceRecord } from '@/lib/types';
import { formatCurrency, calculatePropertyScore } from '@/lib/utils';

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase.from('accounts').select('id').eq('user_id', user.id).single();
  if (!account) return null;

  const { data: properties } = await supabase
    .from('properties').select('*').eq('account_id', account.id).order('created_at', { ascending: false });
  const { data: tenancies } = await supabase
    .from('tenancies').select('*').eq('account_id', account.id).eq('is_active', true);
  const { data: compliance } = await supabase
    .from('compliance_records').select('*').eq('account_id', account.id);

  const allProperties = (properties || []) as Property[];
  const allTenancies = (tenancies || []) as Tenancy[];
  const allCompliance = (compliance || []) as ComplianceRecord[];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Properties"
        description={`${allProperties.length} propert${allProperties.length === 1 ? 'y' : 'ies'}`}
        action={
          <Link href="/app/properties/new">
            <Button size="md"><IconPlus className="w-4 h-4" /> Add Property</Button>
          </Link>
        }
      />

      {allProperties.length === 0 ? (
        <EmptyState
          icon={<IconBuilding />}
          title="No properties yet"
          description="Add your first rental property to get started"
          action={<Link href="/app/properties/new"><Button><IconPlus className="w-4 h-4" /> Add Property</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {allProperties.map((property, i) => {
            const propertyTenancies = allTenancies.filter((t) => t.property_id === property.id);
            const propertyCompliance = allCompliance.filter((c) => c.property_id === property.id);
            const score = calculatePropertyScore(propertyCompliance, property.enabled_compliance_types);
            const activeTenant = propertyTenancies[0];
            const monthlyRent = activeTenant ? Number(activeTenant.rent_amount) : 0;

            return (
              <Link key={property.id} href={`/app/properties/${property.id}`}>
                <div
                  className="card-3d flex items-center gap-4 p-5 animate-slide-up"
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  <ScoreCircleSmall score={score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{property.nickname}</h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {property.address_line_1}, {property.postcode}
                        </p>
                      </div>
                      <IconChevronRight className="text-slate-300 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center flex-wrap gap-2 mt-2.5">
                      <Badge>{PROPERTY_TYPE_ICONS[property.property_type]} {PROPERTY_TYPE_LABELS[property.property_type]}</Badge>
                      {activeTenant && (
                        <Badge variant="info">
                          <span className="flex items-center gap-1">
                            <IconUser className="w-3 h-3" />{activeTenant.tenant_name.split(' ')[0]}
                          </span>
                        </Badge>
                      )}
                      {monthlyRent > 0 && <Badge variant="success">{formatCurrency(monthlyRent)}/mo</Badge>}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

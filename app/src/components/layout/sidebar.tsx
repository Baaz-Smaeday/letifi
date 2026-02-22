'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  IconDashboard,
  IconBuilding,
  IconShield,
  IconCurrency,
  IconCalculator,
  IconDocument,
} from '@/components/ui/icons';

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/app/properties', label: 'Properties', icon: IconBuilding },
  { href: '/app/compliance', label: 'Compliance', icon: IconShield },
  { href: '/app/money', label: 'Money', icon: IconCurrency },
  { href: '/app/tax', label: 'Tax Centre', icon: IconCalculator },
  { href: '/app/documents', label: 'Documents', icon: IconDocument },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex w-56 flex-col border-r border-slate-100 bg-white/50 pt-4 px-3 pb-6">
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                isActive
                  ? 'nav-active text-white'
                  : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
              )}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

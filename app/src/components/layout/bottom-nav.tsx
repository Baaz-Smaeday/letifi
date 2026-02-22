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
  { href: '/app/tax', label: 'Tax', icon: IconCalculator },
  { href: '/app/documents', label: 'Docs', icon: IconDocument },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t border-slate-100/50 pb-safe sm:hidden">
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all duration-200',
                isActive ? 'text-brand-600' : 'text-slate-400 active:text-slate-600'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-all duration-300',
                  isActive && 'nav-active text-white scale-110'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import Link from 'next/link';

export function AdminNav({ current }: { current: string }) {
  const links = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/landlords', label: 'Landlords' },
    { href: '/admin/staff', label: 'Staff' },
    { href: '/admin/revenue', label: 'Revenue' },
  ];

  return (
    <nav className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            current === l.href ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

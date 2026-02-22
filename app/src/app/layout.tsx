import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Letifi – UK Landlord Compliance & Tax Tracker',
  description: 'Simple compliance tracking and quarterly tax management for UK self-managed landlords.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

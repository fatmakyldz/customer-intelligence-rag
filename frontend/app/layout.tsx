import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MOD-DC Local Intelligence Platform',
  description:
    'Offline AI risk analyst for modular edge data centers — analyzes sensor logs, UPS events, fire alarms, and maintenance records locally.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-gray-200 antialiased">{children}</body>
    </html>
  );
}

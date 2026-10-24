import type { Metadata } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Photobooth Terintegrasi',
  description: 'Sistem photobooth modern dengan kamera Canon, antrean digital, dan cetak 4R.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased selection:bg-ultramarine selection:text-white">
        {children}
      </body>
    </html>
  );
}

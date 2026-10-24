import type { Metadata } from 'next';
import { Bricolage_Grotesque, Figtree, Press_Start_2P, Pixelify_Sans } from 'next/font/google';
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

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel-display',
  display: 'swap',
});

const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pixel-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Photobooth Terintegrasi — Expo Wisuda TIK 2026',
  description: 'Sistem photobooth modern bertema Pixel Metropolitan dengan kamera Canon dan cetak 4R.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${bricolage.variable} ${figtree.variable} ${pressStart2P.variable} ${pixelifySans.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink antialiased selection:bg-ultramarine selection:text-white">
        {children}
      </body>
    </html>
  );
}

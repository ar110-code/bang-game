import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'بازی فکری غرب وحشی (بنگ - BANG!) | نسخه تحت وب آنلاین',
  description: 'بازی آنلاین چندنفره کارتی و نقش‌مخفی غرب وحشی (Bang!) با استنتاج، بلوف‌زنی، شلیک و دوئل‌های مرگبار',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-saloon-950 text-saloon-100 flex flex-col antialiased selection:bg-amber-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Montserrat_Alternates } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import './globals.scss';

const montserrat = Montserrat_Alternates({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kino-kot.com';

export const metadata: Metadata = {
  title: 'КиноКот — честные отзывы на фильмы и сериалы',
  description: 'Читайте и пишите отзывы на фильмы, сериалы и мультфильмы. Оценивайте, обсуждайте и находите что посмотреть вместе с КиноКотом.',
  icons: {
    icon: '/images/favicon.ico',
  },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'КиноКот',
    title: 'КиноКот — честные отзывы на фильмы и сериалы',
    description: 'Читайте и пишите отзывы на фильмы, сериалы и мультфильмы. Оценивайте, обсуждайте и находите что посмотреть вместе с КиноКотом.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'КиноКот — честные отзывы на фильмы и сериалы',
    description: 'Читайте и пишите отзывы на фильмы, сериалы и мультфильмы. Оценивайте, обсуждайте и находите что посмотреть вместе с КиноКотом.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={montserrat.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}

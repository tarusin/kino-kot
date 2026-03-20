import type { Metadata } from 'next';
import { Montserrat_Alternates } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import './globals.scss';

const montserrat = Montserrat_Alternates({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: 'КиноКот — фильмы, сериалы, отзывы',
  description: 'КиноКот поможет вам определить вкус в фильмографии. Ищите фильмы, сериалы, мультфильмы и делитесь отзывами.',
  icons: {
    icon: '/images/favicon.ico',
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

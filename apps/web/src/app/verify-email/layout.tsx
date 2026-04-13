import type { ReactNode } from 'react';
import { createNoIndexMetadata } from '@/lib/seo';

export const metadata = createNoIndexMetadata({
  title: 'Подтверждение email',
  description: 'Служебная страница подтверждения email в КиноКоте.',
  path: '/verify-email',
});

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return children;
}

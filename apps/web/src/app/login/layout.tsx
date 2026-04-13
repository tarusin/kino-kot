import type { ReactNode } from 'react';
import { createNoIndexMetadata } from '@/lib/seo';

export const metadata = createNoIndexMetadata({
  title: 'Вход',
  description: 'Вход в аккаунт КиноКот.',
  path: '/login',
});

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}

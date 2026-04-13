import type { ReactNode } from 'react';
import { createNoIndexMetadata } from '@/lib/seo';

export const metadata = createNoIndexMetadata({
  title: 'Регистрация',
  description: 'Создание аккаунта КиноКот.',
  path: '/register',
});

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}

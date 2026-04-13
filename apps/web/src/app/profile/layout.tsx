import type { ReactNode } from 'react';
import { createNoIndexMetadata } from '@/lib/seo';

export const metadata = createNoIndexMetadata({
  title: 'Профиль',
  description: 'Личный кабинет пользователя КиноКота.',
  path: '/profile',
});

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}

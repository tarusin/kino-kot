import type { ReactNode } from 'react';
import { createNoIndexMetadata } from '@/lib/seo';

export const metadata = createNoIndexMetadata({
  title: 'Новый пароль',
  description: 'Служебная страница смены пароля в КиноКоте.',
  path: '/reset-password',
});

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}

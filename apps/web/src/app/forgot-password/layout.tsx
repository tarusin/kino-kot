import type { ReactNode } from 'react';
import { createNoIndexMetadata } from '@/lib/seo';

export const metadata = createNoIndexMetadata({
  title: 'Сброс пароля',
  description: 'Запрос на восстановление пароля в КиноКоте.',
  path: '/forgot-password',
});

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}

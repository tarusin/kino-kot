import type { ReactNode } from 'react';
import { createNoIndexMetadata } from '@/lib/seo';

export const metadata = createNoIndexMetadata({
  title: 'Админ-панель',
  description: 'Служебный раздел администрирования КиноКота.',
  path: '/admin',
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}

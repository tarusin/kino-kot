import type { ReactNode } from 'react';
import { createNoIndexMetadata } from '@/lib/seo';

export const metadata = createNoIndexMetadata({
  title: 'Поиск',
  description: 'Внутренний поиск фильмов, сериалов и мультфильмов на КиноКоте.',
  path: '/search',
});

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}

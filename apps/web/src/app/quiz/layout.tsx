import type { ReactNode } from 'react';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Тест: какой фильм посмотреть',
  description:
    'Пройдите тест КиноКота и получите персональные рекомендации фильмов по вашему вкусу.',
  path: '/quiz',
  keywords: ['тест какой фильм посмотреть', 'подбор фильма', 'кино тест'],
});

export default function QuizLayout({ children }: { children: ReactNode }) {
  return children;
}

'use client';

import Pagination from '@/components/Pagination/Pagination';

interface CartoonsPaginationProps {
  currentPage: number;
  totalPages: number;
  genre?: string;
  year?: string;
  country?: string;
  list?: string;
}

function buildHref(page: number, genre?: string, year?: string, country?: string, list?: string): string {
  const params = new URLSearchParams();
  if (list && list !== 'popular') params.set('list', list);
  if (genre) params.set('genre', genre);
  if (year) params.set('year', year);
  if (country) params.set('country', country);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/cartoons?${qs}` : '/cartoons';
}

export default function CartoonsPagination({ currentPage, totalPages, genre, year, country, list }: CartoonsPaginationProps) {
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      buildHref={(p) => buildHref(p, genre, year, country, list)}
    />
  );
}

'use client';

import Pagination from '@/components/Pagination/Pagination';

interface FilmsPaginationProps {
  currentPage: number;
  totalPages: number;
  genre?: string;
  year?: string;
  country?: string;
}

function buildHref(page: number, genre?: string, year?: string, country?: string): string {
  const params = new URLSearchParams();
  if (genre) params.set('genre', genre);
  if (year) params.set('year', year);
  if (country) params.set('country', country);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/films?${qs}` : '/films';
}

export default function FilmsPagination({ currentPage, totalPages, genre, year, country }: FilmsPaginationProps) {
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      buildHref={(p) => buildHref(p, genre, year, country)}
    />
  );
}

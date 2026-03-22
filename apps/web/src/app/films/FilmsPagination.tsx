'use client';

import Pagination from '@/components/Pagination/Pagination';

interface FilmsPaginationProps {
  currentPage: number;
  totalPages: number;
  genre?: string;
}

function buildHref(page: number, genre?: string): string {
  const params = new URLSearchParams();
  if (genre) params.set('genre', genre);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/films?${qs}` : '/films';
}

export default function FilmsPagination({ currentPage, totalPages, genre }: FilmsPaginationProps) {
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      buildHref={(p) => buildHref(p, genre)}
    />
  );
}

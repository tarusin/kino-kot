'use client';

import styles from './Pagination.module.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className={ styles['pagination'] }>
      <button
        className={ `${ styles['pagination__btn'] } ${ styles['pagination__btn--arrow'] }` }
        onClick={ () => onPageChange(currentPage - 1) }
        disabled={ currentPage === 1 }
        type="button"
        aria-label="Предыдущая страница"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 12L6 8l4-4"/>
        </svg>
      </button>

      { pages.map((page, index) =>
        page === '...' ? (
          <span key={ `ellipsis-${ index }` } className={ styles['pagination__ellipsis'] }>&hellip;</span>
        ) : (
          <button
            key={ page }
            className={ `${ styles['pagination__btn'] } ${ page === currentPage ? styles['pagination__btn--active'] : '' }` }
            onClick={ () => onPageChange(page) }
            type="button"
          >
            { page }
          </button>
        ),
      ) }

      <button
        className={ `${ styles['pagination__btn'] } ${ styles['pagination__btn--arrow'] }` }
        onClick={ () => onPageChange(currentPage + 1) }
        disabled={ currentPage === totalPages }
        type="button"
        aria-label="Следующая страница"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4l4 4-4 4"/>
        </svg>
      </button>
    </nav>
  );
}

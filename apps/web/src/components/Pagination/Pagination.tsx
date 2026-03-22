'use client';

import Link from 'next/link';
import styles from './Pagination.module.scss';

interface PaginationBaseProps {
  currentPage: number;
  totalPages: number;
}

interface PaginationCallbackProps extends PaginationBaseProps {
  onPageChange: (page: number) => void;
  buildHref?: never;
}

interface PaginationLinkProps extends PaginationBaseProps {
  buildHref: (page: number) => string;
  onPageChange?: never;
}

type PaginationProps = PaginationCallbackProps | PaginationLinkProps;

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

export default function Pagination({ currentPage, totalPages, onPageChange, buildHref }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(currentPage, totalPages);

  const isLink = !!buildHref;

  function renderPageButton(page: number, active: boolean) {
    const className = `${styles['pagination__btn']} ${active ? styles['pagination__btn--active'] : ''}`;

    if (isLink) {
      return (
        <Link key={page} href={buildHref(page)} className={className}>
          {page}
        </Link>
      );
    }

    return (
      <button
        key={page}
        className={className}
        onClick={() => onPageChange!(page)}
        type="button"
      >
        {page}
      </button>
    );
  }

  function renderArrow(direction: 'prev' | 'next') {
    const disabled = direction === 'prev' ? currentPage === 1 : currentPage === totalPages;
    const targetPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;
    const label = direction === 'prev' ? 'Предыдущая страница' : 'Следующая страница';
    const path = direction === 'prev' ? 'M10 12L6 8l4-4' : 'M6 4l4 4-4 4';
    const className = `${styles['pagination__btn']} ${styles['pagination__btn--arrow']}`;

    const icon = (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path}/>
      </svg>
    );

    if (isLink) {
      if (disabled) {
        return (
          <span className={className} style={{ color: 'var(--color-gray-dark, #E0E0E0)', cursor: 'default' }} aria-label={label}>
            {icon}
          </span>
        );
      }
      return (
        <Link href={buildHref(targetPage)} className={className} aria-label={label}>
          {icon}
        </Link>
      );
    }

    return (
      <button
        className={className}
        onClick={() => onPageChange!(targetPage)}
        disabled={disabled}
        type="button"
        aria-label={label}
      >
        {icon}
      </button>
    );
  }

  return (
    <nav className={styles['pagination']}>
      {renderArrow('prev')}

      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className={styles['pagination__ellipsis']}>&hellip;</span>
        ) : (
          renderPageButton(page as number, page === currentPage)
        ),
      )}

      {renderArrow('next')}
    </nav>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { getInitials } from '@/utils/getInitials';
import { getAvatarColor } from '@/utils/getAvatarColor';
import { getMoviePath } from '@/utils/getMoviePath';
import RandomMovieButton from '@/components/RandomMovieButton/RandomMovieButton';
import type { Movie } from '@/types/movie';
import styles from './Header.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 600);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      setHasMore(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`${API_URL}/movies/search?query=${encodeURIComponent(debouncedQuery)}&limit=5`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then(async (data: Movie[]) => {
        setHasMore(data.length > 5);
        const sliced = data.slice(0, 5);

        try {
          const ids = sliced.map((m) => m._id).join(',');
          if (ids) {
            const ratingsRes = await fetch(`${API_URL}/reviews/ratings?movieIds=${ids}`);
            if (ratingsRes.ok) {
              const ratings: Record<string, number> = await ratingsRes.json();
              sliced.forEach((m) => {
                if (ratings[m._id] !== undefined) m.kinoKotRating = ratings[m._id];
              });
            }
          }
        } catch {
          // ignore
        }

        setResults(sliced);
        setIsOpen(true);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
      if (window.innerWidth >= 576) {
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const navigateToSearch = useCallback(() => {
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setSearchQuery('');
      setResults([]);
      setIsMobileSearchOpen(false);
    }
  }, [searchQuery, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsMobileSearchOpen(false);
    }
    if (e.key === 'Enter') {
      navigateToSearch();
    }
  }, [navigateToSearch]);

  const handleResultClick = () => {
    setIsOpen(false);
    setSearchQuery('');
    setResults([]);
    setIsMobileSearchOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const formatYear = (date: string) => date?.slice(0, 4) || '';

  const formatGenres = (genres: string[]) =>
    genres?.slice(0, 2).join(', ') || '';

  const renderSearchResults = () => {
    if (!isOpen) return null;

    return results.length > 0 ? (
      <>
        {results.map((movie) => (
          <Link
            key={movie._id}
            href={getMoviePath(movie._id)}
            className={styles['header__search-result']}
            onClick={handleResultClick}
          >
            <div className={styles['header__search-poster']}>
              {movie.posterPath ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                  alt={movie.title}
                  width={40}
                  height={60}
                />
              ) : (
                <div className={styles['header__search-poster-placeholder']} />
              )}
            </div>
            <div className={styles['header__search-info']}>
              <span className={styles['header__search-title']}>{movie.title}</span>
              <span className={styles['header__search-meta']}>
                {formatYear(movie.releaseDate)}
                {movie.genres?.length > 0 && ` | ${formatGenres(movie.genres)}`}
              </span>
              <div className={styles['header__search-ratings']}>
                {movie.kinoKotRating !== undefined && (
                  <span className={styles['header__search-rating']}>
                    <Image src="/icons/rating-kk.svg" alt="КиноКот" width={16} height={16} />
                    {movie.kinoKotRating.toFixed(1)}
                  </span>
                )}
                <span className={styles['header__search-rating']}>
                  <Image src="/icons/rating-tmdb.svg" alt="TMDB" width={16} height={16} style={{ borderRadius: '50%' }} />
                  {movie.voteAverage?.toFixed(1)}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {hasMore && (
          <Link
            href={`/search?query=${encodeURIComponent(searchQuery)}`}
            className={styles['header__search-all']}
            onClick={handleResultClick}
          >
            Все результаты
          </Link>
        )}
      </>
    ) : (
      <div className={styles['header__search-empty']}>
        Ничего не найдено
      </div>
    );
  };

  return (
    <header className={styles['header']}>
      <div className={styles['header__wrap']}>
        <a href="/" className={styles['header__logo']}>
          <Image src="/images/logo.svg" alt="КиноКот" width={162} height={44} />
        </a>

        <button
          className={styles['header__burger']}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Открыть меню"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="#102031" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <nav className={styles['header__nav']}>
          <a href="/films" className={`${styles['header__link']} ${pathname.startsWith('/films') ? styles['header__link--active'] : ''}`}>Фильмы</a>
          <a href="/series" className={`${styles['header__link']} ${pathname.startsWith('/series') ? styles['header__link--active'] : ''}`}>Сериалы</a>
          <a href="/cartoons" className={`${styles['header__link']} ${pathname.startsWith('/cartoons') ? styles['header__link--active'] : ''}`}>Мультфильмы</a>
        </nav>

        {isMobileMenuOpen && (
          <>
            <div className={styles['header__backdrop']} onClick={() => setIsMobileMenuOpen(false)} />
            <div className={styles['header__mobile-menu']}>
              <button
                className={styles['header__mobile-close']}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Закрыть меню"
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#102031" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <a href="/films" className={`${styles['header__mobile-link']} ${pathname.startsWith('/films') ? styles['header__mobile-link--active'] : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Фильмы</a>
              <a href="/series" className={`${styles['header__mobile-link']} ${pathname.startsWith('/series') ? styles['header__mobile-link--active'] : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Сериалы</a>
              <a href="/cartoons" className={`${styles['header__mobile-link']} ${pathname.startsWith('/cartoons') ? styles['header__mobile-link--active'] : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Мультфильмы</a>
            </div>
          </>
        )}

        <div className={styles['header__actions']}>

          <RandomMovieButton />

          <button
            className={styles['header__search-trigger']}
            onClick={() => setIsMobileSearchOpen(true)}
            aria-label="Поиск"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className={styles['header__search']} ref={searchRef}>
            {isLoading ? (
              <span className={styles['header__search-spinner']} />
            ) : (
              <button
                type="button"
                className={styles['header__search-icon-btn']}
                onClick={navigateToSearch}
                aria-label="Поиск"
              >
                <svg className={styles['header__search-icon']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <input
              type="text"
              placeholder="Поиск"
              className={styles['header__search-input']}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => debouncedQuery.length >= 2 && setIsOpen(true)}
            />
            {searchQuery && (
              <button
                className={styles['header__search-clear']}
                onClick={handleClear}
                type="button"
              >
                <Image src="/icons/close.svg" alt="Очистить" width={14} height={14} />
              </button>
            )}

            {isOpen && (
              <div className={styles['header__search-dropdown']}>
                {renderSearchResults()}
              </div>
            )}
          </div>
          {!loading && (
            user ? (
              <div className={styles['header__user']}>
                <div className={styles['header__avatar']} style={{ backgroundColor: getAvatarColor(user.name) }}>
                  {getInitials(user.name)}
                </div>
                <div className={styles['header__dropdown']}>
                  <div className={styles['header__dropdown-menu']}>
                    {user.role === 'admin' && (
                      <Link href="/admin" className={styles['header__dropdown-item']}>
                        <Image src="/icons/admin.svg" alt="" width={20} height={20} />
                        Админка
                      </Link>
                    )}
                    <Link href="/profile" className={styles['header__dropdown-item']}>
                      <Image src="/icons/profile.svg" alt="" width={20} height={20} />
                      Профиль
                    </Link>
                    <div className={styles['header__dropdown-divider']} />
                    <button
                      className={`${styles['header__dropdown-item']} ${styles['header__dropdown-item--danger']}`}
                      onClick={logout}
                    >
                      <Image src="/icons/logout.svg" alt="" width={20} height={20} />
                      Выход
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login" className={styles['header__login-btn']}>
                Войти
              </Link>
            )
          )}
        </div>
      </div>

      {isMobileSearchOpen && createPortal(
        <div className={styles['header__mobile-search-overlay']}>
          <div className={styles['header__mobile-search']}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Поиск"
              className={styles['header__mobile-search-input']}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              className={styles['header__mobile-search-close']}
              onClick={() => { setIsMobileSearchOpen(false); handleClear(); }}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {isOpen && (
            <div className={styles['header__mobile-search-results']}>
              {renderSearchResults()}
            </div>
          )}
        </div>,
        document.body
      )}
    </header>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { getInitials } from '@/utils/getInitials';
import type { Movie } from '@/types/movie';
import styles from './Header.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Header() {
  const { user, loading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
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
      .then((data: Movie[]) => {
        setHasMore(data.length > 5);
        setResults(data.slice(0, 5));
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  const handleResultClick = () => {
    setIsOpen(false);
    setSearchQuery('');
    setResults([]);
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const formatYear = (date: string) => date?.slice(0, 4) || '';

  const formatGenres = (genres: string[]) =>
    genres?.slice(0, 2).join(', ') || '';

  return (
    <header className={styles['header']}>
      <div className={styles['header__wrap']}>
        <a href="/" className={styles['header__logo']}>
          <Image src="/images/logo.svg" alt="КиноКот" width={130} height={36} />
        </a>

        <nav className={styles['header__nav']}>
          <a href="/films" className={styles['header__link']}>Фильмы</a>
          <a href="/series" className={styles['header__link']}>Сериалы</a>
          <a href="/cartoons" className={styles['header__link']}>Мультфильмы</a>
        </nav>

        <div className={styles['header__actions']}>
          <div className={styles['header__search']} ref={searchRef}>
            {isLoading ? (
              <span className={styles['header__search-spinner']} />
            ) : (
              <svg className={styles['header__search-icon']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
                {results.length > 0 ? (
                  <>
                    {results.map((movie) => (
                      <Link
                        key={movie._id}
                        href={`/films/${movie._id}`}
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
                            <span className={styles['header__search-rating']}>
                              <Image src="/icons/rating-kk.svg" alt="КиноКот" width={16} height={16} />
                              —
                            </span>
                            <span className={styles['header__search-rating']}>
                              <Image src="/icons/rating-imdb.svg" alt="IMDB" width={16} height={16} />
                              {movie.voteAverage?.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {hasMore && (
                      <a href="#" className={styles['header__search-all']}>
                        Все результаты
                      </a>
                    )}
                  </>
                ) : (
                  <div className={styles['header__search-empty']}>
                    Ничего не найдено
                  </div>
                )}
              </div>
            )}
          </div>
          {!loading && (
            user ? (
              <div className={styles['header__user']}>
                <div className={styles['header__avatar']}>
                  {getInitials(user.name)}
                </div>
                <div className={styles['header__dropdown']}>
                  <div className={styles['header__dropdown-menu']}>
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
    </header>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { getMoviePath } from '@/utils/getMoviePath';
import type { Movie } from '@/types/movie';
import styles from './SearchBlock.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const moods = [
  { label: 'Посмеяться', genre: 'Комедия', icon: '😂' },
  { label: 'Поплакать', genre: 'Драма', icon: '😢' },
  { label: 'Пощекотать нервы', genre: 'Ужасы', icon: '😱' },
  { label: 'Подумать', genre: 'Документальный', icon: '🧠' },
  { label: 'Приключение', genre: 'Приключения', icon: '🗺️' },
  { label: 'Для всей семьи', genre: 'Семейный', icon: '👨‍👩‍👧‍👦' },
];

export default function SearchBlock() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 600);

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
        if (err.name !== 'AbortError') setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToSearch = useCallback(() => {
    if (query.trim().length >= 2) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
      setResults([]);
    }
  }, [query, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
    if (e.key === 'Enter') navigateToSearch();
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const formatYear = (date: string) => date?.slice(0, 4) || '';
  const formatGenres = (genres: string[]) => genres?.slice(0, 2).join(', ') || '';

  return (
    <section className={styles['search-block']}>
      <div className={styles['search-block__wrap']} ref={wrapRef}>
        <div className={styles['search-block__input-wrap']}>
          {isLoading ? (
            <span className={styles['search-block__spinner']} />
          ) : (
            <button
              type="button"
              className={styles['search-block__icon-btn']}
              onClick={navigateToSearch}
              aria-label="Поиск"
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <input
            type="text"
            placeholder="Найти фильм, сериал или мультфильм..."
            className={styles['search-block__input']}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => debouncedQuery.length >= 2 && setIsOpen(true)}
          />
          {query && (
            <button
              className={styles['search-block__clear']}
              onClick={handleClear}
              type="button"
            >
              <Image src="/icons/close.svg" alt="Очистить" width={16} height={16} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className={styles['search-block__dropdown']}>
            {results.length > 0 ? (
              <>
                {results.map((movie) => (
                  <Link
                    key={movie._id}
                    href={getMoviePath(movie._id)}
                    className={styles['search-block__result']}
                    onClick={handleResultClick}
                  >
                    <div className={styles['search-block__poster']}>
                      {movie.posterPath ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                          alt={movie.title}
                          width={40}
                          height={60}
                        />
                      ) : (
                        <div className={styles['search-block__poster-placeholder']} />
                      )}
                    </div>
                    <div className={styles['search-block__info']}>
                      <span className={styles['search-block__title']}>{movie.title}</span>
                      <span className={styles['search-block__meta']}>
                        {formatYear(movie.releaseDate)}
                        {movie.genres?.length > 0 && ` | ${formatGenres(movie.genres)}`}
                      </span>
                      <div className={styles['search-block__ratings']}>
                        {movie.kinoKotRating !== undefined && (
                          <span className={styles['search-block__rating']}>
                            <Image src="/icons/rating-kk.svg" alt="КиноКот" width={16} height={16} />
                            {movie.kinoKotRating.toFixed(1)}
                          </span>
                        )}
                        <span className={styles['search-block__rating']}>
                          <Image src="/icons/rating-tmdb.svg" alt="TMDB" width={16} height={16} style={{ borderRadius: '50%' }} />
                          {movie.voteAverage?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {hasMore && (
                  <Link
                    href={`/search?query=${encodeURIComponent(query)}`}
                    className={styles['search-block__all']}
                    onClick={handleResultClick}
                  >
                    Все результаты
                  </Link>
                )}
              </>
            ) : (
              <div className={styles['search-block__empty']}>Ничего не найдено</div>
            )}
          </div>
        )}
      </div>

      <div className={styles['search-block__moods']}>
        {moods.map((mood) => (
          <Link
            key={mood.genre}
            href={`/films?genre=${encodeURIComponent(mood.genre)}`}
            className={styles['search-block__mood']}
          >
            <span className={styles['search-block__mood-icon']}>{mood.icon}</span>
            {mood.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header/Header';
import MovieCard from '@/components/MovieCard/MovieCard';
import Pagination from '@/components/Pagination/Pagination';
import Footer from '@/components/Footer/Footer';
import type { Movie } from '@/types/movie';
import styles from './Search.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LIMIT = 12;

interface SearchResponse {
  movies: Movie[];
  total: number;
  page: number;
  totalPages: number;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchMovies = useCallback(async (q: string, page: number) => {
    if (q.length < 2) {
      setMovies([]);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/movies/search?query=${encodeURIComponent(q)}&page=${page}&limit=${LIMIT}`,
      );
      if (!res.ok) throw new Error();
      const data: SearchResponse = await res.json();
      setMovies(data.movies);
      setTotalPages(data.totalPages);
    } catch {
      setMovies([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    fetchMovies(query, currentPage);
  }, [query, currentPage, fetchMovies]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className={styles['search']}>
      <div className={styles['search__wrap']}>
        <h1 className={styles['search__title']}>
          {query
            ? `Результаты поиска «${query}»`
            : 'Введите запрос для поиска'}
        </h1>

        {loading ? (
          <div className={styles['search__grid']}>
            {Array.from({ length: LIMIT }).map((_, i) => (
              <MovieCard key={i} />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <div className={styles['search__grid']}>
              {movies.map((movie) => (
                <MovieCard
                  key={movie._id}
                  id={movie._id}
                  title={movie.title}
                  posterPath={movie.posterPath}
                  voteAverage={movie.voteAverage}
                  releaseDate={movie.releaseDate}
                />
              ))}
            </div>
            <div className={styles['search__pagination']}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        ) : query.length >= 2 ? (
          <p className={styles['search__empty']}>
            Ничего не найдено по запросу «{query}»
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={
          <section className={styles['search']}>
            <div className={styles['search__wrap']}>
              <div className={styles['search__grid']}>
                {Array.from({ length: LIMIT }).map((_, i) => (
                  <MovieCard key={i} />
                ))}
              </div>
            </div>
          </section>
        }>
          <SearchResults />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

'use client';

import Link from 'next/link';
import type { QuizResultType } from '@/data/quiz-results';
import type { Movie } from '@/types/movie';
import { getMoviePath } from '@/utils/getMoviePath';
import styles from './QuizResults.module.scss';

interface QuizResultsProps {
  resultType: QuizResultType;
  movies: Movie[];
  onRestart: () => void;
}

export default function QuizResults({ resultType, movies, onRestart }: QuizResultsProps) {
  return (
    <div className={styles['quiz-results']}>
      <h2 className={styles['quiz-results__title']}>{resultType.title}</h2>
      <p className={styles['quiz-results__description']}>{resultType.description}</p>
      <p className={styles['quiz-results__subtitle']}>Рекомендуемые фильмы</p>

      <div className={styles['quiz-results__movies']}>
        {movies.map((movie) => (
          <Link
            key={movie._id}
            href={getMoviePath(movie._id)}
            className={styles['quiz-results__movie']}
          >
            <span className={styles['quiz-results__movie-name']}>{movie.title}</span>
            <svg
              className={styles['quiz-results__movie-arrow']}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M7 17L17 7M17 7H7M17 7V17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ))}
      </div>

      <button
        className={styles['quiz-results__restart-btn']}
        onClick={onRestart}
        type="button"
      >
        Пройти тест ещё раз
      </button>

      <Link href="/" className={styles['quiz-results__home-link']}>
        Вернуться на Главную
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 17L17 7M17 7H7M17 7V17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
}

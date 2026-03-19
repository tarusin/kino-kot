'use client';

import { useRef } from 'react';
import MovieCard from '../MovieCard/MovieCard';
import styles from './MovieSlider.module.scss';
import type { Movie } from '@/types/movie';

interface MovieSliderProps {
  title: string;
  movies?: Movie[];
}

export default function MovieSlider({ title, movies }: MovieSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;

    const firstItem = track.querySelector<HTMLElement>(`.${styles['movie-slider__item']}`);
    const gap = 20;
    const scrollAmount = firstItem ? firstItem.offsetWidth + gap : 300;

    track.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className={styles['movie-slider']}>
      <div className={styles['movie-slider__wrap']}>
        <div className={styles['movie-slider__header']}>
          <h2 className={styles['movie-slider__title']}>{title}</h2>
          <div className={styles['movie-slider__controls']}>
            <button
              className={`${styles['movie-slider__arrow']} ${styles['movie-slider__arrow--left']}`}
              onClick={() => scroll('left')}
              aria-label="Назад"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className={`${styles['movie-slider__arrow']} ${styles['movie-slider__arrow--right']}`}
              onClick={() => scroll('right')}
              aria-label="Вперёд"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <a href="#" className={styles['movie-slider__more']}>
              Смотреть все
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
        <div className={styles['movie-slider__track']} ref={trackRef}>
          {movies
            ? movies.map((movie) => (
                <div key={movie._id} className={styles['movie-slider__item']}>
                  <MovieCard
                    title={movie.title}
                    posterPath={movie.posterPath}
                    voteAverage={movie.voteAverage}
                    releaseDate={movie.releaseDate}
                  />
                </div>
              ))
            : Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles['movie-slider__item']}>
                  <MovieCard />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

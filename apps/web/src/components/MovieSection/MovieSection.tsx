import MovieCard from '../MovieCard/MovieCard';
import styles from './MovieSection.module.scss';
import type { Movie } from '@/types/movie';

interface MovieSectionProps {
  title: string;
  movies?: Movie[];
}

export default function MovieSection({ title, movies }: MovieSectionProps) {
  return (
    <section className={styles['movies']}>
      <div className={styles['movies__wrap']}>
        <div className={styles['movies__head']}>
          <h2 className={styles['movies__title']}>{title}</h2>
        </div>
        <div className={styles['movies__grid']}>
          {movies
            ? movies.map((movie) => (
                <MovieCard
                  key={movie._id}
                  id={movie._id}
                  title={movie.title}
                  posterPath={movie.posterPath}
                  voteAverage={movie.voteAverage}
                  kinoKotRating={movie.kinoKotRating}
                  releaseDate={movie.releaseDate}
                  genre={movie.genres?.[0]}
                />
              ))
            : Array.from({ length: 5 }).map((_, i) => (
                <MovieCard key={i} />
              ))}
        </div>
      </div>
    </section>
  );
}

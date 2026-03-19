import MovieCard from '../MovieCard/MovieCard';
import styles from './MovieSection.module.scss';

interface MovieSectionProps {
  title: string;
}

export default function MovieSection({ title }: MovieSectionProps) {
  return (
    <section className={styles['movies']}>
      <div className={styles['movies__wrap']}>
        <div className={styles['movies__head']}>
          <h2 className={styles['movies__title']}>{title}</h2>
          <a href="#" className={styles['movies__more']}>
            Смотреть все
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
        <div className={styles['movies__grid']}>
          {Array.from({ length: 5 }).map((_, i) => (
            <MovieCard key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

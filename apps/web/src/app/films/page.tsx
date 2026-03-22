import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import MovieCard from '@/components/MovieCard/MovieCard';
import GenreDropdown from '@/components/GenreDropdown/GenreDropdown';
import FilmsPagination from './FilmsPagination';
import styles from './films.module.scss';
import type { Movie } from '@/types/movie';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const MOVIES_PER_PAGE = 10;

async function getGenres(): Promise<string[]> {
  try {
    const res = await fetch(`${ API_URL }/movies/genres`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  } catch {
    return [];
  }
}

async function getMovies(
  genre?: string,
  page = 1,
): Promise<{ movies: Movie[]; total: number; page: number; totalPages: number }> {
  try {
    const params = new URLSearchParams();
    if (genre) {
      params.set('genre', genre);
    }
    params.set('page', String(page));
    params.set('limit', String(MOVIES_PER_PAGE));

    const res = await fetch(`${ API_URL }/movies?${ params.toString() }`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return { movies: [], total: 0, page: 1, totalPages: 0 };
    }
    return res.json();
  } catch {
    return { movies: [], total: 0, page: 1, totalPages: 0 };
  }
}

async function getRatings(movieIds: string[]): Promise<Record<string, number>> {

  if (movieIds.length === 0) {
    return {};
  }
  try {
    const res = await fetch(`${ API_URL }/reviews/ratings?movieIds=${ movieIds.join(',') }`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return {};
    }
    return res.json();
  } catch {
    return {};
  }
}

export default async function FilmsPage({
                                          searchParams,
                                        }: {
  searchParams: Promise<{ genre?: string; page?: string }>;
}) {
  const { genre, page: pageParam } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) || 1 : 1;

  const [genres, data] = await Promise.all([getGenres(), getMovies(genre, currentPage)]);

  const ratings = await getRatings(data.movies.map((m) => m._id));
  const moviesWithRatings = data.movies.map((m) => ({
    ...m,
    kinoKotRating: ratings[m._id],
  }));

  return (
    <>
      <Header/>
      <main>
        <section className={ styles['films'] }>
          <div className={ styles['films__wrap'] }>
            <div className={ styles['films__head'] }>
              <h2 className={ styles['films__title'] }>Фильмы</h2>
            </div>
            <div className="films__filters">
              <GenreDropdown
                genres={ genres }
                selectedGenre={ genre || null }
              />
            </div>
            <div className={ styles['films__grid'] }>
              { moviesWithRatings.map((movie) => (
                <MovieCard
                  key={ movie._id }
                  id={ movie._id }
                  title={ movie.title }
                  posterPath={ movie.posterPath }
                  voteAverage={ movie.voteAverage }
                  kinoKotRating={ movie.kinoKotRating }
                  releaseDate={ movie.releaseDate }
                  genre={ movie.genres?.[0] }
                />
              )) }
            </div>
            <FilmsPagination
              currentPage={ currentPage }
              totalPages={ data.totalPages }
              genre={ genre }
            />
          </div>
        </section>
      </main>
      <Footer/>
    </>
  );
}

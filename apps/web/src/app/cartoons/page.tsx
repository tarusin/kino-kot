import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import MovieCard from '@/components/MovieCard/MovieCard';
import FilmOfTheWeek from '@/components/FilmOfTheWeek/FilmOfTheWeek';
import FilmsTabs from '@/components/FilmsTabs/FilmsTabs';
import FilmsFilters from '@/components/FilmsFilters/FilmsFilters';
import CartoonsPagination from './CartoonsPagination';
import styles from './cartoons.module.scss';
import type { Movie, FilmOfTheWeek as FilmOfTheWeekType } from '@/types/movie';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 20;

async function getGenres(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/movies/genres?mediaType=cartoon`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getYears(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/movies/years?mediaType=cartoon`, { cache: 'no-store' });
    if (!res.ok) return [];
    const years: number[] = await res.json();
    return years.map(String);
  } catch {
    return [];
  }
}

async function getCountries(): Promise<{ code: string; name: string }[]> {
  try {
    const res = await fetch(`${API_URL}/movies/countries?mediaType=cartoon`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getCartoons(
  genre?: string,
  year?: string,
  country?: string,
  page = 1,
  list?: string,
): Promise<{ movies: Movie[]; total: number; page: number; totalPages: number }> {
  try {
    const params = new URLSearchParams();
    params.set('mediaType', 'cartoon');
    if (list) params.set('list', list);
    if (genre) params.set('genre', genre);
    if (year) params.set('year', year);
    if (country) params.set('country', country);
    params.set('page', String(page));
    params.set('limit', String(ITEMS_PER_PAGE));

    const res = await fetch(`${API_URL}/movies?${params.toString()}`, {
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

async function getCartoonOfTheWeek(): Promise<FilmOfTheWeekType | null> {
  try {
    const res = await fetch(`${API_URL}/movies/film-of-the-week?mediaType=cartoon`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function getRatings(movieIds: string[]): Promise<Record<string, number>> {
  if (movieIds.length === 0) return {};
  try {
    const res = await fetch(`${API_URL}/reviews/ratings?movieIds=${movieIds.join(',')}`, {
      cache: 'no-store',
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export default async function CartoonsPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; year?: string; country?: string; page?: string; list?: string }>;
}) {
  const { genre, year, country, page: pageParam, list } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) || 1 : 1;
  const activeList = list || 'popular';

  const [genres, years, countriesData, data, cartoonOfTheWeek] = await Promise.all([
    getGenres(),
    getYears(),
    getCountries(),
    getCartoons(genre, year, country, currentPage, activeList),
    getCartoonOfTheWeek(),
  ]);

  const countries = countriesData.map((c) => c.code);
  const countryDisplayMap = Object.fromEntries(countriesData.map((c) => [c.code, c.name]));

  const ratings = await getRatings(data.movies.map((m) => m._id));
  const moviesWithRatings = data.movies.map((m) => ({
    ...m,
    kinoKotRating: ratings[m._id],
  }));

  return (
    <>
      <Header />
      <main>
        <section className={styles['cartoons']}>
          <div className={styles['cartoons__wrap']}>
            {cartoonOfTheWeek && (
              <FilmOfTheWeek
                film={cartoonOfTheWeek}
                badge="Мультфильм Недели"
                categoryLabel="Мультфильм"
                basePath="/cartoons"
              />
            )}
            <div className={styles['cartoons__head']}>
              <h2 className={styles['cartoons__title']}>Мультфильмы</h2>
            </div>
            <FilmsTabs activeTab={activeList} basePath="/cartoons" />
            <div className="cartoons__filters">
              <FilmsFilters
                genres={genres}
                years={years}
                countries={countries}
                countryDisplayMap={countryDisplayMap}
                appliedGenre={genre || null}
                appliedYear={year || null}
                appliedCountry={country || null}
                activeList={activeList}
                basePath="/cartoons"
              />
            </div>
            <div className={styles['cartoons__grid']}>
              {moviesWithRatings.map((movie) => (
                <MovieCard
                  key={movie._id}
                  id={movie._id}
                  title={movie.title}
                  posterPath={movie.posterPath}
                  voteAverage={movie.voteAverage}
                  kinoKotRating={movie.kinoKotRating}
                  releaseDate={movie.releaseDate}
                  genre={movie.genres?.[0]}
                  basePath="/cartoons"
                />
              ))}
            </div>
            <CartoonsPagination
              currentPage={currentPage}
              totalPages={data.totalPages}
              genre={genre}
              year={year}
              country={country}
              list={list}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

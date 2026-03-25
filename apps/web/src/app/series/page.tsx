import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import MovieCard from '@/components/MovieCard/MovieCard';
import FilmOfTheWeek from '@/components/FilmOfTheWeek/FilmOfTheWeek';
import FilmsTabs from '@/components/FilmsTabs/FilmsTabs';
import FilmsFilters from '@/components/FilmsFilters/FilmsFilters';
import SeriesPagination from './SeriesPagination';
import styles from './series.module.scss';
import type { Movie, FilmOfTheWeek as FilmOfTheWeekType } from '@/types/movie';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 20;

async function getGenres(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/movies/genres?mediaType=series`, {
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
    const res = await fetch(`${API_URL}/movies/years?mediaType=series`, { cache: 'no-store' });
    if (!res.ok) return [];
    const years: number[] = await res.json();
    return years.map(String);
  } catch {
    return [];
  }
}

async function getCountries(): Promise<{ code: string; name: string }[]> {
  try {
    const res = await fetch(`${API_URL}/movies/countries?mediaType=series`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getSeries(
  genre?: string,
  year?: string,
  country?: string,
  page = 1,
  list?: string,
): Promise<{ movies: Movie[]; total: number; page: number; totalPages: number }> {
  try {
    const params = new URLSearchParams();
    params.set('mediaType', 'series');
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

async function getSeriesOfTheWeek(): Promise<FilmOfTheWeekType | null> {
  try {
    const res = await fetch(`${API_URL}/movies/film-of-the-week?mediaType=series`, {
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

export default async function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; year?: string; country?: string; page?: string; list?: string }>;
}) {
  const { genre, year, country, page: pageParam, list } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) || 1 : 1;
  const activeList = list || 'popular';

  const [genres, years, countriesData, data, seriesOfTheWeek] = await Promise.all([
    getGenres(),
    getYears(),
    getCountries(),
    getSeries(genre, year, country, currentPage, activeList),
    getSeriesOfTheWeek(),
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
        <section className={styles['series']}>
          <div className={styles['series__wrap']}>
            {seriesOfTheWeek && (
              <FilmOfTheWeek
                film={seriesOfTheWeek}
                badge="Сериал Недели"
                categoryLabel="Сериал"
                basePath="/series"
              />
            )}
            <div className={styles['series__head']}>
              <h2 className={styles['series__title']}>Сериалы</h2>
            </div>
            <FilmsTabs activeTab={activeList} basePath="/series" />
            <div className="series__filters">
              <FilmsFilters
                genres={genres}
                years={years}
                countries={countries}
                countryDisplayMap={countryDisplayMap}
                appliedGenre={genre || null}
                appliedYear={year || null}
                appliedCountry={country || null}
                activeList={activeList}
                basePath="/series"
              />
            </div>
            <div className={styles['series__grid']}>
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
                  basePath="/series"
                />
              ))}
            </div>
            <SeriesPagination
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

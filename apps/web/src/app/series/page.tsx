import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import CatalogSeoBlock from '@/components/CatalogSeoBlock/CatalogSeoBlock';
import MovieCard from '@/components/MovieCard/MovieCard';
import FilmOfTheWeek from '@/components/FilmOfTheWeek/FilmOfTheWeek';
import FilmsTabs from '@/components/FilmsTabs/FilmsTabs';
import FilmsFilters from '@/components/FilmsFilters/FilmsFilters';
import type { Metadata } from 'next';
import { CATALOG_TABS, buildCatalogHref } from '@/lib/catalog';
import { buildBreadcrumbJsonLd, buildCollectionMetadata, buildItemListJsonLd } from '@/lib/seo';
import SeriesPagination from './SeriesPagination';
import styles from './series.module.scss';
import type { Movie, FilmOfTheWeek as FilmOfTheWeekType } from '@/types/movie';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 20;
type SeriesSearchParams = { genre?: string; year?: string; country?: string; page?: string; list?: string };

function getSeriesSeoContent(list: string) {
  if (list === 'top_rated') {
    return {
      title: 'Лучшие сериалы с отзывами и рейтингами',
      intro:
        'Раздел лучших сериалов помогает быстро выйти на проекты, которые зрители оценивают выше остальных и чаще рекомендуют к просмотру.',
      details:
        'Сравнивайте рейтинги, переходите в карточки сериалов, изучайте описание и отзывы, а затем добавляйте в планы на вечер или длинный марафон.',
    };
  }

  if (list === 'on_the_air') {
    return {
      title: 'Сериалы, которые сейчас выходят',
      intro:
        'На этой странице собраны сериалы, у которых продолжается выход новых эпизодов и сезонов, чтобы удобнее следить за актуальными релизами.',
      details:
        'Если хочется быть в курсе текущих премьер, откройте карточки сериалов, проверьте рейтинг и читайте отзывы пользователей, уже следящих за новыми сериями.',
    };
  }

  if (list === 'airing_today') {
    return {
      title: 'Сериалы, которые выходят сегодня',
      intro:
        'Подборка сегодняшних эфиров помогает быстро проверить, какие сериалы получили новые эпизоды именно сегодня.',
      details:
        'Это удобный вход для зрителей, которые следят за онгоингами, хотят не пропускать релизы и сравнивать свежие отзывы сразу после выхода серии.',
    };
  }

  return {
    title: 'Отзывы на сериалы и подборки для просмотра',
    intro:
      'В каталоге сериалов КиноКота собраны популярные проекты, рейтинги и отзывы, которые помогают выбрать следующий сериал без долгого скролла.',
    details:
      'Здесь можно перейти к лучшим сериалам, актуальным онгоингам и сегодняшним эпизодам, а затем открыть подробную карточку с сезонами, описанием и оценками.',
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SeriesSearchParams>;
}): Promise<Metadata> {
  const { genre, year, country, page, list } = await searchParams;
  const currentPage = page ? parseInt(page, 10) || 1 : 1;

  return buildCollectionMetadata({
    sectionName: 'Сериалы',
    sectionLabel: 'сериалы',
    path: '/series',
    genre,
    year,
    country,
    page: currentPage,
    list,
  });
}

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
  searchParams: Promise<SeriesSearchParams>;
}) {
  const { genre, year, country, page: pageParam, list } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) || 1 : 1;
  const activeList = list || 'popular';
  const hasFilters = Boolean(genre || year || country);
  const shouldRenderSeoBlock = !hasFilters && currentPage === 1;

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
  const seoContent = getSeriesSeoContent(activeList);
  const tabLinks = CATALOG_TABS['/series'].map((tab) => ({
    href: buildCatalogHref('/series', tab.key),
    label: tab.label,
  }));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'Сериалы', path: buildCatalogHref('/series', activeList) },
  ]);
  const itemListJsonLd =
    shouldRenderSeoBlock && data.movies.length > 0
      ? buildItemListJsonLd(
          data.movies.map((movie) => ({ id: movie._id, name: movie.title })),
          '/series',
        )
      : null;

  return (
    <>
      <Header />
      <main>
        <section className={styles['series']}>
          <div className={styles['series__wrap']}>
            {shouldRenderSeoBlock && (
              <>
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
                />
                {itemListJsonLd && (
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
                  />
                )}
              </>
            )}
            {seriesOfTheWeek && (
              <FilmOfTheWeek
                film={seriesOfTheWeek}
                badge="Сериал Недели"
                categoryLabel="Сериал"
                basePath="/series"
              />
            )}
            <div className={styles['series__head']}>
              <h1 className={styles['series__title']}>Сериалы</h1>
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
            {shouldRenderSeoBlock && (
              <CatalogSeoBlock
                sectionName="Сериалы"
                title={seoContent.title}
                intro={seoContent.intro}
                details={seoContent.details}
                tabLinks={tabLinks}
                relatedLinks={[
                  {
                    href: '/films',
                    label: 'Фильмы',
                    description: 'Подборки фильмов с рейтингами, отзывами и премьерами в кино.',
                  },
                  {
                    href: '/cartoons',
                    label: 'Мультфильмы',
                    description: 'Анимация для детей и взрослых с отзывами и оценками зрителей.',
                  },
                  {
                    href: '/quiz',
                    label: 'Квиз',
                    description: 'Быстрый способ подобрать, что посмотреть, по вашему настроению.',
                  },
                ]}
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

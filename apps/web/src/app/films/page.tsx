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
import FilmsPagination from './FilmsPagination';
import styles from './films.module.scss';
import type { Movie, FilmOfTheWeek as FilmOfTheWeekType } from '@/types/movie';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const MOVIES_PER_PAGE = 20;
type FilmsSearchParams = { genre?: string; year?: string; country?: string; page?: string; list?: string };

function getFilmsSeoContent(list: string) {
  if (list === 'top_rated') {
    return {
      title: 'Лучшие фильмы с отзывами и рейтингами',
      intro:
        'Здесь собраны лучшие фильмы по рейтингам и отзывам, чтобы можно было быстрее найти сильное кино без долгих поисков.',
      details:
        'Сравнивайте пользовательские оценки КиноКота и рейтинг TMDB, переходите в карточки фильмов и выбирайте, что посмотреть сегодня вечером или сохранить в список на потом.',
    };
  }

  if (list === 'now_playing') {
    return {
      title: 'Фильмы, которые сейчас идут в кино',
      intro:
        'Раздел помогает быстро посмотреть актуальные фильмы в прокате, сравнить ожидания и мнения зрителей перед походом в кинотеатр.',
      details:
        'Если нужен выбор между новинками, откройте карточки фильмов, изучите описание, рейтинг и отзывы, а затем переходите к лучшим или популярным подборкам для сравнения.',
    };
  }

  if (list === 'upcoming') {
    return {
      title: 'Ожидаемые премьеры и скоро выходящие фильмы',
      intro:
        'В этой подборке собраны фильмы, которые скоро выйдут и уже вызывают интерес у зрителей, следящих за новыми релизами.',
      details:
        'Используйте страницу, чтобы заранее отметить ожидаемые премьеры, следить за обновлениями и переходить в карточки фильмов, когда появятся отзывы и первые оценки.',
    };
  }

  return {
    title: 'Отзывы на фильмы и подборки для выбора',
    intro:
      'На странице фильмов КиноКота собраны популярные релизы, пользовательские отзывы и рейтинги, которые помогают быстрее выбрать кино под настроение.',
    details:
      'Здесь можно перейти к лучшим фильмам, текущим релизам в кино и ожидаемым премьерам, а затем открыть подробную карточку фильма с описанием, актёрами и оценками.',
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<FilmsSearchParams>;
}): Promise<Metadata> {
  const { genre, year, country, page, list } = await searchParams;
  const currentPage = page ? parseInt(page, 10) || 1 : 1;

  return buildCollectionMetadata({
    sectionName: 'Фильмы',
    sectionLabel: 'фильмы',
    path: '/films',
    genre,
    year,
    country,
    page: currentPage,
    list,
  });
}

async function getGenres(): Promise<string[]> {
  try {
    const res = await fetch(`${ API_URL }/movies/genres?mediaType=movie`, {
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

async function getYears(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/movies/years?mediaType=movie`, { cache: 'no-store' });
    if (!res.ok) return [];
    const years: number[] = await res.json();
    return years.map(String);
  } catch {
    return [];
  }
}

async function getCountries(): Promise<{ code: string; name: string }[]> {
  try {
    const res = await fetch(`${API_URL}/movies/countries?mediaType=movie`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getMovies(
  genre?: string,
  year?: string,
  country?: string,
  page = 1,
  list?: string,
): Promise<{ movies: Movie[]; total: number; page: number; totalPages: number }> {
  try {
    const params = new URLSearchParams();
    params.set('mediaType', 'movie');
    if (list) params.set('list', list);
    if (genre) params.set('genre', genre);
    if (year) params.set('year', year);
    if (country) params.set('country', country);
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

async function getFilmOfTheWeek(): Promise<FilmOfTheWeekType | null> {
  try {
    const res = await fetch(`${API_URL}/movies/film-of-the-week?mediaType=movie`, {
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
  searchParams: Promise<FilmsSearchParams>;
}) {
  const { genre, year, country, page: pageParam, list } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) || 1 : 1;
  const activeList = list || 'popular';
  const hasFilters = Boolean(genre || year || country);
  const shouldRenderSeoBlock = !hasFilters && currentPage === 1;

  const [genres, years, countriesData, data, filmOfTheWeek] = await Promise.all([
    getGenres(),
    getYears(),
    getCountries(),
    getMovies(genre, year, country, currentPage, activeList),
    getFilmOfTheWeek(),
  ]);

  const countries = countriesData.map((c) => c.code);
  const countryDisplayMap = Object.fromEntries(countriesData.map((c) => [c.code, c.name]));

  const ratings = await getRatings(data.movies.map((m) => m._id));
  const moviesWithRatings = data.movies.map((m) => ({
    ...m,
    kinoKotRating: ratings[m._id],
  }));
  const seoContent = getFilmsSeoContent(activeList);
  const tabLinks = CATALOG_TABS['/films'].map((tab) => ({
    href: buildCatalogHref('/films', tab.key),
    label: tab.label,
  }));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'Фильмы', path: buildCatalogHref('/films', activeList) },
  ]);
  const itemListJsonLd =
    shouldRenderSeoBlock && data.movies.length > 0
      ? buildItemListJsonLd(
          data.movies.map((movie) => ({ id: movie._id, name: movie.title })),
          '/films',
        )
      : null;

  return (
    <>
      <Header/>
      <main>
        <section className={ styles['films'] }>
          <div className={ styles['films__wrap'] }>
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
            {filmOfTheWeek && <FilmOfTheWeek film={filmOfTheWeek} />}
            <div className={ styles['films__head'] }>
              <h1 className={ styles['films__title'] }>Фильмы</h1>
            </div>
            <FilmsTabs activeTab={activeList} />
            <div className="films__filters">
              <FilmsFilters
                genres={genres}
                years={years}
                countries={countries}
                countryDisplayMap={countryDisplayMap}
                appliedGenre={genre || null}
                appliedYear={year || null}
                appliedCountry={country || null}
                activeList={activeList}
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
              year={ year }
              country={ country }
              list={ list }
            />
            {shouldRenderSeoBlock && (
              <CatalogSeoBlock
                sectionName="Фильмы"
                title={seoContent.title}
                intro={seoContent.intro}
                details={seoContent.details}
                tabLinks={tabLinks}
                relatedLinks={[
                  {
                    href: '/series',
                    label: 'Сериалы',
                    description: 'Подборки сериалов с отзывами, рейтингами и новыми эпизодами.',
                  },
                  {
                    href: '/cartoons',
                    label: 'Мультфильмы',
                    description: 'Каталог мультфильмов для семейного просмотра и анимационных премьер.',
                  },
                  {
                    href: '/quiz',
                    label: 'Квиз',
                    description: 'Подберите фильм или сериал под настроение с помощью короткого теста.',
                  },
                ]}
              />
            )}
          </div>
        </section>
      </main>
      <Footer/>
    </>
  );
}

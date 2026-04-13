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
import CartoonsPagination from './CartoonsPagination';
import styles from './cartoons.module.scss';
import type { Movie, FilmOfTheWeek as FilmOfTheWeekType } from '@/types/movie';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 20;
type CartoonsSearchParams = { genre?: string; year?: string; country?: string; page?: string; list?: string };

function getCartoonsSeoContent(list: string) {
  if (list === 'top_rated') {
    return {
      title: 'Лучшие мультфильмы с отзывами и рейтингами',
      intro:
        'Раздел лучших мультфильмов помогает быстро найти сильные анимационные проекты для семейного просмотра, выходных или вечернего расслабления.',
      details:
        'Сравнивайте оценки, открывайте карточки мультфильмов и выбирайте между признанной классикой, свежими хитами и картинами, которые советуют другие зрители.',
    };
  }

  if (list === 'now_playing') {
    return {
      title: 'Мультфильмы, которые сейчас идут в кино',
      intro:
        'Здесь собраны актуальные анимационные релизы из проката, чтобы проще было выбрать мультфильм для похода в кинотеатр.',
      details:
        'Используйте страницу, чтобы быстро проверить, какие мультфильмы сейчас доступны, сравнить рейтинги и перейти к подробным карточкам с отзывами и описанием.',
    };
  }

  if (list === 'upcoming') {
    return {
      title: 'Скоро выходящие мультфильмы и анимационные премьеры',
      intro:
        'Подборка ожидаемых мультфильмов помогает следить за будущими анимационными релизами и заранее выбирать интересные премьеры.',
      details:
        'Это удобный раздел для родителей, семейных зрителей и поклонников анимации, которые хотят не пропускать новые релизы и быстро переходить к карточкам проектов.',
    };
  }

  return {
    title: 'Отзывы на мультфильмы и семейные подборки',
    intro:
      'На странице мультфильмов КиноКота собраны популярные анимационные релизы, рейтинги и отзывы, которые помогают подобрать просмотр для детей и взрослых.',
    details:
      'Здесь можно перейти к лучшим мультфильмам, текущим релизам в кино и ожидаемым премьерам, а затем открыть карточку с описанием, жанрами и оценками.',
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CartoonsSearchParams>;
}): Promise<Metadata> {
  const { genre, year, country, page, list } = await searchParams;
  const currentPage = page ? parseInt(page, 10) || 1 : 1;

  return buildCollectionMetadata({
    sectionName: 'Мультфильмы',
    sectionLabel: 'мультфильмы',
    path: '/cartoons',
    genre,
    year,
    country,
    page: currentPage,
    list,
  });
}

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
  searchParams: Promise<CartoonsSearchParams>;
}) {
  const { genre, year, country, page: pageParam, list } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) || 1 : 1;
  const activeList = list || 'popular';
  const hasFilters = Boolean(genre || year || country);
  const shouldRenderSeoBlock = !hasFilters && currentPage === 1;

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
  const seoContent = getCartoonsSeoContent(activeList);
  const tabLinks = CATALOG_TABS['/cartoons'].map((tab) => ({
    href: buildCatalogHref('/cartoons', tab.key),
    label: tab.label,
  }));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'Мультфильмы', path: buildCatalogHref('/cartoons', activeList) },
  ]);
  const itemListJsonLd =
    shouldRenderSeoBlock && data.movies.length > 0
      ? buildItemListJsonLd(
          data.movies.map((movie) => ({ id: movie._id, name: movie.title })),
          '/cartoons',
        )
      : null;

  return (
    <>
      <Header />
      <main>
        <section className={styles['cartoons']}>
          <div className={styles['cartoons__wrap']}>
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
            {cartoonOfTheWeek && (
              <FilmOfTheWeek
                film={cartoonOfTheWeek}
                badge="Мультфильм Недели"
                categoryLabel="Мультфильм"
                basePath="/cartoons"
              />
            )}
            <div className={styles['cartoons__head']}>
              <h1 className={styles['cartoons__title']}>Мультфильмы</h1>
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
            {shouldRenderSeoBlock && (
              <CatalogSeoBlock
                sectionName="Мультфильмы"
                title={seoContent.title}
                intro={seoContent.intro}
                details={seoContent.details}
                tabLinks={tabLinks}
                relatedLinks={[
                  {
                    href: '/films',
                    label: 'Фильмы',
                    description: 'Полнометражное кино с рейтингами, обзорами и подборками по настроению.',
                  },
                  {
                    href: '/series',
                    label: 'Сериалы',
                    description: 'Каталог сериалов с отзывами зрителей и актуальными релизами.',
                  },
                  {
                    href: '/quiz',
                    label: 'Квиз',
                    description: 'Подберите мультфильм, фильм или сериал с помощью короткого теста.',
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

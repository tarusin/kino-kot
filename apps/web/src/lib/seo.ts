import type { Metadata } from 'next';
import { COLLECTION_LIST_META } from '@/lib/catalog';
import type { MovieDetail } from '@/types/movie';

export const SITE_NAME = 'КиноКот';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kino-kot.com';
export const DEFAULT_OG_IMAGE = '/images/main-banner.webp';
export const DEFAULT_DESCRIPTION =
  'Читайте и пишите честные отзывы на фильмы, сериалы и мультфильмы. Сравнивайте рейтинги, находите что посмотреть и открывайте кино вместе с КиноКотом.';

type MetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
  keywords?: string[];
};

type CollectionMetadataOptions = {
  sectionName: string;
  sectionLabel: string;
  path: string;
  genre?: string;
  year?: string;
  country?: string;
  page?: number;
  list?: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const INDEX_ROBOTS: NonNullable<Metadata['robots']> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
};

const NO_INDEX_ROBOTS: NonNullable<Metadata['robots']> = {
  index: false,
  follow: true,
  googleBot: {
    index: false,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
};

export function absoluteUrl(path = '/') {
  if (!path || path === '/') {
    return SITE_URL;
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return new URL(path, SITE_URL).toString();
}

export function getPageTitle(title?: string) {
  if (!title) {
    return `${SITE_NAME} | отзывы на фильмы, сериалы и мультфильмы`;
  }

  if (title.includes(SITE_NAME)) {
    return title;
  }

  return `${title} | ${SITE_NAME}`;
}

export function cleanText(value?: string) {
  return value?.replace(/\s+/g, ' ').trim() || '';
}

export function truncateText(value?: string, maxLength = 160, fallback = DEFAULT_DESCRIPTION) {
  const normalized = cleanText(value) || fallback;

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const trimmed = normalized.slice(0, maxLength - 1);
  const lastSpaceIndex = trimmed.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.6) {
    return `${trimmed.slice(0, lastSpaceIndex)}…`;
  }

  return `${trimmed}…`;
}

export function createMetadata({
  title,
  description,
  path = '/',
  noIndex = false,
  image = DEFAULT_OG_IMAGE,
  keywords,
}: MetadataOptions): Metadata {
  const finalTitle = getPageTitle(title);
  const finalDescription = truncateText(description);
  const finalUrl = absoluteUrl(path);
  const finalImage = absoluteUrl(image);

  return {
    title: finalTitle,
    description: finalDescription,
    keywords,
    alternates: {
      canonical: finalUrl,
    },
    robots: noIndex ? NO_INDEX_ROBOTS : INDEX_ROBOTS,
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: SITE_NAME,
      url: finalUrl,
      title: finalTitle,
      description: finalDescription,
      images: [
        {
          url: finalImage,
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      images: [finalImage],
    },
  };
}

export function createNoIndexMetadata(options: Omit<MetadataOptions, 'noIndex'>) {
  return createMetadata({ ...options, noIndex: true });
}

export function getMediaTypeLabel(mediaType?: string) {
  if (mediaType === 'series') return 'сериал';
  if (mediaType === 'cartoon') return 'мультфильм';
  return 'фильм';
}

export function getMediaBasePath(mediaType?: string) {
  if (mediaType === 'series') return '/series';
  if (mediaType === 'cartoon') return '/cartoons';
  return '/films';
}

export function getMediaTypeSchema(mediaType?: string) {
  return mediaType === 'series' ? 'TVSeries' : 'Movie';
}

function getIndexableCollectionPath(path: string, list?: string) {
  if (!list || list === 'popular') {
    return path;
  }

  const params = new URLSearchParams({ list });
  return `${path}?${params.toString()}`;
}

export function buildCollectionMetadata({
  sectionName,
  sectionLabel,
  path,
  genre,
  year,
  country,
  page = 1,
  list = 'popular',
}: CollectionMetadataOptions): Metadata {
  const filters = [
    genre ? `жанр ${genre}` : null,
    year ? `год ${year}` : null,
    country ? `страна ${country}` : null,
  ].filter(Boolean) as string[];

  const listMeta = COLLECTION_LIST_META[list] || COLLECTION_LIST_META.popular;
  const hasFilters = filters.length > 0;
  const isPaginated = page > 1;
  const noIndex = hasFilters || isPaginated;
  const canonicalPath = getIndexableCollectionPath(path, list);

  const titleParts = [listMeta.title, sectionName];
  if (filters.length > 0) {
    titleParts.push(filters.join(', '));
  }
  if (isPaginated) {
    titleParts.push(`страница ${page}`);
  }

  const descriptionParts = [
    `${capitalize(listMeta.description)} ${sectionLabel} на КиноКоте.`,
    hasFilters ? `Подборка с фильтрами: ${filters.join(', ')}.` : 'Читайте отзывы, сравнивайте рейтинги и находите, что посмотреть.',
    isPaginated ? `Страница ${page}.` : null,
  ].filter(Boolean);

  return createMetadata({
    title: titleParts.join(' — '),
    description: descriptionParts.join(' '),
    path: canonicalPath,
    noIndex,
    keywords: [
      sectionName,
      `${sectionLabel} отзывы`,
      `${sectionLabel} рейтинг`,
      genre,
      year,
      country,
    ].filter(Boolean) as string[],
  });
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/images/logo.svg'),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildMovieJsonLd(
  movie: MovieDetail,
  path: string,
  ratingValue?: number,
  reviewCount?: number,
) {
  const directors = movie.crew
    .filter((person) => person.job === 'Director')
    .slice(0, 3)
    .map((person) => ({
      '@type': 'Person',
      name: person.name,
    }));

  const imageUrls = [movie.posterPath, movie.backdropPath]
    .filter(Boolean)
    .map((imagePath) => `https://image.tmdb.org/t/p/original${imagePath}`);

  return {
    '@context': 'https://schema.org',
    '@type': getMediaTypeSchema(movie.mediaType),
    name: movie.title,
    description: truncateText(
      movie.overview,
      220,
      `Читайте отзывы и рейтинги на ${getMediaTypeLabel(movie.mediaType)} «${movie.title}» на КиноКоте.`,
    ),
    url: absoluteUrl(path),
    image: imageUrls,
    genre: movie.genres.map((genre) => genre.name),
    datePublished: movie.releaseDate || undefined,
    duration: movie.runtime ? toIsoDuration(movie.runtime) : undefined,
    actor: movie.cast.slice(0, 10).map((person) => ({
      '@type': 'Person',
      name: person.name,
    })),
    director: directors.length > 0 ? directors : undefined,
    trailer: movie.trailerKey
      ? {
          '@type': 'VideoObject',
          name: `${movie.title} — трейлер`,
          embedUrl: `https://www.youtube.com/embed/${movie.trailerKey}`,
          url: `https://www.youtube.com/watch?v=${movie.trailerKey}`,
        }
      : undefined,
    aggregateRating:
      ratingValue && reviewCount
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(ratingValue.toFixed(1)),
            reviewCount,
            bestRating: 10,
            worstRating: 1,
          }
        : undefined,
  };
}

export function buildItemListJsonLd(
  items: Array<{ id: string; name: string }>,
  basePath: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`${basePath}/${item.id}`),
      name: item.name,
    })),
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toIsoDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) {
    return `PT${remainingMinutes}M`;
  }

  if (!remainingMinutes) {
    return `PT${hours}H`;
  }

  return `PT${hours}H${remainingMinutes}M`;
}

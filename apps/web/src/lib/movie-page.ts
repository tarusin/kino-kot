import { cache } from 'react';
import type { Metadata } from 'next';
import type { MovieDetail } from '@/types/movie';
import {
  DEFAULT_OG_IMAGE,
  buildBreadcrumbJsonLd,
  buildMovieJsonLd,
  createMetadata,
  getMediaBasePath,
  getMediaTypeLabel,
  truncateText,
} from '@/lib/seo';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

type ReviewSummary = {
  reviewCount: number;
  ratingValue?: number;
};

type BreadcrumbLabel = 'Фильмы' | 'Сериалы' | 'Мультфильмы';

export const getMovieDetail = cache(async (id: string): Promise<MovieDetail | null> => {
  try {
    const res = await fetch(`${API_URL}/movies/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch {
    return null;
  }
});

export const getMovieReviewSummary = cache(async (id: string): Promise<ReviewSummary> => {
  try {
    const res = await fetch(`${API_URL}/reviews/movie/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return { reviewCount: 0 };
    }

    const reviews: Array<{ rating?: number }> = await res.json();
    const validRatings = reviews
      .map((review) => review.rating)
      .filter((rating): rating is number => typeof rating === 'number');

    if (validRatings.length === 0) {
      return { reviewCount: 0 };
    }

    const averageRating =
      validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;

    return {
      reviewCount: validRatings.length,
      ratingValue: Math.round(averageRating * 10) / 10,
    };
  } catch {
    return { reviewCount: 0 };
  }
});

export function buildMovieMetadata(
  movie: MovieDetail | null,
  missingTitle: string,
  missingDescription: string,
): Metadata {
  if (!movie) {
    return createMetadata({
      title: missingTitle,
      description: missingDescription,
      path: '/',
      noIndex: true,
    });
  }

  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : undefined;
  const mediaLabel = getMediaTypeLabel(movie.mediaType);
  const path = `${getMediaBasePath(movie.mediaType)}/${movie._id}`;
  const image = movie.backdropPath
    ? `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
    : movie.posterPath
      ? `https://image.tmdb.org/t/p/w780${movie.posterPath}`
      : DEFAULT_OG_IMAGE;

  const fallbackDescription = `Читайте отзывы, рейтинг и описание на ${mediaLabel} «${movie.title}» на КиноКоте.`;

  return createMetadata({
    title: `${capitalize(mediaLabel)} ${movie.title}${year ? ` (${year})` : ''} — отзывы и рейтинг`,
    description: truncateText(movie.overview, 160, fallbackDescription),
    path,
    image,
    keywords: [
      movie.title,
      `${movie.title} отзывы`,
      `${movie.title} рейтинг`,
      `${mediaLabel} отзывы`,
      ...movie.genres.map((genre) => genre.name),
    ],
  });
}

export function buildMovieStructuredData(
  movie: MovieDetail,
  reviewSummary: ReviewSummary,
  sectionLabel: BreadcrumbLabel,
) {
  const path = `${getMediaBasePath(movie.mediaType)}/${movie._id}`;

  return [
    buildMovieJsonLd(movie, path, reviewSummary.ratingValue, reviewSummary.reviewCount),
    buildBreadcrumbJsonLd([
      { name: 'Главная', path: '/' },
      { name: sectionLabel, path: getMediaBasePath(movie.mediaType) },
      { name: movie.title, path },
    ]),
  ];
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

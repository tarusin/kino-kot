import type { MetadataRoute } from 'next';
import { SITE_URL, absoluteUrl, getMediaBasePath } from '@/lib/seo';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    url: absoluteUrl('/films'),
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: absoluteUrl('/series'),
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: absoluteUrl('/cartoons'),
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: absoluteUrl('/quiz'),
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.75,
  },
  {
    url: absoluteUrl('/about'),
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: absoluteUrl('/support'),
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: absoluteUrl('/privacy'),
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: absoluteUrl('/terms'),
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
];

type SitemapMovie = {
  _id: string;
  releaseDate?: string;
};

function getLastModified(date?: string) {
  if (!date) {
    return new Date();
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

async function getMovieEntries(mediaType: 'movie' | 'series' | 'cartoon') {
  const endpoints = [
    `${API_URL}/movies/popular?mediaType=${mediaType}`,
    `${API_URL}/movies/top-rated?mediaType=${mediaType}`,
  ];

  try {
    const responses = await Promise.all(
      endpoints.map((endpoint) =>
        fetch(endpoint, {
          next: { revalidate: 86400 },
        })
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => []),
      ),
    );

    const uniqueMovies = new Map<string, SitemapMovie>();

    for (const response of responses) {
      for (const movie of response as SitemapMovie[]) {
        if (movie?._id && !uniqueMovies.has(movie._id)) {
          uniqueMovies.set(movie._id, movie);
        }
      }
    }

    return Array.from(uniqueMovies.values()).map((movie) => ({
      url: absoluteUrl(`${getMediaBasePath(mediaType)}/${movie._id}`),
      lastModified: getLastModified(movie.releaseDate),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicEntries = await Promise.all([
    getMovieEntries('movie'),
    getMovieEntries('series'),
    getMovieEntries('cartoon'),
  ]);

  return [...STATIC_ROUTES, ...dynamicEntries.flat()];
}

import { notFound } from 'next/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import MovieDetailContent from '@/components/MovieDetailContent/MovieDetailContent';
import type { MovieDetail } from '@/types/movie';
import type { Metadata } from 'next';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function getMovie(id: string): Promise<MovieDetail | null> {
  try {
    const res = await fetch(`${API_URL}/movies/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovie(id);
  if (!movie) return { title: 'Фильм не найден' };

  const ogImage = movie.backdropPath
    ? `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
    : movie.posterPath
      ? `https://image.tmdb.org/t/p/w780${movie.posterPath}`
      : undefined;

  return {
    title: `${movie.title} — КиноКот`,
    description: movie.overview?.slice(0, 160),
    openGraph: {
      title: `${movie.title} — КиноКот`,
      description: movie.overview?.slice(0, 160),
      ...(ogImage && { images: [{ url: ogImage, width: 1280, height: 720 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${movie.title} — КиноКот`,
      description: movie.overview?.slice(0, 160),
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;
  const movie = await getMovie(id);

  if (!movie) {
    notFound();
  }

  return (
    <>
      <Header />
      <main>
        <MovieDetailContent movie={movie} />
      </main>
      <Footer />
    </>
  );
}

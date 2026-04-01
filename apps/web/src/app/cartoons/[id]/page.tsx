import { notFound } from 'next/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import MovieDetailContent from '@/components/MovieDetailContent/MovieDetailContent';
import type { MovieDetail } from '@/types/movie';
import type { Metadata } from 'next';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function getCartoon(id: string): Promise<MovieDetail | null> {
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
  const cartoon = await getCartoon(id);
  if (!cartoon) return { title: 'Мультфильм не найден' };

  const ogImage = cartoon.backdropPath
    ? `https://image.tmdb.org/t/p/w1280${cartoon.backdropPath}`
    : cartoon.posterPath
      ? `https://image.tmdb.org/t/p/w780${cartoon.posterPath}`
      : undefined;

  return {
    title: `${cartoon.title} — КиноКот`,
    description: cartoon.overview?.slice(0, 160),
    openGraph: {
      title: `${cartoon.title} — КиноКот`,
      description: cartoon.overview?.slice(0, 160),
      ...(ogImage && { images: [{ url: ogImage, width: 1280, height: 720 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cartoon.title} — КиноКот`,
      description: cartoon.overview?.slice(0, 160),
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function CartoonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cartoon = await getCartoon(id);

  if (!cartoon) {
    notFound();
  }

  return (
    <>
      <Header />
      <main>
        <MovieDetailContent movie={cartoon} />
      </main>
      <Footer />
    </>
  );
}

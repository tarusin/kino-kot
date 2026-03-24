import { notFound } from 'next/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import MovieDetailContent from '@/components/MovieDetailContent/MovieDetailContent';
import type { MovieDetail } from '@/types/movie';
import type { Metadata } from 'next';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function getSeries(id: string): Promise<MovieDetail | null> {
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
  const series = await getSeries(id);
  if (!series) return { title: 'Сериал не найден' };

  return {
    title: `${series.title} — КиноКот`,
    description: series.overview?.slice(0, 160),
  };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { id } = await params;
  const series = await getSeries(id);

  if (!series) {
    notFound();
  }

  return (
    <>
      <Header />
      <main>
        <MovieDetailContent movie={series} />
      </main>
      <Footer />
    </>
  );
}

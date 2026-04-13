import { notFound } from 'next/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import MovieDetailContent from '@/components/MovieDetailContent/MovieDetailContent';
import type { Metadata } from 'next';
import {
  buildMovieMetadata,
  buildMovieStructuredData,
  getMovieDetail,
  getMovieReviewSummary,
} from '@/lib/movie-page';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieDetail(id);
  return buildMovieMetadata(movie, 'Фильм не найден', 'Страница фильма не найдена.');
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;
  const [movie, reviewSummary] = await Promise.all([
    getMovieDetail(id),
    getMovieReviewSummary(id),
  ]);

  if (!movie) {
    notFound();
  }

  const jsonLd = buildMovieStructuredData(movie, reviewSummary, 'Фильмы');

  return (
    <>
      <Header />
      <main>
        {jsonLd.map((item, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          />
        ))}
        <MovieDetailContent movie={movie} />
      </main>
      <Footer />
    </>
  );
}

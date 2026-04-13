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
  const cartoon = await getMovieDetail(id);
  return buildMovieMetadata(cartoon, 'Мультфильм не найден', 'Страница мультфильма не найдена.');
}

export default async function CartoonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [cartoon, reviewSummary] = await Promise.all([
    getMovieDetail(id),
    getMovieReviewSummary(id),
  ]);

  if (!cartoon) {
    notFound();
  }

  const jsonLd = buildMovieStructuredData(cartoon, reviewSummary, 'Мультфильмы');

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
        <MovieDetailContent movie={cartoon} />
      </main>
      <Footer />
    </>
  );
}

import Header from '@/components/Header/Header';
import HeroBanner from '@/components/HeroBanner/HeroBanner';
import WhyKinoKot from '@/components/WhyKinoKot/WhyKinoKot';
import ReviewsMarquee from '@/components/ReviewsMarquee/ReviewsMarquee';
import MovieSlider from '@/components/MovieSlider/MovieSlider';
import QuizBanner from '@/components/QuizBanner/QuizBanner';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.scss';
import type { Movie } from '@/types/movie';
import type { LatestReview } from '@/types/review';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function getPopularMovies(): Promise<Movie[]> {
  try {
    const res = await fetch(`${API_URL}/movies/popular`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getTopRatedMovies(): Promise<Movie[]> {
  try {
    const res = await fetch(`${API_URL}/movies/top-rated`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getPublicStats(): Promise<{ totalReviews: number; totalAuthors: number }> {
  try {
    const res = await fetch(`${API_URL}/reviews/stats`, { next: { revalidate: 3600 } });
    if (!res.ok) return { totalReviews: 0, totalAuthors: 0 };
    return res.json();
  } catch {
    return { totalReviews: 0, totalAuthors: 0 };
  }
}

async function getLatestReviews(): Promise<LatestReview[]> {
  try {
    const res = await fetch(`${API_URL}/reviews/latest?limit=20`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getRatings(movieIds: string[]): Promise<Record<string, number>> {
  if (movieIds.length === 0) return {};
  try {
    const res = await fetch(`${API_URL}/reviews/ratings?movieIds=${movieIds.join(',')}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

function mergeRatings(movies: Movie[], ratings: Record<string, number>): Movie[] {
  return movies.map((m) => ({ ...m, kinoKotRating: ratings[m._id] }));
}

export default async function Home() {
  const [popular, topRated, latestReviews, stats] = await Promise.all([
    getPopularMovies(),
    getTopRatedMovies(),
    getLatestReviews(),
    getPublicStats(),
  ]);

  const allIds = [...popular, ...topRated].map((m) => m._id);
  const ratings = await getRatings(allIds);

  return (
    <>
      <Header />
      <main>
        <section className={styles['home']}>
          <div className={styles['home__wrap']}>
            <HeroBanner totalReviews={stats.totalReviews} totalAuthors={stats.totalAuthors} />
            <WhyKinoKot />
            {latestReviews.length >= 4 && <ReviewsMarquee reviews={latestReviews} noContainer />}
            <MovieSlider title="Топ фильмов" movies={topRated.length > 0 ? mergeRatings(topRated, ratings) : undefined} noContainer />
            <MovieSlider title="Популярные" movies={popular.length > 0 ? mergeRatings(popular, ratings) : undefined} noContainer />
            <QuizBanner />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

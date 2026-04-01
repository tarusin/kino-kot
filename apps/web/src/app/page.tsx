import Header from '@/components/Header/Header';
import HeroBanner from '@/components/HeroBanner/HeroBanner';
import WhyKinoKot from '@/components/WhyKinoKot/WhyKinoKot';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import ReviewsMarquee from '@/components/ReviewsMarquee/ReviewsMarquee';
import MovieSlider from '@/components/MovieSlider/MovieSlider';
import QuizBanner from '@/components/QuizBanner/QuizBanner';
import LuckyBanner from '@/components/LuckyBanner/LuckyBanner';
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

async function getPopularSeries(): Promise<Movie[]> {
  try {
    const res = await fetch(`${API_URL}/movies/popular?mediaType=series`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getUpcomingMovies(): Promise<Movie[]> {
  try {
    const res = await fetch(`${API_URL}/movies/upcoming?mediaType=movie`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
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
  const [popular, topRated, popularSeries, upcoming, latestReviews] = await Promise.all([
    getPopularMovies(),
    getTopRatedMovies(),
    getPopularSeries(),
    getUpcomingMovies(),
    getLatestReviews(),
  ]);

  const allIds = [...popular, ...topRated, ...popularSeries, ...upcoming].map((m) => m._id);
  const ratings = await getRatings(allIds);

  return (
    <>
      <Header />
      <main>
        <section className={styles['home']}>
          <div className={styles['home__wrap']}>
            <HeroBanner />
            <WhyKinoKot />
            <HowItWorks />
            {latestReviews.length >= 4 && <ReviewsMarquee reviews={latestReviews} noContainer />}
            <MovieSlider title="Топ фильмов" movies={topRated.length > 0 ? mergeRatings(topRated, ratings) : undefined} noContainer />
            <MovieSlider title="Популярные" movies={popular.length > 0 ? mergeRatings(popular, ratings) : undefined} noContainer />
            <QuizBanner />
            <MovieSlider title="Популярные сериалы" movies={popularSeries.length > 0 ? mergeRatings(popularSeries, ratings) : undefined} noContainer />
            <MovieSlider title="Скоро выходят" movies={upcoming.length > 0 ? mergeRatings(upcoming, ratings) : undefined} noContainer />
            <LuckyBanner />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

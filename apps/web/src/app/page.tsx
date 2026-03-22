import Header from '@/components/Header/Header';
import HeroBanner from '@/components/HeroBanner/HeroBanner';
import ReviewsMarquee from '@/components/ReviewsMarquee/ReviewsMarquee';
import CategoryCards from '@/components/CategoryCards/CategoryCards';
import MovieSlider from '@/components/MovieSlider/MovieSlider';
import Footer from '@/components/Footer/Footer';
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
  const [popular, topRated, latestReviews] = await Promise.all([
    getPopularMovies(),
    getTopRatedMovies(),
    getLatestReviews(),
  ]);

  const allIds = [...popular, ...topRated].map((m) => m._id);
  const ratings = await getRatings(allIds);

  return (
    <>
      <Header />
      <main>
        <HeroBanner />
        {latestReviews.length >= 4 && <ReviewsMarquee reviews={latestReviews} />}
        <CategoryCards />
        <MovieSlider title="Топ фильмов" movies={topRated.length > 0 ? mergeRatings(topRated, ratings) : undefined} />
        <MovieSlider title="Популярные" movies={popular.length > 0 ? mergeRatings(popular, ratings) : undefined} />
      </main>
      <Footer />
    </>
  );
}

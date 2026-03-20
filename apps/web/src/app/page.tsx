import Header from '@/components/Header/Header';
import HeroBanner from '@/components/HeroBanner/HeroBanner';
import CategoryCards from '@/components/CategoryCards/CategoryCards';
import MovieSlider from '@/components/MovieSlider/MovieSlider';
import Footer from '@/components/Footer/Footer';
import type { Movie } from '@/types/movie';

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
  const [popular, topRated] = await Promise.all([
    getPopularMovies(),
    getTopRatedMovies(),
  ]);

  const allIds = [...popular, ...topRated].map((m) => m._id);
  const ratings = await getRatings(allIds);

  return (
    <>
      <Header />
      <main>
        <HeroBanner />
        <CategoryCards />
        <MovieSlider title="Топ фильмов" movies={topRated.length > 0 ? mergeRatings(topRated, ratings) : undefined} />
        <MovieSlider title="Популярные" movies={popular.length > 0 ? mergeRatings(popular, ratings) : undefined} />
      </main>
      <Footer />
    </>
  );
}

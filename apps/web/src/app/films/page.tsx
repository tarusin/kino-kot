import Header from '@/components/Header/Header';
import MovieSection from '@/components/MovieSection/MovieSection';
import Footer from '@/components/Footer/Footer';
import type { Movie } from '@/types/movie';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function getMovies(): Promise<Movie[]> {
  try {
    const res = await fetch(`${API_URL}/movies`, {
      cache: 'no-store',
    });
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
      cache: 'no-store',
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export default async function FilmsPage() {
  const movies = await getMovies();
  const sliced = movies.slice(0, 12);

  const ratings = await getRatings(sliced.map((m) => m._id));
  const moviesWithRatings = sliced.map((m) => ({
    ...m,
    kinoKotRating: ratings[m._id],
  }));

  return (
    <>
      <Header />
      <main>
        <MovieSection title="Популярные фильмы" movies={moviesWithRatings} />
      </main>
      <Footer />
    </>
  );
}

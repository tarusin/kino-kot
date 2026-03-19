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

export default async function Home() {
  const [popular, topRated] = await Promise.all([
    getPopularMovies(),
    getTopRatedMovies(),
  ]);

  return (
    <>
      <Header />
      <main>
        <HeroBanner />
        <CategoryCards />
        <MovieSlider title="Топ фильмов" movies={topRated.length > 0 ? topRated : undefined} />
        <MovieSlider title="Популярные" movies={popular.length > 0 ? popular : undefined} />
      </main>
      <Footer />
    </>
  );
}

import Header from '@/components/Header/Header';
import MovieSection from '@/components/MovieSection/MovieSection';
import Footer from '@/components/Footer/Footer';
import type { Movie } from '@/types/movie';

async function getMovies(): Promise<Movie[]> {
  try {
    const res = await fetch(`${process.env.API_URL}/movies`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function FilmsPage() {
  const movies = await getMovies();

  return (
    <>
      <Header />
      <main>
        <MovieSection title="Популярные фильмы" movies={movies.slice(0, 12)} />
      </main>
      <Footer />
    </>
  );
}

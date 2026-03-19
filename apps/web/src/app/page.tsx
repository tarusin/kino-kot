import Header from '@/components/Header/Header';
import HeroBanner from '@/components/HeroBanner/HeroBanner';
import CategoryCards from '@/components/CategoryCards/CategoryCards';
import MovieSection from '@/components/MovieSection/MovieSection';
import Footer from '@/components/Footer/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroBanner />
        <CategoryCards />
        <MovieSection title="Топ фильмов" />
        <MovieSection title="Популярные" />
      </main>
      <Footer />
    </>
  );
}

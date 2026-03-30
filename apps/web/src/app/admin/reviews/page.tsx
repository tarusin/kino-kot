'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import AdminReviewCard from '@/components/AdminReviewCard/AdminReviewCard';
import Pagination from '@/components/Pagination/Pagination';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PendingReview {
  _id: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
  movieTitle?: string;
  moviePosterPath?: string | null;
  moderationReason?: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPending = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/moderation/pending/reviews?page=${p}&limit=10`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPending(page);
    }
  }, [user, page, fetchPending]);

  const handleModerated = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r._id !== reviewId));
  };

  if (loading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Header />
      <main className={styles['admin-reviews']}>
        <div className={styles['admin-reviews__container']}>
          <div className={styles['admin-reviews__header']}>
            <Link href="/admin" className={styles['admin-reviews__back']}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Назад
            </Link>
            <h1 className={styles['admin-reviews__title']}>Отзывы на модерации</h1>
          </div>

          {isLoading ? (
            <p className={styles['admin-reviews__loading']}>Загрузка...</p>
          ) : reviews.length === 0 ? (
            <div className={styles['admin-reviews__empty']}>
              <p>Нет отзывов на модерации</p>
            </div>
          ) : (
            <>
              <div className={styles['admin-reviews__list']}>
                {reviews.map((review) => (
                  <AdminReviewCard
                    key={review._id}
                    reviewId={review._id}
                    userName={review.userName}
                    rating={review.rating}
                    text={review.text}
                    createdAt={review.createdAt}
                    movieTitle={review.movieTitle}
                    moviePosterPath={review.moviePosterPath}
                    moderationReason={review.moderationReason}
                    onModerated={handleModerated}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className={styles['admin-reviews__pagination']}>
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

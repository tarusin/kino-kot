'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import AdminCommentCard from '@/components/AdminCommentCard/AdminCommentCard';
import Pagination from '@/components/Pagination/Pagination';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PendingComment {
  _id: string;
  userName: string;
  text: string;
  createdAt: string;
  reviewText?: string;
  moderationReason?: string;
}

export default function AdminCommentsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPending = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/moderation/pending/comments?page=${p}&limit=10`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
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

  const handleModerated = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  if (loading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Header />
      <main className={styles['admin-comments']}>
        <div className={styles['admin-comments__container']}>
          <div className={styles['admin-comments__header']}>
            <Link href="/admin" className={styles['admin-comments__back']}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Назад
            </Link>
            <h1 className={styles['admin-comments__title']}>Комментарии на модерации</h1>
          </div>

          {isLoading ? (
            <p className={styles['admin-comments__loading']}>Загрузка...</p>
          ) : comments.length === 0 ? (
            <div className={styles['admin-comments__empty']}>
              <p>Нет комментариев на модерации</p>
            </div>
          ) : (
            <>
              <div className={styles['admin-comments__list']}>
                {comments.map((comment) => (
                  <AdminCommentCard
                    key={comment._id}
                    commentId={comment._id}
                    userName={comment.userName}
                    text={comment.text}
                    createdAt={comment.createdAt}
                    reviewText={comment.reviewText}
                    moderationReason={comment.moderationReason}
                    onModerated={handleModerated}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className={styles['admin-comments__pagination']}>
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Stats {
  pendingReviews: number;
  pendingComments: number;
  pendingReports: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch(`${API_URL}/moderation/stats`, { credentials: 'include' })
        .then((res) => res.json())
        .then(setStats)
        .catch(() => {});
    }
  }, [user]);

  if (loading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Header />
      <main className={styles['admin']}>
        <div className={styles['admin__container']}>
          <h1 className={styles['admin__title']}>Панель модерации</h1>

          <div className={styles['admin__cards']}>
            <Link href="/admin/reviews" className={styles['admin__card']}>
              <div className={styles['admin__card-icon']}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#FF3B2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#FF3B2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles['admin__card-info']}>
                <span className={styles['admin__card-label']}>Отзывы на модерации</span>
                <span className={styles['admin__card-count']}>
                  {stats?.pendingReviews ?? '...'}
                </span>
              </div>
            </Link>

            <Link href="/admin/comments" className={styles['admin__card']}>
              <div className={styles['admin__card-icon']}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#FF3B2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles['admin__card-info']}>
                <span className={styles['admin__card-label']}>Комментарии на модерации</span>
                <span className={styles['admin__card-count']}>
                  {stats?.pendingComments ?? '...'}
                </span>
              </div>
            </Link>

            <Link href="/admin/reports" className={styles['admin__card']}>
              <div className={styles['admin__card-icon']}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="#FF3B2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="4" y1="22" x2="4" y2="15" stroke="#FF3B2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles['admin__card-info']}>
                <span className={styles['admin__card-label']}>Жалобы пользователей</span>
                <span className={styles['admin__card-count']}>
                  {stats?.pendingReports ?? '...'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

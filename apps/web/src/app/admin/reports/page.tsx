'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import AdminReportCard from '@/components/AdminReportCard/AdminReportCard';
import Pagination from '@/components/Pagination/Pagination';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PendingReport {
  _id: string;
  targetId: string;
  targetType: string;
  reason: string;
  description?: string;
  contentText?: string;
  contentAuthor?: string;
  reporterName?: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/moderation/reports?page=${p}&limit=10`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
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
      fetchReports(page);
    }
  }, [user, page, fetchReports]);

  const handleResolved = (reportId: string) => {
    setReports((prev) => prev.filter((r) => r._id !== reportId));
  };

  if (loading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Header />
      <main className={styles['admin-reports']}>
        <div className={styles['admin-reports__container']}>
          <div className={styles['admin-reports__header']}>
            <Link href="/admin" className={styles['admin-reports__back']}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Назад
            </Link>
            <h1 className={styles['admin-reports__title']}>Жалобы</h1>
          </div>

          {isLoading ? (
            <p className={styles['admin-reports__loading']}>Загрузка...</p>
          ) : reports.length === 0 ? (
            <div className={styles['admin-reports__empty']}>
              <p>Нет жалоб на модерации</p>
            </div>
          ) : (
            <>
              <div className={styles['admin-reports__list']}>
                {reports.map((report) => (
                  <AdminReportCard
                    key={report._id}
                    reportId={report._id}
                    targetType={report.targetType}
                    reason={report.reason}
                    description={report.description}
                    contentText={report.contentText}
                    contentAuthor={report.contentAuthor}
                    reporterName={report.reporterName}
                    createdAt={report.createdAt}
                    onResolved={handleResolved}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className={styles['admin-reports__pagination']}>
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

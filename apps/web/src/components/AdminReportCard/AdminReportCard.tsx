'use client';

import { useState } from 'react';
import { getInitials } from '@/utils/getInitials';
import { getAvatarColor } from '@/utils/getAvatarColor';
import styles from './AdminReportCard.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const REASON_LABELS: Record<string, string> = {
  spam: 'Спам / Реклама',
  offensive: 'Оскорбление',
  spoilers: 'Спойлеры',
  other: 'Другое',
};

interface AdminReportCardProps {
  reportId: string;
  targetType: string;
  reason: string;
  description?: string;
  contentText?: string;
  contentAuthor?: string;
  reporterName?: string;
  createdAt: string;
  onResolved: (reportId: string) => void;
}

export default function AdminReportCard({
  reportId,
  targetType,
  reason,
  description,
  contentText,
  contentAuthor,
  reporterName,
  createdAt,
  onResolved,
}: AdminReportCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: 'dismiss' | 'delete-content') => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/moderation/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        onResolved(reportId);
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <div className={styles['admin-report-card']}>
      <div className={styles['admin-report-card__header']}>
        <div className={styles['admin-report-card__badge']}>
          {targetType === 'review' ? 'Отзыв' : 'Комментарий'}
        </div>
        <span className={styles['admin-report-card__date']}>{formatDate(createdAt)}</span>
      </div>

      <div className={styles['admin-report-card__reason-block']}>
        <span className={styles['admin-report-card__reason-label']}>Причина:</span>{' '}
        {REASON_LABELS[reason] || reason}
      </div>

      {description && (
        <div className={styles['admin-report-card__description']}>
          <span>Описание:</span> {description}
        </div>
      )}

      {reporterName && (
        <div className={styles['admin-report-card__reporter']}>
          Жалоба от: <strong>{reporterName}</strong>
        </div>
      )}

      {contentText && (
        <div className={styles['admin-report-card__content']}>
          {contentAuthor && (
            <div className={styles['admin-report-card__content-author']}>
              <div className={styles['admin-report-card__avatar']} style={{ backgroundColor: getAvatarColor(contentAuthor) }}>
                {getInitials(contentAuthor)}
              </div>
              <span>{contentAuthor}</span>
            </div>
          )}
          <p className={styles['admin-report-card__content-text']}>{contentText}</p>
        </div>
      )}

      <div className={styles['admin-report-card__actions']}>
        <button
          className={styles['admin-report-card__btn-dismiss']}
          onClick={() => handleAction('dismiss')}
          disabled={isSubmitting}
          type="button"
        >
          Отклонить жалобу
        </button>
        <button
          className={styles['admin-report-card__btn-delete']}
          onClick={() => handleAction('delete-content')}
          disabled={isSubmitting}
          type="button"
        >
          Удалить контент
        </button>
      </div>
    </div>
  );
}

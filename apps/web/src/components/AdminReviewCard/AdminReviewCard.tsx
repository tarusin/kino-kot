'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getInitials } from '@/utils/getInitials';
import { getAvatarColor } from '@/utils/getAvatarColor';
import styles from './AdminReviewCard.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface AdminReviewCardProps {
  reviewId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
  movieTitle?: string;
  moviePosterPath?: string | null;
  moderationReason?: string;
  onModerated: (reviewId: string) => void;
}

export default function AdminReviewCard({
  reviewId,
  userName,
  rating,
  text,
  createdAt,
  movieTitle,
  moviePosterPath,
  moderationReason,
  onModerated,
}: AdminReviewCardProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/moderation/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      if (res.ok) {
        onModerated(reviewId);
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
    <div className={styles['admin-review-card']}>
      <div className={styles['admin-review-card__header']}>
        <div className={styles['admin-review-card__user']}>
          <div className={styles['admin-review-card__avatar']} style={{ backgroundColor: getAvatarColor(userName) }}>
            {getInitials(userName)}
          </div>
          <div className={styles['admin-review-card__meta']}>
            <span className={styles['admin-review-card__name']}>{userName}</span>
            <span className={styles['admin-review-card__date']}>{formatDate(createdAt)}</span>
          </div>
        </div>
        <div className={styles['admin-review-card__rating']}>
          <Image src="/icons/rating-paw-full.svg" alt="" width={16} height={16} />
          <span>{rating}/10</span>
        </div>
      </div>

      {movieTitle && (
        <div className={styles['admin-review-card__movie']}>
          {moviePosterPath && (
            <Image
              src={`https://image.tmdb.org/t/p/w92${moviePosterPath}`}
              alt={movieTitle}
              width={40}
              height={60}
              className={styles['admin-review-card__poster']}
            />
          )}
          <span className={styles['admin-review-card__movie-title']}>{movieTitle}</span>
        </div>
      )}

      <p className={styles['admin-review-card__text']}>{text}</p>

      {moderationReason && (
        <div className={styles['admin-review-card__ai-reason']}>
          <span>Причина флага:</span> {moderationReason}
        </div>
      )}

      {rejectMode ? (
        <div className={styles['admin-review-card__reject-form']}>
          <textarea
            className={styles['admin-review-card__reject-input']}
            placeholder="Причина отклонения (необязательно)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
          />
          <div className={styles['admin-review-card__reject-actions']}>
            <button
              className={styles['admin-review-card__btn-confirm-reject']}
              onClick={() => handleAction('rejected')}
              disabled={isSubmitting}
              type="button"
            >
              Подтвердить отклонение
            </button>
            <button
              className={styles['admin-review-card__btn-cancel']}
              onClick={() => { setRejectMode(false); setReason(''); }}
              type="button"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className={styles['admin-review-card__actions']}>
          <button
            className={styles['admin-review-card__btn-approve']}
            onClick={() => handleAction('approved')}
            disabled={isSubmitting}
            type="button"
          >
            Одобрить
          </button>
          <button
            className={styles['admin-review-card__btn-reject']}
            onClick={() => setRejectMode(true)}
            disabled={isSubmitting}
            type="button"
          >
            Отклонить
          </button>
        </div>
      )}
    </div>
  );
}

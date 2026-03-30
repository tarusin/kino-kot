'use client';

import { useState } from 'react';
import { getInitials } from '@/utils/getInitials';
import styles from './AdminCommentCard.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface AdminCommentCardProps {
  commentId: string;
  userName: string;
  text: string;
  createdAt: string;
  reviewText?: string;
  moderationReason?: string;
  onModerated: (commentId: string) => void;
}

export default function AdminCommentCard({
  commentId,
  userName,
  text,
  createdAt,
  reviewText,
  moderationReason,
  onModerated,
}: AdminCommentCardProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/moderation/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      if (res.ok) {
        onModerated(commentId);
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
    <div className={styles['admin-comment-card']}>
      <div className={styles['admin-comment-card__header']}>
        <div className={styles['admin-comment-card__user']}>
          <div className={styles['admin-comment-card__avatar']}>
            {getInitials(userName)}
          </div>
          <div className={styles['admin-comment-card__meta']}>
            <span className={styles['admin-comment-card__name']}>{userName}</span>
            <span className={styles['admin-comment-card__date']}>{formatDate(createdAt)}</span>
          </div>
        </div>
      </div>

      {reviewText && (
        <div className={styles['admin-comment-card__review-context']}>
          <span>К отзыву:</span> {reviewText}...
        </div>
      )}

      <p className={styles['admin-comment-card__text']}>{text}</p>

      {moderationReason && (
        <div className={styles['admin-comment-card__ai-reason']}>
          <span>Причина флага:</span> {moderationReason}
        </div>
      )}

      {rejectMode ? (
        <div className={styles['admin-comment-card__reject-form']}>
          <textarea
            className={styles['admin-comment-card__reject-input']}
            placeholder="Причина отклонения (необязательно)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
          />
          <div className={styles['admin-comment-card__reject-actions']}>
            <button
              className={styles['admin-comment-card__btn-confirm-reject']}
              onClick={() => handleAction('rejected')}
              disabled={isSubmitting}
              type="button"
            >
              Подтвердить отклонение
            </button>
            <button
              className={styles['admin-comment-card__btn-cancel']}
              onClick={() => { setRejectMode(false); setReason(''); }}
              type="button"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className={styles['admin-comment-card__actions']}>
          <button
            className={styles['admin-comment-card__btn-approve']}
            onClick={() => handleAction('approved')}
            disabled={isSubmitting}
            type="button"
          >
            Одобрить
          </button>
          <button
            className={styles['admin-comment-card__btn-reject']}
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

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/utils/getInitials';
import { getAvatarColor } from '@/utils/getAvatarColor';
import ReportModal from '@/components/ReportModal/ReportModal';
import Modal from '@/components/Modal/Modal';
import styles from './CommentCard.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CommentCardProps {
  commentId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  isOwn: boolean;
  onDeleted: (commentId: string) => void;
}

export default function CommentCard({
  commentId,
  userId,
  userName,
  text,
  createdAt,
  isOwn,
  onDeleted,
}: CommentCardProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const initials = getInitials(userName);
  const d = new Date(createdAt);
  const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/reviews/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        onDeleted(commentId);
      } else {
        toast.error('Не удалось удалить комментарий');
      }
    } catch {
      toast.error('Не удалось удалить комментарий');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles['comment-card']}>
      <div className={styles['comment-card__avatar']} style={{ backgroundColor: getAvatarColor(userName) }}>{initials}</div>
      <div className={styles['comment-card__body']}>
        <div className={styles['comment-card__header']}>
          <span className={styles['comment-card__name']}>{userName}</span>
          <span className={styles['comment-card__date']}>{date}</span>
          {user && !isOwn && (
            <button
              className={styles['comment-card__report']}
              onClick={() => setReportOpen(true)}
              type="button"
              title="Пожаловаться"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            </button>
          )}
          {isOwn && (
            <button
              className={styles['comment-card__delete']}
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
              type="button"
            >
              {deleting ? '...' : 'Удалить'}
            </button>
          )}
        </div>
        <p className={styles['comment-card__text']}>{text}</p>
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetId={commentId}
        targetType="comment"
      />

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Подтверждение">
        <div className={styles['comment-card__confirm']}>
          <p className={styles['comment-card__confirm-text']}>Удалить комментарий?</p>
          <div className={styles['comment-card__confirm-actions']}>
            <button
              className={styles['comment-card__confirm-cancel']}
              onClick={() => setConfirmOpen(false)}
              type="button"
            >
              Отмена
            </button>
            <button
              className={styles['comment-card__confirm-delete']}
              onClick={async () => {
                setConfirmOpen(false);
                await handleDelete();
              }}
              type="button"
            >
              Удалить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

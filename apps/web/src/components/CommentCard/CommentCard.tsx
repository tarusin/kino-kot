'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { getInitials } from '@/utils/getInitials';
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
  const [deleting, setDeleting] = useState(false);

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
      <div className={styles['comment-card__avatar']}>{initials}</div>
      <div className={styles['comment-card__body']}>
        <div className={styles['comment-card__header']}>
          <span className={styles['comment-card__name']}>{userName}</span>
          <span className={styles['comment-card__date']}>{date}</span>
          {isOwn && (
            <button
              className={styles['comment-card__delete']}
              onClick={handleDelete}
              disabled={deleting}
              type="button"
            >
              {deleting ? '...' : 'Удалить'}
            </button>
          )}
        </div>
        <p className={styles['comment-card__text']}>{text}</p>
      </div>
    </div>
  );
}

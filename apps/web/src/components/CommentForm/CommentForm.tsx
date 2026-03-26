'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import styles from './CommentForm.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CommentFormProps {
  reviewId: string;
  onCommentSubmitted: () => void;
}

export default function CommentForm({ reviewId, onCommentSubmitted }: CommentFormProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/reviews/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, text: text.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Ошибка при отправке');
      }

      toast.success('Комментарий отправлен');
      setText('');
      onCommentSubmitted();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при отправке');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles['comment-form']}>
      <textarea
        className={styles['comment-form__textarea']}
        placeholder="Написать комментарий..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={2}
      />
      <button
        className={styles['comment-form__submit']}
        onClick={handleSubmit}
        disabled={submitting || !text.trim()}
        type="button"
      >
        {submitting ? 'Отправка...' : 'Отправить'}
      </button>
    </div>
  );
}

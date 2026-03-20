'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/utils/getInitials';
import styles from './ReviewCard.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ReviewCardProps {
  reviewId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  userReaction: 'like' | 'dislike' | null;
}

export default function ReviewCard({
                                     reviewId,
                                     userName,
                                     rating,
                                     text,
                                     createdAt,
                                     likesCount: initialLikes,
                                     dislikesCount: initialDislikes,
                                     userReaction: initialReaction,
                                   }: ReviewCardProps) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [dislikesCount, setDislikesCount] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState(initialReaction);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = getInitials(userName);
  const date = new Date(createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Войдите, чтобы оценить отзыв');
      return;
    }
    if (isSubmitting) {
      return;
    }

    const prevLikes = likesCount;
    const prevDislikes = dislikesCount;
    const prevReaction = userReaction;

    if (userReaction === type) {
      setUserReaction(null);
      if (type === 'like') {
        setLikesCount((c) => c - 1);
      } else {
        setDislikesCount((c) => c - 1);
      }
    } else {
      if (userReaction) {
        if (userReaction === 'like') {
          setLikesCount((c) => c - 1);
        } else {
          setDislikesCount((c) => c - 1);
        }
      }
      setUserReaction(type);
      if (type === 'like') {
        setLikesCount((c) => c + 1);
      } else {
        setDislikesCount((c) => c + 1);
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${ API_URL }/reviews/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, type }),
      });

      if (res.ok) {
        const data = await res.json();
        setLikesCount(data.likesCount);
        setDislikesCount(data.dislikesCount);
        setUserReaction(data.userReaction);
      } else {
        setLikesCount(prevLikes);
        setDislikesCount(prevDislikes);
        setUserReaction(prevReaction);
        toast.error('Не удалось отправить реакцию');
      }
    } catch {
      setLikesCount(prevLikes);
      setDislikesCount(prevDislikes);
      setUserReaction(prevReaction);
      toast.error('Не удалось отправить реакцию');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={ styles['review-card'] }>
      <div className={ styles['review-card__left'] }>
        <div className={ styles['review-card__avatar'] }>{ initials }</div>
        <div className={ styles['review-card__rating-badge'] }>
          <Image
            src="/icons/rating-paw-full.svg"
            alt=""
            width={ 16 }
            height={ 16 }
          />
          <span>{ rating.toFixed(1) }/10</span>
        </div>
      </div>

      <div className={ styles['review-card__right'] }>
        <div className={ styles['review-card__right-header'] }>
          <span className={ styles['review-card__name'] }>{ userName }</span>
          <span className={ styles['review-card__date'] }>{ date }</span>
        </div>
        <p className={ styles['review-card__text'] }>{ text }</p>
        <div className={ styles['review-card__reactions'] }>
          <button
            className={ `${ styles['review-card__reaction-btn'] } ${ styles['review-card__reaction-btn--like'] } ${
              userReaction === 'like'
                ? styles['review-card__reaction-btn--active']
                : ''
            }` }
            onClick={ () => handleReaction('like') }
            disabled={ isSubmitting }
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 10v12"/>
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>
            </svg>
            <span>{ likesCount.toLocaleString('ru-RU') }</span>
          </button>

          <button
            className={ `${ styles['review-card__reaction-btn'] } ${ styles['review-card__reaction-btn--dislike'] } ${
              userReaction === 'dislike'
                ? styles['review-card__reaction-btn--active']
                : ''
            }` }
            onClick={ () => handleReaction('dislike') }
            disabled={ isSubmitting }
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 14V2"/>
              <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>
            </svg>
            <span>{ dislikesCount.toLocaleString('ru-RU') }</span>
          </button>
        </div>
      </div>
    </div>
  );
}

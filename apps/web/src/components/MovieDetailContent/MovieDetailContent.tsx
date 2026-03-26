'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ReviewForm from '@/components/ReviewForm/ReviewForm';
import ReviewCard from '@/components/ReviewCard/ReviewCard';
import type { MovieDetail } from '@/types/movie';
import styles from './MovieDetailContent.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ReviewData {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  userReaction: 'like' | 'dislike' | null;
}

interface MovieDetailContentProps {
  movie: MovieDetail;
}

type TabKey = 'reviews' | 'description' | 'cast' | 'stills';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'reviews', label: 'Отзывы' },
  { key: 'description', label: 'Описание' },
  { key: 'cast', label: 'Актеры и команда' },
  { key: 'stills', label: 'Кадры' },
];

const MEDIA_TYPE_LABELS: Record<string, string> = {
  series: 'Сериал',
  cartoon: 'Мультфильм',
};

function getMediaTypeLabel(compositeId: string): string {
  const prefix = compositeId.split('-')[0];
  return MEDIA_TYPE_LABELS[prefix] || 'Фильм';
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h}ч`;
  return `${h}ч ${m}мин`;
}

export default function MovieDetailContent({ movie }: MovieDetailContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('reviews');
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reviews/movie/${movie._id}`, {
        credentials: 'include',
      });
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setReviewsLoading(false);
    }
  }, [movie._id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const userHasReview = user
    ? reviews.some((r: any) => r.userId === user.id)
    : false;

  const year = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : '';

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w780${movie.posterPath}`
    : undefined;

  const handleReviewClick = () => {
    setActiveTab('reviews');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles['movie-detail']}>
      <div className={styles['movie-detail__container']}>
        {/* Заголовок + рейтинги + кнопка */}
        <div className={styles['movie-detail__info-row']}>
          <h1 className={styles['movie-detail__title']}>{movie.title}</h1>

          <div className={styles['movie-detail__ratings']}>
            <div className={styles['movie-detail__rating']}>
              <Image
                src="/icons/rating-kk.svg"
                alt="КиноКот"
                width={32}
                height={32}
              />
              <span className={styles['movie-detail__rating-value']}>—</span>
            </div>
            <div className={styles['movie-detail__rating']}>
              <Image
                src="/icons/rating-tmdb.svg"
                alt="TMDB"
                width={32}
                height={32}
                style={{ borderRadius: '50%' }}
              />
              <span className={styles['movie-detail__rating-value']}>
                {movie.voteAverage.toFixed(1)}
              </span>
            </div>
          </div>

          {!userHasReview && (
            <button
              className={styles['movie-detail__review-btn']}
              onClick={handleReviewClick}
            >
              Оставить отзыв
            </button>
          )}
        </div>

        {/* Мета-информация */}
        <div className={styles['movie-detail__meta']}>
          <span>{getMediaTypeLabel(movie._id)}</span>
          {year && <span>{year}</span>}
          {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
        </div>

        {/* Медиа-блок: постер + трейлер */}
        <div className={styles['movie-detail__media']}>
          <div className={styles['movie-detail__poster']}>
            {posterUrl && (
              <Image
                src={posterUrl}
                alt={movie.title}
                fill
                sizes="(max-width: 768px) 40vw, 300px"
                priority
              />
            )}
          </div>

          {movie.trailerKey ? (
            <div className={styles['movie-detail__trailer']}>
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailerKey}`}
                title={`${movie.title} — трейлер`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            movie.backdropPath && (
              <div className={styles['movie-detail__backdrop']}>
                <Image
                  src={`https://image.tmdb.org/t/p/w1280${movie.backdropPath}`}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
              </div>
            )
          )}
        </div>

        {/* Жанры + рейтинги + кнопка */}
        <div className={styles['movie-detail__genres']}>
          {movie.genres.map((genre) => (
            <span key={genre.id} className={styles['movie-detail__genre']}>
                {genre.name}
              </span>
          ))}
        </div>

        {/* Вкладки */}
        <div className={styles['movie-detail__tabs']} ref={tabsRef}>
          <div className={styles['movie-detail__tab-bar']}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles['movie-detail__tab']} ${
                  activeTab === tab.key
                    ? styles['movie-detail__tab--active']
                    : ''
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles['movie-detail__tab-content']}>
            {activeTab === 'reviews' && (
              <ReviewsTab
                user={user}
                loading={loading}
                movieId={movie._id}
                reviews={reviews}
                reviewsLoading={reviewsLoading}
                userHasReview={userHasReview}
                onReviewSubmitted={fetchReviews}
              />
            )}
            {activeTab === 'description' && (
              <DescriptionTab overview={movie.overview} />
            )}
            {activeTab === 'cast' && (
              <CastTab cast={movie.cast} crew={movie.crew} />
            )}
            {activeTab === 'stills' && <StillsTab stills={movie.stills} />}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Вкладка: Отзывы ---------- */

function VerifyEmailBanner() {
  const { user, resendVerification } = useAuth();
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    if (!user) return;
    setSending(true);
    try {
      await resendVerification(user.email);
    } catch {
      // toast handled in context
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles['verify-banner']}>
      <svg className={styles['verify-banner__icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 4L12 13L2 4" />
      </svg>
      <div className={styles['verify-banner__content']}>
        <p className={styles['verify-banner__text']}>
          Подтвердите email, чтобы оставлять отзывы
        </p>
        <button
          className={styles['verify-banner__button']}
          onClick={handleResend}
          disabled={sending}
        >
          {sending ? 'Отправляем...' : 'Отправить письмо повторно'}
        </button>
      </div>
    </div>
  );
}

function ReviewsTab({
  user,
  loading,
  movieId,
  reviews,
  reviewsLoading,
  userHasReview,
  onReviewSubmitted,
}: {
  user: { id: string; name: string; email: string; isEmailVerified: boolean } | null;
  loading: boolean;
  movieId: string;
  reviews: ReviewData[];
  reviewsLoading: boolean;
  userHasReview: boolean;
  onReviewSubmitted: () => void;
}) {
  if (loading) return null;

  return (
    <div className={styles['reviews-tab']}>
      {user ? (
        !userHasReview && (
          user.isEmailVerified ? (
            <ReviewForm
              movieId={movieId}
              user={user}
              onReviewSubmitted={onReviewSubmitted}
            />
          ) : (
            <VerifyEmailBanner />
          )
        )
      ) : (
        <p className={styles['reviews-tab__auth-message']}>
          Чтобы оставить отзыв, вам нужно{' '}
          <Link href="/login" className={styles['reviews-tab__link']}>
            войти
          </Link>
        </p>
      )}

      {reviewsLoading ? (
        <p className={styles['reviews-tab__empty']}>Загрузка отзывов...</p>
      ) : reviews.length === 0 ? (
        <p className={styles['reviews-tab__empty']}>Отзывов пока нет</p>
      ) : (
        <div className={styles['reviews-tab__list']}>
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              reviewId={review._id}
              userId={review.userId}
              userName={review.userName}
              rating={review.rating}
              text={review.text}
              createdAt={review.createdAt}
              likesCount={review.likesCount}
              dislikesCount={review.dislikesCount}
              userReaction={review.userReaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Вкладка: Описание ---------- */

function DescriptionTab({ overview }: { overview: string }) {
  return (
    <div className={styles['description-tab']}>
      <p className={styles['description-tab__text']}>
        {overview || 'Описание недоступно'}
      </p>
    </div>
  );
}

/* ---------- Вкладка: Актеры и команда ---------- */

function CastTab({
  cast,
  crew,
}: {
  cast: MovieDetail['cast'];
  crew: MovieDetail['crew'];
}) {
  const allMembers = [
    ...crew.map((c) => ({ ...c, role: c.job })),
    ...cast.map((c) => ({ ...c, role: c.character })),
  ];

  if (allMembers.length === 0) {
    return <p className={styles['cast-tab__empty']}>Информация недоступна</p>;
  }

  return (
    <div className={styles['cast-tab']}>
      {allMembers.map((member, i) => (
        <div key={`${member.name}-${i}`} className={styles['cast-tab__card']}>
          <div className={styles['cast-tab__photo']}>
            {member.profilePath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w185${member.profilePath}`}
                alt={member.name}
                fill
                sizes="60px"
              />
            ) : (
              <div className={styles['cast-tab__placeholder']} />
            )}
          </div>
          <div className={styles['cast-tab__info']}>
            <p className={styles['cast-tab__name']}>{member.name}</p>
            <p className={styles['cast-tab__role']}>{member.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Вкладка: Кадры ---------- */

function StillsTab({ stills }: { stills: string[] }) {
  if (stills.length === 0) {
    return <p className={styles['stills-tab__empty']}>Кадры недоступны</p>;
  }

  return (
    <div className={styles['stills-tab']}>
      {stills.map((path) => (
        <div key={path} className={styles['stills-tab__item']}>
          <Image
            src={`https://image.tmdb.org/t/p/w780${path}`}
            alt="Кадр из фильма"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  );
}

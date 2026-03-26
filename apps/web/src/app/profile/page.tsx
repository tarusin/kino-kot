'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import EditProfileModal from '@/components/EditProfileModal/EditProfileModal';
import DeleteAccountModal from '@/components/DeleteAccountModal/DeleteAccountModal';
import ProfileReviewCard from '@/components/ProfileReviewCard/ProfileReviewCard';
import Pagination from '@/components/Pagination/Pagination';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/utils/getInitials';
import styles from './page.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type TabKey = 'info' | 'reviews';

interface UserReview {
  _id: string;
  rating: number;
  text: string;
  userName: string;
  createdAt: string;
  movie: {
    _id: string;
    title: string;
    posterPath: string | null;
  };
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Личная информация' },
  { key: 'reviews', label: 'Мои отзывы' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchMyReviews = useCallback(async (page: number) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${ API_URL }/reviews/me?page=${ page }&limit=5`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setReviewsTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (activeTab === 'reviews' && user) {
      fetchMyReviews(reviewsPage);
    }
  }, [activeTab, reviewsPage, user, fetchMyReviews]);

  if (loading || !user) {
    return null;
  }

  const initials = getInitials(user.name);

  return (
    <>
      <Header/>
      <main className={ styles['profile'] }>
        <div className={ styles['profile__container'] }>
          <h1 className={ styles['profile__title'] }>Профиль</h1>

          <div className={ styles['profile__tabs'] }>
            { TABS.map((tab) => (
              <button
                key={ tab.key }
                className={ `${ styles['profile__tab'] } ${ activeTab === tab.key ? styles['profile__tab--active'] : '' }` }
                onClick={ () => setActiveTab(tab.key) }
                type="button"
              >
                { tab.label }
              </button>
            )) }
          </div>

          { activeTab === 'info' && (
            <div className={ styles['profile__info'] }>
              <div className={ styles['profile__info-top'] }>
                <div className={ styles['profile__avatar'] }>
                  <span className={ styles['profile__initial'] }>{ initials }</span>
                </div>

                <div className={ styles['profile__fields'] }>
                  <div className={ styles['profile__field'] }>
                    <span className={ styles['profile__label'] }>Имя</span>
                    <span className={ styles['profile__value'] }>{ user.name }</span>
                  </div>
                  <div className={ styles['profile__field'] }>
                    <span className={ styles['profile__label'] }>Email</span>
                    <span className={ styles['profile__value'] }>{ user.email }</span>
                  </div>
                </div>
              </div>

              <div className={ styles['profile__actions'] }>
                <button
                  className={ styles['profile__edit-btn'] }
                  onClick={ () => setIsEditModalOpen(true) }
                  type="button"
                >
                  Редактировать
                </button>
                <button
                  className={ styles['profile__delete-btn'] }
                  onClick={ () => setIsDeleteModalOpen(true) }
                  type="button"
                >
                  Удалить аккаунт
                </button>
              </div>
            </div>
          ) }

          { activeTab === 'reviews' && (
            <div className={ styles['profile__reviews'] }>
              { reviewsLoading ? (
                <div className={ styles['profile__reviews-loading'] }>
                  <p>Загрузка отзывов...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className={ styles['profile__reviews-empty'] }>
                  <p>У вас пока нет отзывов</p>
                </div>
              ) : (
                <>
                  { reviews.map((review) => (
                    <ProfileReviewCard
                      key={ review._id }
                      movieTitle={ review.movie.title }
                      moviePosterPath={ review.movie.posterPath }
                      movieId={ review.movie._id }
                      userName={ review.userName }
                      rating={ review.rating }
                      text={ review.text }
                      createdAt={ review.createdAt }
                    />
                  )) }
                  <div className={ styles['profile__reviews-pagination'] }>
                    <Pagination
                      currentPage={ reviewsPage }
                      totalPages={ reviewsTotalPages }
                      onPageChange={ setReviewsPage }
                    />
                  </div>
                </>
              ) }
            </div>
          ) }
        </div>
      </main>

      <EditProfileModal
        isOpen={ isEditModalOpen }
        onClose={ () => setIsEditModalOpen(false) }
      />

      <DeleteAccountModal
        isOpen={ isDeleteModalOpen }
        onClose={ () => setIsDeleteModalOpen(false) }
      />

      <Footer/>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import EditProfileModal from '@/components/EditProfileModal/EditProfileModal';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.scss';

type TabKey = 'info' | 'reviews';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Личная информация' },
  { key: 'reviews', label: 'Мои отзывы' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return null;
  }

  const initial = user.name.charAt(0).toUpperCase();

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
                  <span className={ styles['profile__initial'] }>{ initial }</span>
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

              <button
                className={ styles['profile__edit-btn'] }
                onClick={ () => setIsEditModalOpen(true) }
                type="button"
              >
                Редактировать
              </button>
            </div>
          ) }

          { activeTab === 'reviews' && (
            <div className={ styles['profile__stub'] }>
              <p>Раздел в разработке</p>
            </div>
          ) }
        </div>
      </main>

      <EditProfileModal
        isOpen={ isEditModalOpen }
        onClose={ () => setIsEditModalOpen(false) }
      />

      <Footer/>
    </>
  );
}

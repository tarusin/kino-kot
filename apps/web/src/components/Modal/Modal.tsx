'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import styles from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles['modal__overlay']} onClick={onClose}>
      <div className={styles['modal__card']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal__header']}>
          <h2 className={styles['modal__title']}>{title}</h2>
          <button className={styles['modal__close']} onClick={onClose} type="button">
            <Image src="/icons/close.svg" alt="Закрыть" width={24} height={24} />
          </button>
        </div>
        <div className={styles['modal__content']}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

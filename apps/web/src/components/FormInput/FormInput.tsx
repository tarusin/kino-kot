'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './FormInput.module.scss';

interface FormInputProps {
  type?: string;
  name: string;
  placeholder: string;
  icon: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export default function FormInput({
  type = 'text',
  name,
  placeholder,
  icon,
  value,
  onChange,
  error,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={styles['form-input']}>
      <div
        className={`${styles['form-input__field']} ${error ? styles['form-input__field--error'] : ''}`}
      >
        {!isPassword && (
          <Image
            src={icon}
            alt=""
            width={20}
            height={20}
            className={styles['form-input__icon']}
          />
        )}
        {isPassword && (
          <button
            type="button"
            className={styles['form-input__toggle']}
            onClick={() => setShowPassword(!showPassword)}
          >
            <Image
              src={
                showPassword
                  ? '/images/icons/eye-off.svg'
                  : '/images/icons/eye-show.svg'
              }
              alt={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              width={20}
              height={20}
            />
          </button>
        )}
        <input
          type={isPassword && showPassword ? 'text' : type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={styles['form-input__input']}
        />
      </div>
      {error && <span className={styles['form-input__error']}>{error}</span>}
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { QuizQuestion } from '@/data/quiz-questions';
import styles from './QuizCard.module.scss';

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (answerId: string) => void;
}

export default function QuizCard({ question, onAnswer }: QuizCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (answerId: string) => {
    if (selectedId) return;
    setSelectedId(answerId);
    setTimeout(() => {
      onAnswer(answerId);
      setSelectedId(null);
    }, 350);
  };

  return (
    <div className={styles['quiz-card']}>
      <h2 className={styles['quiz-card__question']}>{question.text}</h2>
      <div className={styles['quiz-card__options']}>
        {question.answers.map((answer) => (
          <button
            key={answer.id}
            className={`${styles['quiz-card__option']} ${
              selectedId === answer.id ? styles['quiz-card__option--selected'] : ''
            }`}
            onClick={() => handleSelect(answer.id)}
            disabled={!!selectedId}
            type="button"
          >
            {answer.text}
          </button>
        ))}
      </div>
    </div>
  );
}

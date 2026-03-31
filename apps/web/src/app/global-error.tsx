'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          fontFamily:
            "'Montserrat Alternates', -apple-system, BlinkMacSystemFont, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            fontSize: '80px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #FF3B2F, #FF5F2D)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            marginBottom: '8px',
          }}
        >
          500
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
          Критическая ошибка
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '32px',
            maxWidth: '400px',
          }}
        >
          Произошла серьёзная ошибка. Попробуйте обновить страницу.
        </p>
        <button
          onClick={reset}
          style={{
            background: 'linear-gradient(90deg, #FF3B2F, #FF5F2D)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 28px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Попробовать снова
        </button>
      </body>
    </html>
  );
}

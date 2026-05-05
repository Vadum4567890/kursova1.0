import React from 'react';
import ErrorAlert from './ErrorAlert';
import LoadingSpinner from './LoadingSpinner';

type PageAsyncSectionProps = {
  /** Показує ErrorAlert, якщо після нормалізації є текст */
  error?: unknown;
  onCloseError?: () => void;
  loading: boolean;
  children: React.ReactNode;
};

/**
 * Типовий блок під заголовком сторінки: помилка → індикатор завантаження → контент.
 */
const PageAsyncSection: React.FC<PageAsyncSectionProps> = ({
  error,
  onCloseError,
  loading,
  children,
}) => (
  <>
    <ErrorAlert message={error ?? ''} onClose={onCloseError} />
    {loading ? <LoadingSpinner /> : children}
  </>
);

export default PageAsyncSection;

import React from 'react';
import ErrorAlert from './ErrorAlert';
import LoadingSpinner from './LoadingSpinner';

type PageContentGateProps = {
  loading: boolean;
  error?: string | null;
  onCloseError?: () => void;
  children: React.ReactNode;
};

/**
 * Повноекранний стан всередині PageContainer: лише спіннер, лише помилка, або основний контент.
 */
const PageContentGate: React.FC<PageContentGateProps> = ({
  loading,
  error,
  onCloseError,
  children,
}) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onClose={onCloseError} />;
  return <>{children}</>;
};

export default PageContentGate;

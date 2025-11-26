import React from 'react';
import { Container, ContainerProps } from '@mui/material';

interface PageContainerProps extends Omit<ContainerProps, 'maxWidth'> {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  children: React.ReactNode;
}

/**
 * Універсальний контейнер для сторінок
 * За замовчуванням має стандартні відступи та максимальну ширину
 */
const PageContainer: React.FC<PageContainerProps> = ({
  maxWidth = 'xl',
  children,
  sx,
  ...props
}) => {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        mt: 4,
        mb: 4,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Container>
  );
};

export default PageContainer;


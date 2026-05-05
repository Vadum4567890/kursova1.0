import React from 'react';
import { useMyPenalties } from '../../hooks/queries/usePenalties';
import { PageHeader, PageAsyncSection, PageContainer } from '../../components/common';
import { MyPenaltiesTable } from '../../components/user';

const MyPenaltiesPage: React.FC = () => {
  const { data: penalties = [], isLoading: loading, error: penaltiesError } = useMyPenalties();

  return (
    <PageContainer>
      <PageHeader title="Мої штрафи" />

      <PageAsyncSection error={penaltiesError?.message} loading={loading}>
        <MyPenaltiesTable penalties={penalties} />
      </PageAsyncSection>
    </PageContainer>
  );
};

export default MyPenaltiesPage;


import React from 'react';
import { useMyPenalties } from '../../hooks/queries/usePenalties';
import { PageHeader, ErrorAlert, LoadingSpinner, PageContainer } from '../../components/common';
import { MyPenaltiesTable } from '../../components/user';

const MyPenaltiesPage: React.FC = () => {
  const { data: penalties = [], isLoading: loading, error: penaltiesError } = useMyPenalties();

  return (
    <PageContainer>
      <PageHeader title="Мої штрафи" />

      {penaltiesError?.message && <ErrorAlert message={penaltiesError.message} />}

      {loading ? <LoadingSpinner /> : <MyPenaltiesTable penalties={penalties} />}
    </PageContainer>
  );
};

export default MyPenaltiesPage;


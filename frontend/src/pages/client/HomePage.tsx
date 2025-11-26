import React, { useEffect } from 'react';
import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHomeData } from '../../hooks';
import { PageHeader, LoadingSpinner, PageContainer } from '../../components/common';
import { ActionCard, RecentRentalsSection, WelcomeSection } from '../../components/home';
import { getActionCardsConfig } from '../../constants/home';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const homeData = useHomeData();
  const actionCardsConfig = getActionCardsConfig();

  // Redirect staff to dashboard
  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'admin' || user.role === 'manager' || user.role === 'employee')) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Show login page for unauthenticated users
  if (!isAuthenticated) {
    return <WelcomeSection />;
  }

  const cardData = {
    availableCars: homeData.availableCars.length,
    activeRentals: homeData.activeRentals.length,
    penalties: homeData.penalties.length,
    totalPenalties: homeData.totalPenalties,
  };

  return (
    <PageContainer>
      <PageHeader
        title="Головна сторінка"
        subtitle={`Ласкаво просимо, ${user?.fullName || user?.username}!`}
      />

      {homeData.loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Main Action Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {actionCardsConfig.map((config, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <ActionCard
                  title={config.title}
                  subtitle={config.subtitle(cardData)}
                  icon={config.icon}
                  gradient={config.gradient}
                  onClick={() => navigate(config.route)}
                  buttonLabel={config.buttonLabel}
                />
              </Grid>
            ))}
          </Grid>

          {/* Recent Rentals */}
          <RecentRentalsSection rentals={homeData.rentals} />
        </>
      )}
    </PageContainer>
  );
};

export default HomePage;


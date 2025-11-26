import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { Assignment, Gavel } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { 
  ErrorAlert, 
  SuccessAlert,
  FormDialog 
} from '../components/common';
import {
  ProfileCard,
  RentalsTable,
  PenaltiesTable,
  PasswordChangeDialog,
} from '../components/profile';
import {
  useUserData,
  usePasswordVisibility,
  useSuccessMessage,
  useProfileDialogs,
} from '../hooks';
import { useProfileUpdate } from '../hooks/useProfileUpdate';
import { usePasswordChange } from '../hooks/usePasswordChange';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { rentals, penalties, loading: loadingData } = useUserData(user?.role);
  const { showPasswords, togglePassword, resetPasswords } = usePasswordVisibility();
  const { success, showSuccess, clearSuccess } = useSuccessMessage();
  const { profileDialog, passwordDialog, openProfileDialog } = useProfileDialogs(user);
  
  const [tabValue, setTabValue] = useState(0);

  const profileUpdate = useProfileUpdate({
    onSuccess: showSuccess,
    refreshUser,
  });

  const passwordChange = usePasswordChange({
    onSuccess: showSuccess,
  });

  const displayError = profileUpdate.error || passwordChange.error;

  const handleUpdateProfile = async () => {
    try {
      await profileUpdate.update(profileDialog.formData);
      profileDialog.handleSuccess();
    } catch {
      // Error already handled by hook
    }
  };

  const handleChangePassword = async () => {
    try {
      await passwordChange.change(passwordDialog.formData);
      passwordDialog.handleSuccess();
    } catch {
      // Error already handled by hook
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Мій профіль
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управління особистими даними та налаштуваннями
        </Typography>
      </Box>

      <ErrorAlert 
        message={displayError || ''} 
        onClose={() => {
          profileUpdate.clearError();
          passwordChange.clearError();
        }} 
      />
      <SuccessAlert message={success || ''} onClose={clearSuccess} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ProfileCard
            user={user || undefined}
            onEditProfile={openProfileDialog}
            onChangePassword={() => {
              passwordDialog.openDialog();
              resetPasswords();
            }}
          />
        </Grid>

        {/* User Data */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label="Прокати" icon={<Assignment />} iconPosition="start" />
              <Tab label="Штрафи" icon={<Gavel />} iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <RentalsTable rentals={rentals} loading={loadingData} />
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <PenaltiesTable penalties={penalties} loading={loadingData} />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <FormDialog
        open={profileDialog.open}
        title="Редагувати профіль"
        onClose={profileDialog.closeDialog}
        onSubmit={handleUpdateProfile}
        loading={profileUpdate.isPending}
        submitLabel="Зберегти"
        maxWidth="sm"
      >
        <TextField
          label="Email"
          type="email"
          value={profileDialog.formData.email}
          onChange={(e) => profileDialog.updateFormData({ email: e.target.value })}
          fullWidth
          required
        />
        <TextField
          label="ПІБ"
          value={profileDialog.formData.fullName}
          onChange={(e) => profileDialog.updateFormData({ fullName: e.target.value })}
          fullWidth
        />
        <TextField
          label="Адреса"
          value={profileDialog.formData.address}
          onChange={(e) => profileDialog.updateFormData({ address: e.target.value })}
          fullWidth
          placeholder="Місце проживання"
          multiline
          rows={2}
        />
        <TextField
          label="Телефон"
          value={profileDialog.formData.phone}
          onChange={(e) => profileDialog.updateFormData({ phone: e.target.value })}
          fullWidth
          placeholder="+380501234567"
        />
      </FormDialog>

      <PasswordChangeDialog
        open={passwordDialog.open}
        formData={passwordDialog.formData}
        showPasswords={showPasswords}
        loading={passwordChange.isPending}
        onClose={() => {
          passwordDialog.closeDialog();
          resetPasswords();
        }}
        onSubmit={handleChangePassword}
        onUpdateFormData={passwordDialog.updateFormData}
        onTogglePassword={togglePassword}
      />
    </Container>
  );
};

export default ProfilePage;


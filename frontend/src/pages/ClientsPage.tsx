import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Client } from '../interfaces';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/queries/useClients';
import { 
  ErrorAlert, 
  LoadingSpinner, 
  SearchBar, 
  PageHeader, 
  FormDialog,
  ConfirmDialog,
  PageContainer
} from '../components/common';
import { useFormDialog } from '../hooks/useFormDialog';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { formatDate } from '../utils/dateHelpers';

const ClientsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // React Query hooks
  const { data: clients = [], isLoading: loading, error: clientsError } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  
  // Custom hooks
  const { error, handleError, clearError } = useErrorHandler();
  const displayError = error || clientsError?.message;

  const formDialog = useFormDialog<Client>({
    initialData: {
      fullName: '',
      phone: '',
      email: '',
      address: '',
    } as Client,
  });

  const deleteConfirm = useDeleteConfirm({
    onConfirm: async (id) => {
      await deleteClient.mutateAsync(id);
      clearError();
    },
    onError: handleError,
  });

  const handleSubmit = async () => {
    try {
      clearError();
      
      if (formDialog.isEditing && formDialog.editingItem) {
        await updateClient.mutateAsync({ 
          id: formDialog.editingItem.id, 
          data: formDialog.formData 
        });
      } else {
        await createClient.mutateAsync(formDialog.formData);
      }
      
      formDialog.handleSuccess();
    } catch (err: any) {
      handleError(err, 'Помилка збереження');
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return clients.filter(
      (client) =>
        client.fullName.toLowerCase().includes(lowerSearchTerm) ||
        client.phone.includes(searchTerm) ||
        (client.address && client.address.toLowerCase().includes(lowerSearchTerm))
    );
  }, [clients, searchTerm]);

  return (
    <PageContainer>
      <PageHeader
        title="Клієнти"
        action={{
          label: 'Додати клієнта',
          icon: <Add />,
          onClick: () => formDialog.openDialog(),
        }}
      />

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Пошук за ім'ям, телефоном або адресою..."
        sx={{ mb: 3 }}
      />

      <ErrorAlert message={displayError || ''} onClose={clearError} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>ПІБ</TableCell>
                <TableCell>Телефон</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Адреса</TableCell>
                <TableCell>Дата реєстрації</TableCell>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <TableCell align="right">Дії</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.map((client) => {
                // Check if phone contains email pattern (for backward compatibility)
                const isEmailInPhone = client.phone && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.phone);
                const phone = isEmailInPhone ? '-' : client.phone;
                const email = client.email || (isEmailInPhone ? client.phone : '-');
                
                return (
                  <TableRow key={client.id} hover>
                    <TableCell>{client.id}</TableCell>
                    <TableCell>{client.fullName}</TableCell>
                    <TableCell>{phone}</TableCell>
                    <TableCell>{email}</TableCell>
                    <TableCell>{client.address || 'Не вказано'}</TableCell>
                  <TableCell>
                    {formatDate(client.registrationDate)}
                  </TableCell>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => formDialog.openDialog(client)}
                      >
                        <Edit />
                      </IconButton>
                      {user?.role === 'admin' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteConfirm.handleDeleteClick(client.id, 'client')}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Client Dialog */}
      <FormDialog
        open={formDialog.open}
        title={formDialog.isEditing ? 'Редагувати клієнта' : 'Додати клієнта'}
        onClose={formDialog.closeDialog}
        onSubmit={handleSubmit}
        loading={createClient.isPending || updateClient.isPending}
        submitLabel={formDialog.isEditing ? 'Зберегти' : 'Створити'}
      >
        <TextField
          label="ПІБ *"
          value={formDialog.formData.fullName || ''}
          onChange={(e) => formDialog.updateFormData({ fullName: e.target.value } as Partial<Client>)}
          fullWidth
          required
        />
        <TextField
          label="Телефон *"
          value={formDialog.formData.phone || ''}
          onChange={(e) => formDialog.updateFormData({ phone: e.target.value } as Partial<Client>)}
          fullWidth
          required
          placeholder="+380501234567"
        />
        <TextField
          label="Email"
          type="email"
          value={formDialog.formData.email || ''}
          onChange={(e) => formDialog.updateFormData({ email: e.target.value } as Partial<Client>)}
          fullWidth
          placeholder="example@email.com"
        />
        <TextField
          label="Адреса *"
          value={formDialog.formData.address || ''}
          onChange={(e) => formDialog.updateFormData({ address: e.target.value } as Partial<Client>)}
          fullWidth
          required
          multiline
          rows={2}
          placeholder="вул. Хрещатик, 1, кв. 10, м. Київ"
        />
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цього клієнта? Цю дію неможливо скасувати."
        onConfirm={deleteConfirm.handleDeleteConfirm}
        onCancel={deleteConfirm.closeDeleteDialog}
        confirmText="Видалити"
        confirmColor="error"
      />
    </PageContainer>
  );
};

export default ClientsPage;


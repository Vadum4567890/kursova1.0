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
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../hooks/queries/useCustomers';
import {
  PageAsyncSection,
  SearchBar,
  PageHeader,
  FormDialog,
  ConfirmDialog,
  PageContainer,
} from '../components/common';
import { useFormDialog } from '../hooks/useFormDialog';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { formatDate } from '../utils/dateHelpers';

const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data: customers = [], isLoading: loading, error: customersError } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const { error, handleError, clearError } = useErrorHandler();
  const displayError = error || customersError?.message;

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
      if (id === undefined || id === null || id === '') return;
      await deleteCustomer.mutateAsync(id);
      clearError();
    },
    onError: handleError,
  });

  const handleSubmit = async () => {
    try {
      clearError();

      if (formDialog.isEditing && formDialog.editingItem) {
        await updateCustomer.mutateAsync({
          id: formDialog.editingItem.id,
          data: formDialog.formData,
        });
      } else {
        await createCustomer.mutateAsync(formDialog.formData);
      }

      formDialog.handleSuccess();
    } catch (err: any) {
      handleError(err, 'Помилка збереження');
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const query = searchTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.fullName.toLowerCase().includes(query) ||
        customer.phone.includes(searchTerm) ||
        (customer.address && customer.address.toLowerCase().includes(query))
    );
  }, [customers, searchTerm]);

  return (
    <PageContainer>
      <PageHeader
        title="Орендарі"
        action={{
          label: 'Додати профіль',
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

      <PageAsyncSection error={displayError} onCloseError={clearError} loading={loading}>
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
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.fullName}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>{customer.address || 'Не вказано'}</TableCell>
                  <TableCell>{formatDate(customer.registrationDate)}</TableCell>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => formDialog.openDialog(customer)}>
                        <Edit />
                      </IconButton>
                      {user?.role === 'admin' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteConfirm.handleDeleteClick(customer.id, 'client')}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageAsyncSection>

      <FormDialog
        open={formDialog.open}
        title={formDialog.isEditing ? 'Редагувати профіль орендаря' : 'Додати профіль орендаря'}
        onClose={formDialog.closeDialog}
        onSubmit={handleSubmit}
        loading={createCustomer.isPending || updateCustomer.isPending}
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
        />
        <TextField
          label="Email"
          type="email"
          value={formDialog.formData.email || ''}
          onChange={(e) => formDialog.updateFormData({ email: e.target.value } as Partial<Client>)}
          fullWidth
        />
        <TextField
          label="Адреса *"
          value={formDialog.formData.address || ''}
          onChange={(e) => formDialog.updateFormData({ address: e.target.value } as Partial<Client>)}
          fullWidth
          required
          multiline
          rows={2}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цей профіль орендаря? Цю дію неможливо скасувати."
        onConfirm={deleteConfirm.handleDeleteConfirm}
        onCancel={deleteConfirm.closeDeleteDialog}
        confirmText="Видалити"
        confirmColor="error"
      />
    </PageContainer>
  );
};

export default CustomersPage;

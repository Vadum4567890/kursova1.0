import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Client } from '../services/clientService';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/queries/useClients';
import { useUIStore } from '../stores';

const ClientsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
  });
  const [error, setError] = useState('');
  
  // React Query hooks
  const { data: clients = [], isLoading: loading, error: clientsError } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  
  // Zustand store for delete dialog
  const { deleteDialogOpen, deleteDialogItemId, openDeleteDialog, closeDeleteDialog } = useUIStore();
  
  // Combine errors
  const displayError = error || clientsError?.message;

  const handleDeleteClick = (id: number) => {
    openDeleteDialog(id, 'client');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialogItemId) return;
    try {
      await deleteClient.mutateAsync(deleteDialogItemId);
      setError('');
      closeDeleteDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка видалення');
      closeDeleteDialog();
    }
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        fullName: client.fullName,
        phone: client.phone,
        email: client.email || '',
        address: client.address,
      });
    } else {
      setEditingClient(null);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        address: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      address: '',
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, data: formData });
      } else {
        await createClient.mutateAsync(formData);
      }
      
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка збереження');
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Клієнти
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Додати клієнта
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Пошук за ім'ям, телефоном або адресою..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {displayError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {displayError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
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
                    {new Date(client.registrationDate).toLocaleDateString('uk-UA')}
                  </TableCell>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(client)}
                      >
                        <Edit />
                      </IconButton>
                      {user?.role === 'admin' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(client.id)}
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClient ? 'Редагувати клієнта' : 'Додати клієнта'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="ПІБ *"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Телефон *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
              required
              placeholder="+380501234567"
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              placeholder="example@email.com"
            />
            <TextField
              label="Адреса *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              required
              multiline
              rows={2}
              placeholder="вул. Хрещатик, 1, кв. 10, м. Київ"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Скасувати</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={createClient.isPending || updateClient.isPending}>
            {(createClient.isPending || updateClient.isPending) ? <CircularProgress size={20} /> : editingClient ? 'Зберегти' : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          Підтвердження видалення
        </DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити цього клієнта? Цю дію неможливо скасувати.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog}>
            Скасувати
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleteClient.isPending}>
            {deleteClient.isPending ? <CircularProgress size={20} /> : 'Видалити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClientsPage;


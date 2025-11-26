import React, { useState, useMemo } from 'react';
import { PersonAdd } from '@mui/icons-material';
import { User } from '../../interfaces';
import { useUsers } from '../../hooks/queries/useUsers';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useFormDialog } from '../../hooks/useFormDialog';
import { useDeleteConfirm } from '../../hooks/useDeleteConfirm';
import { PageHeader, LoadingSpinner, ErrorAlert, ConfirmDialog, PageContainer } from '../../components/common';
import { UsersTable, RoleUpdateDialog, CreateUserDialog, RoleTabs } from '../../components/admin';

const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Get role based on tab
  const role = useMemo(() => {
    if (tabValue === 0) return undefined;
    return ['admin', 'manager', 'employee', 'user'][tabValue - 1];
  }, [tabValue]);

  // React Query hooks
  const { data: users = [], isLoading: loadingUsers, error: usersError } = useUsers(role);

  // User management hook
  const userManagement = useUserManagement({
    onSuccess: () => {
      setCreateDialogOpen(false);
    },
  });

  // Form dialogs
  const roleDialog = useFormDialog<{ role: string }>({
    initialData: { role: '' },
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Delete confirmation
  const deleteConfirm = useDeleteConfirm({
    onConfirm: async (id) => {
      await userManagement.remove(id);
      userManagement.clearError();
    },
  });

  const loading = loadingUsers || userManagement.isPending;
  const error = usersError?.message || userManagement.error;

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    roleDialog.updateFormData({ role: user.role });
    setRoleDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await userManagement.updateRole(selectedUser.id, roleDialog.formData.role);
      setRoleDialogOpen(false);
      setSelectedUser(null);
      roleDialog.handleSuccess();
    } catch {
      // Error already handled by hook
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      await userManagement.updateStatus(id, !isActive);
    } catch {
      // Error already handled by hook
    }
  };

  const handleCreateUser = async (formData: any) => {
    try {
      await userManagement.create(formData);
    } catch {
      // Error already handled by hook
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Управління користувачами"
        action={{
          label: 'Додати користувача',
          icon: <PersonAdd />,
          onClick: () => setCreateDialogOpen(true),
        }}
      />

      <RoleTabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} />

      {error && <ErrorAlert message={error} onClose={() => userManagement.clearError()} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <UsersTable
          users={users}
          onEditRole={handleEditRole}
          onToggleStatus={handleToggleStatus}
          onDelete={deleteConfirm.handleDeleteClick}
        />
      )}

      <RoleUpdateDialog
        open={roleDialogOpen}
        currentRole={roleDialog.formData.role}
        onClose={() => {
          setRoleDialogOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleUpdateRole}
      />

      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цього користувача? Цю дію неможливо скасувати."
        onCancel={deleteConfirm.closeDeleteDialog}
        onConfirm={deleteConfirm.handleDeleteConfirm}
        confirmText="Видалити"
      />

      <CreateUserDialog
        open={createDialogOpen}
        loading={userManagement.isPending}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateUser}
      />
    </PageContainer>
  );
};

export default AdminPage;


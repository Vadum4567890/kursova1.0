import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';

interface RoleTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export const RoleTabs: React.FC<RoleTabsProps> = ({ value, onChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs value={value} onChange={onChange}>
        <Tab label="Всі користувачі" />
        <Tab label="Адміністратори" />
        <Tab label="Менеджери" />
        <Tab label="Співробітники" />
        <Tab label="Клієнти" />
      </Tabs>
    </Box>
  );
};


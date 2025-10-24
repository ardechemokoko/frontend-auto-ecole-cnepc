import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar - au-dessus du header */}
      <AppSidebar open={sidebarOpen} onToggle={handleToggleSidebar} />
      
      {/* Header fixe - s'arrête au début de la sidebar */}
      <AppHeader sidebarOpen={sidebarOpen} />
      
      <Box sx={{ display: 'flex', flex: 1, pt: { xs: 8, sm: 10 } }}>
        {/* Main content */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 1, sm: 2 },
            bgcolor: 'background.default',
            transition: 'all 0.3s ease-in-out',
            ml: { 
              xs: 0, // Pas de marge sur mobile car le sidebar est en overlay
              sm: sidebarOpen ? 32 : 8 // 32 = 240px (largeur du sidebar) / 8 (spacing unit)
            },
          }}
        >
          <Box sx={{ maxWidth: '7xl', mx: 'auto', bgcolor: 'background.default', minHeight: '100%' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;

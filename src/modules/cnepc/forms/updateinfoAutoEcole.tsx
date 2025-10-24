import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const PageUpdateAutoecole: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Modifier vos informations
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Page de modification des informations de l'auto-école en cours de développement...
        </Typography>
      </Paper>
    </Box>
  );
};

export default PageUpdateAutoecole;
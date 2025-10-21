import React from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button
} from '@mui/material';
import {
  School as SchoolIcon,
  PersonAdd as PersonAddIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import StudentsTable from '../tables/StudentsTable';

const ElevesInscritsPage: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom className="font-display">
        Élèves inscrits
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }} className="font-primary">
        Gestion des élèves déjà inscrits dans l'auto-école
      </Typography>
      
      <Container maxWidth="lg">
        
        
        <Box sx={{ mt: 4 }}>
          
          
          <StudentsTable />
        </Box>
      </Container>
    </Box>
  );
};

export default ElevesInscritsPage;

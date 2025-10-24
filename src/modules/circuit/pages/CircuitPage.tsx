import React from 'react';
import {
  Box,
  Typography,
  Container,
    Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CircuitTable from '../components/CircuitTable';
// import StudentsTable from '../tables/StudentsTable';

const CircuitPage: React.FC = () => {
    
    function handleOpenDialog(): void {
        throw new Error('Function not implemented.');
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Gestion des circuits
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Créer et gérer les circuits
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ height: 40 }}
                    >
                    Nouveau circuit
                </Button>
            </Box>
        
            <Container maxWidth="lg">
                
                
                <Box sx={{ mt: 4 }}>
                
                
                        {/* <StudentsTable /> */}
                        <CircuitTable />
                </Box>
            </Container>
        </Box>
    );
};

export default CircuitPage;

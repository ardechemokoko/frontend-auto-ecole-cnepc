import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Checkbox,
    FormGroup,
    FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CircuitTable from '../components/CircuitTable';
import { Circuit, CircuitFormData } from '../types';
// import StudentsTable from '../tables/StudentsTable';

const CircuitPage: React.FC = () => {

    const [openDialog, setOpenDialog] = useState(false);
    const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
    const [formData, setFormData] = useState<CircuitFormData>({
        nom: '',
        description: '',
        actif: true,
        entite_type: ''
     });
    
    const handleOpenDialog = (circuit?: Circuit) => {
        if (circuit) {
          setEditingCircuit(circuit);
          setFormData({
            nom: circuit.nom,
            description: circuit.description,
            actif: circuit.actif,
            entite_type: circuit.entite_type
          });
        } else {
          setEditingCircuit(null);
          setFormData({
            nom: "",
            description: "",
            actif: true,
            entite_type: ""
          });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCircuit(null);
        setFormData({
            nom: '',
            description: '',
            actif: true,
            entite_type: ''
        });
    };

    const handleSubmit = async () => {
        // try {
        //   if (editingCircuit) {
        //     await updateOperator(editingOperator.id, formData);
        //   } else {
        //     await createOperator(formData);
        //   }
        //   await loadOperators();
        //   handleCloseDialog();
        // } catch (err) {
        //   setError('Erreur lors de la sauvegarde');
        // }
    };

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

            {/* Dialog pour créer/modifier un opérateur */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingCircuit ? 'Modifier le circuit' : 'Nouveau circuit'}
                </DialogTitle>
            
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Nom"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="L'entité"
                            value={formData.entite_type}
                            onChange={(e) => {
                                // Récupère la valeur saisie
                                let value = e.target.value.toUpperCase()

                                // Supprime les espaces
                                value = value.replace(/\s+/g, '')

                                // Supprime tous les caractères non autorisés (garde lettres, chiffres, _ et -)
                                value = value.replace(/[^A-Z0-9_-]/g, '')

                                setFormData({ ...formData, entite_type: value })
                            }}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            margin="normal"
                            multiline
                            rows={4}
                        />
                        
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.actif}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setFormData({ ...formData, actif: e.target.checked })
                                        }
                                    />
                                }
                                label="Activé ?"
                            />
                        </FormGroup>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingCircuit ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CircuitPage;

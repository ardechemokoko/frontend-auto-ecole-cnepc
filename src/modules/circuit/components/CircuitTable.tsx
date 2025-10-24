import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button
} from '@mui/material';
// Heroicons imports
import { EyeIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Circuit } from '../types/circuit';
import { circuitService } from '../services/circuit.service';

interface CircuitTableProps {
  onCircuitSelect?: (circuit: Circuit) => void;
  refreshTrigger?: number; // Pour forcer le rafraîchissement
}

const CircuitTable: React.FC<CircuitTableProps> = ({ onCircuitSelect, refreshTrigger }) => {
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [loading, setLoading] = useState(true);
    
    //   const [filtres, setFiltres] = useState<FiltresDemandes>({});
    //   const [recherche, setRecherche] = useState('');

    useEffect(() => {
        getAll();
    }, [
        // filtres,
        refreshTrigger
    ]);

    const getAll = async () => {
        
        setLoading(true);
        circuitService.getAll().then((data) => {
            setCircuits(data);
        }).catch((error) => {
            console.error('Erreur lors du chargement des circuits:', error);
        }).finally(() => {
            setLoading(false);
        });

    };

    const showDetails = async (circuit: Circuit) => {
        
        // setLoading(true);
        // circuitService.getAll().then((data) => {
        //     setCircuits(data);
        // }).catch((error) => {
        //     console.error('Erreur lors du chargement des circuits:', error);
        // }).finally(() => {
        //     setLoading(false);
        // });
        console.log(circuit);
        

    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>Chargement des circuits...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            
            {/* Filtres et actions */}
            {/* <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                placeholder="Rechercher..."
                value={recherche}
                onChange={handleRecherche}
                InputProps={{
                    startAdornment: <MagnifyingGlassIcon className="w-5 h-5 mr-1 text-gray-400" />
                }}
                sx={{ minWidth: 200 }}
                />
                
                <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                    value={filtres.statut || ''}
                    onChange={(e) => handleFiltreStatut(e.target.value)}
                    label="Statut"
                >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="en_attente">En attente</MenuItem>
                    <MenuItem value="en_cours">En cours</MenuItem>
                    <MenuItem value="validee">Validée</MenuItem>
                    <MenuItem value="rejetee">Rejetée</MenuItem>
                </Select>
                </FormControl>

                
            </Box> */}

            {/* Tableau des demandes */}
            <TableContainer component={Paper}>
                <Table>
                <TableHead>
                    <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {circuits.map((circuit) => (
                    <TableRow key={circuit.id}>
                        <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                                {circuit.nom}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                                {circuit.description}    
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                                {circuit.description}    
                            </Typography>
                        </TableCell>    
                        <TableCell>
                            <IconButton
                                size="small"
                                onClick={() => showDetails(circuit)}
                                color="primary"
                            >
                                <EyeIcon className="w-4 h-4" />
                            </IconButton>
                            <IconButton size="small" color="secondary">
                                <PencilIcon className="w-4 h-4" />
                            </IconButton>
                            <IconButton size="small" color="error">
                                <TrashIcon className="w-4 h-4" />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </TableContainer>

        </Box>
    );
};

export default CircuitTable;

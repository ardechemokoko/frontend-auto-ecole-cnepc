
import React, { FormEvent, useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Button
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Delete
} from '@mui/icons-material';
import { Referentiel, ReferentielFormulaire } from '../../../shared/model/referentiel';
import { referentielService } from '../../auth/services/referentiel.services';

import {

  Card,
  CardContent,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,

  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,

  Divider
} from '@mui/material';




const PageReferenciel: React.FC = () => {
  const [referentiels, setReferentiels] = useState<Referentiel[]>([]);
  const [statut, setStatut] = useState<boolean>(true);
   const [update, setUpdate] = useState<boolean>(true);
  const [errors, setErrors] = useState<Partial<ReferentielFormulaire>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<ReferentielFormulaire>({ code: '', libelle: '', statut: true, type_ref: '', description: '' });
  useEffect(() => {
    getReferentiel();
  });

  const getReferentiel = async () => {
    try {
      const res = await referentielService.getReferentiels();

      // On vérifie que res contient bien un tableau
      if (Array.isArray(res)) {
        setReferentiels(res);
      } else if (Array.isArray(res)) {
        setReferentiels(res);
      } else {
        console.warn("Format de données inattendu :", res);
        setReferentiels([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des référentiels :", error);

      // Gestion fine de l'erreur (ex: 404, 500)
      // if (error.response) {
      //   console.error("Statut HTTP :", error.response.status);
      //   console.error("Détails :", error.response.data);
      // }

      setReferentiels([]); // on vide la liste en cas d’erreur
    }
  };
  function onViewreferentiel(referentiel: Referentiel): void {
    setFormData({ code: referentiel.code, libelle: referentiel.libelle, statut: true, type_ref: referentiel.type_ref, description: referentiel.description })
    showFormulaire();

    setUpdate(true)
  }

  function showFormulaire(): void {
    setStatut((prev) => !prev);
  
  }

  const creationDeRef = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await referentielService.saveReferentiels({
        libelle: formData.libelle,
        code: formData.code,
        type_ref: formData.type_ref,
        description: formData.description,
        statut: true,
      })
      if (res) {
        // showFormulaire()
        getReferentiel();
        setFormData({ code: '', libelle: '', statut: true, type_ref: '', description: '' })
        setMessage({ type: 'success', text: 'Sauvegarde réussie !' });

        setTimeout(() => {
          showFormulaire()
        }, 100);
      }

    } catch (e) {
      console.log(e)
    }
  }

  const handleInputChange = (field: keyof ReferentielFormulaire) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  function ondeleteferentiel(referentiel: Referentiel): void {
    try {
      referentielService.deleteReferentiels(referentiel);
      setMessage({ type: 'success', text: 'Suppression réussie !' });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <><Box>
      <Button
        onClick={showFormulaire}
      >
        <AddIcon></AddIcon>
      </Button>
    </Box>
      <br />
      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}
      {statut ? <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Libelle</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Type de Referentiel</TableCell>
              <TableCell>Description</TableCell>

              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(referentiels) && referentiels.length > 0 ? (
              referentiels.map((referentiel) => (
                <TableRow key={referentiel.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" className="font-primary">
                          {referentiel.libelle}
                        </Typography>

                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SchoolIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" className="font-primary">
                        {referentiel.code}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" className="font-primary">
                        {referentiel.type_ref}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon sx={{ mr: 0.5, fontSize: 14, color: 'primary.main' }} />
                        <Typography variant="body2" className="font-primary">
                          {referentiel.description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon sx={{ mr: 0.5, fontSize: 14, color: 'success.main' }} />
                        <Typography variant="body2" className="font-primary">
                          {referentiel.statut}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>


                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Voir le referentiel">
                        <IconButton
                          size="small"
                          onClick={() => ondeleteferentiel(referentiel)}
                          color="primary"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Gérer le referentiel">
                        <IconButton
                          size="small"
                          onClick={() => onViewreferentiel(referentiel)}
                          color="secondary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary" className="font-primary">
                      Aucun referentiel complété trouvé
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer> : <Card>
        <CardContent>
          {message && (
            <Alert
              severity={message.type}
              sx={{ mb: 2 }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}
          <form onSubmit={creationDeRef}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
              <TextField
                label="Libelle"
                type="text"
                onChange={handleInputChange('libelle')}
                fullWidth
                value={formData.libelle}
                size={window.innerWidth < 600 ? 'small' : 'medium'}

              />

              <TextField
                label="Code de reference"
                type="text"
                onChange={handleInputChange('code')}
                fullWidth
                value={formData.code}
                size={window.innerWidth < 600 ? 'small' : 'medium'}
              />
              <TextField
                label="Type de Referentiel"
                type="text"
                fullWidth
                value={formData.type_ref}
                onChange={handleInputChange('type_ref')}
                size={window.innerWidth < 600 ? 'small' : 'medium'}
              />
              <TextField
                label="Description"
                type="text"
                fullWidth
                onChange={handleInputChange('description')}
                value={formData.description}
                size={window.innerWidth < 600 ? 'small' : 'medium'}
              />
              {/* <TextField
                label="Statut"
                type="radio"
                onChange={handleInputChange('statut')}
                fullWidth
                value={formData.statut}
                size={window.innerWidth < 600 ? 'small' : 'medium'}
              /> */}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size={window.innerWidth < 600 ? 'medium' : 'large'}

                sx={{
                  mt: { xs: 1.5, sm: 2 },
                  backgroundColor: '#50C786',
                  '&:hover': { backgroundColor: '#40B676' },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  py: { xs: 1.5, sm: 2 }
                }}
              >
            {  update ? "Modifier Referentiel":"Creation de Referentiel"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>} </>);
}
export default PageReferenciel;

function setErrors(arg0: (prev: any) => any) {
  throw new Error('Function not implemented.');
}

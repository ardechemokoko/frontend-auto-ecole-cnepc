import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Paper,
  Alert,
  CircularProgress,
  DialogContentText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { Circuit } from '../types/circuit'
import { circuitService } from '../services/circuit.service'
import { typePermisService } from '../services/type-permis.service'
import CircuitTable from '../components/CircuitTable'
import { Referentiel } from '../../../shared/model/referentiel'

const CircuitPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null)
  const [formData, setFormData] = useState<Partial<Circuit>>({
    libelle: '',
    description: '',
    actif: true,
    nom_entite: '',
    type_permis: '',
    etranger: ''
  })
  const [circuits, setCircuits] = useState<Circuit[]>([])
  const [typePermis, setTypePermis] = useState<Referentiel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // === Charger la liste ===
  const fetchCircuits = async () => {
    setError(null);
    try {
      setLoading(true)
      const data = await circuitService.getAll()
      setCircuits(data)
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors du chargement des circuits')
    } finally {
      setLoading(false)
    }
  }

  // === Charger la liste des types de permis===
  const fetchTypePermis = async () => {
    try {
      const res = await typePermisService.getAll({
        type_ref: "TYPE_PERMIS"
      })
      setTypePermis(res?.data)
      console.log(typePermis);
      
    } catch (err: any) {
      console.log(err);
    } finally {
      setTypePermis([]);
    }
  }

  useEffect(() => {
    fetchCircuits();
    fetchTypePermis();
  }, [])

  // === Ouvrir / fermer le dialog ===
  const handleOpenDialog = (circuit?: Circuit) => {
    if (circuit) {
      setEditingCircuit(circuit)
      setFormData({
        libelle: circuit.libelle,
        description: circuit.description,
        actif: circuit.actif,
        nom_entite: circuit.nom_entite,
        type_permis: circuit?.type_permis,
        etranger: circuit?.etranger
      })
    } else {
      setEditingCircuit(null)
      setFormData({
        libelle: '',
        description: '',
        actif: true,
        nom_entite: '',
        type_permis: '',
        etranger: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingCircuit(null)
    setFormData({
      libelle: '',
      description: '',
      actif: true,
      nom_entite: '',
      type_permis: '',
      etranger: ''
    })
  }

  // === Soumission du formulaire ===
  const handleSubmit = async () => {
    try {
      if (editingCircuit) {
        await circuitService.update(editingCircuit.id, formData)
      } else {
        await circuitService.create(formData)
      }
      await fetchCircuits()
      handleCloseDialog()
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors de la sauvegarde du circuit')
    }
  }

  // === Suppression ===
  const handleDelete = async (id: string) => {
    setSelectedId(id);
    setOpen(true);
  }

  const confirmDelete = async () => {
    try {
      await circuitService.remove(selectedId as string)
      setCircuits((prev) => prev.filter((c) => c.id !== selectedId))
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors de la sauvegarde du circuit')
    } finally {
      setOpen(false);
      setSelectedId(null);
    }
  }

  function handleClose(): void {
    setOpen(false);
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Gestion des circuits
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Créer et gérer les circuits de workflow
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

      {/* CONTENU PRINCIPAL */}
      <Paper>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        {!loading && (
            <CircuitTable
            data={circuits}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            refreshTrigger={circuits.length}
          />
        )}
      </Paper>

      {/* DIALOG FORM */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCircuit ? 'Modifier le circuit' : 'Nouveau circuit'}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nom"
              value={formData.libelle ?? ''}
              onChange={(e) => {
                let value = e.target.value
                // Met la première lettre en majuscule, le reste reste tel quel
                value = value.charAt(0).toUpperCase() + value.slice(1)
                setFormData({ ...formData, libelle: value })
              }}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Entité concernée"
              value={formData.nom_entite ?? ''}
              onChange={(e) => {
                let value = e.target.value.toUpperCase()
                value = value.replace(/\s+/g, '')
                value = value.replace(/[^A-Z0-9_-]/g, '')
                setFormData({ ...formData, nom_entite: value })
              }}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
            />

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.actif ?? false}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, actif: e.target.checked })
                    }
                  />
                }
                label="Actif ?"
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

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Suppression de l'élément?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Etes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">Annuler</Button>
          <Button autoFocus color="primary" onClick={confirmDelete}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    
  )
}

export default CircuitPage

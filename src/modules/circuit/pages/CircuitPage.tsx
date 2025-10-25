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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { Circuit } from '../types/circuit'
import { circuitService } from '../services/circuit.service'
import CircuitTable from '../components/CircuitTable'

const CircuitPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null)
  const [formData, setFormData] = useState<Partial<Circuit>>({
    nom: '',
    description: '',
    actif: true,
    entite_type: '',
  })
  const [circuits, setCircuits] = useState<Circuit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // === Charger la liste ===
  const fetchCircuits = async () => {
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

  useEffect(() => {
    fetchCircuits()
  }, [])

  // === Ouvrir / fermer le dialog ===
  const handleOpenDialog = (circuit?: Circuit) => {
    if (circuit) {
      setEditingCircuit(circuit)
      setFormData({
        nom: circuit.nom,
        description: circuit.description,
        actif: circuit.actif,
        entite_type: circuit.entite_type,
      })
    } else {
      setEditingCircuit(null)
      setFormData({
        nom: '',
        description: '',
        actif: true,
        entite_type: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingCircuit(null)
    setFormData({
      nom: '',
      description: '',
      actif: true,
      entite_type: '',
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
    if (!confirm('Supprimer ce circuit ?')) return
    try {
      await circuitService.remove(id)
      setCircuits((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
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
              value={formData.nom ?? ''}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Entité concernée"
              value={formData.entite_type ?? ''}
              onChange={(e) => {
                let value = e.target.value.toUpperCase()
                value = value.replace(/\s+/g, '')
                value = value.replace(/[^A-Z0-9_-]/g, '')
                setFormData({ ...formData, entite_type: value })
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
    </Box>
  )
}

export default CircuitPage

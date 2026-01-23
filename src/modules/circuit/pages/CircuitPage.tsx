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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { Circuit } from '../types/circuit'
import { circuitService } from '../services/circuit.service'
import { typePermisService } from '../services/type-permis.service'
import { typeDemandeService } from '../../cnepc/services'
import { TypeDemande } from '../../cnepc/types/type-demande'
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
    nationalite: ''
  })
  const [circuits, setCircuits] = useState<Circuit[]>([])
  const [typePermis, setTypePermis] = useState<Referentiel[]>([])
  const [typeDemandes, setTypeDemandes] = useState<TypeDemande[]>([])
  const [loadingTypeDemandes, setLoadingTypeDemandes] = useState(false)
  const [selectedTypeDemandeId, setSelectedTypeDemandeId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [etrangerValues, setEtrangerValues] = useState<string[]>([])

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
        type_ref: "type_permis"
      })
      // Gérer différents formats de réponse
      if (Array.isArray(res)) {
        setTypePermis(res)
      } else if (res && typeof res === 'object' && 'data' in res) {
        const resWithData = res as { data: Referentiel[] }
        if (Array.isArray(resWithData.data)) {
          setTypePermis(resWithData.data)
        } else {
          setTypePermis([])
        }
      } else {
        setTypePermis([])
      }
    } catch (err: any) {
      console.log(err);
      setTypePermis([]);
    } finally {
      // setTypePermis([]);
    }
  }

  // === Charger la liste des types de demande===
  const fetchTypeDemandes = async () => {
    setLoadingTypeDemandes(true)
    try {
      const response = await typeDemandeService.getTypeDemandes(1, 1000)
      setTypeDemandes(response.data || [])
    } catch (err: any) {
      console.error('Erreur lors du chargement des types de demande:', err)
      setTypeDemandes([])
    } finally {
      setLoadingTypeDemandes(false)
    }
  }

  useEffect(() => {
    fetchCircuits();
    fetchTypePermis();
    fetchTypeDemandes();
    setEtrangerValues([
      "",
      "OUI",
      "NON"
    ])
  }, [])

  // === Ouvrir / fermer le dialog ===
  const handleOpenDialog = async (circuit?: Circuit) => {
    // S'assurer que les types de demande sont chargés avant d'ouvrir le dialog
    if (typeDemandes.length === 0 && !loadingTypeDemandes) {
      await fetchTypeDemandes()
    }
    
    if (circuit) {
      setEditingCircuit(circuit)
      // Trouver le type de demande correspondant au nom_entite
      // Le nom_entite peut être en majuscules sans espaces, donc on compare de manière flexible
      const circuitNomEntiteNormalized = circuit.nom_entite?.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9_-]/g, '') || ''
      const matchingTypeDemande = typeDemandes.find(td => {
        const tdNameNormalized = td.name.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9_-]/g, '')
        return tdNameNormalized === circuitNomEntiteNormalized || td.name === circuit.nom_entite || td.name.toUpperCase() === circuit.nom_entite
      })
      setSelectedTypeDemandeId(matchingTypeDemande?.id || '')
      setFormData({
        libelle: circuit.libelle,
        description: circuit.description,
        actif: circuit.actif,
        nom_entite: circuit.nom_entite,
        type_permis: circuit?.type_permis,
        nationalite: circuit?.nationalite
      })
    } else {
      setEditingCircuit(null)
      setSelectedTypeDemandeId('')
      setFormData({
        libelle: '',
        description: '',
        actif: true,
        nom_entite: '',
        type_permis: '',
        nationalite: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingCircuit(null)
    setSelectedTypeDemandeId('')
    setFormData({
      libelle: '',
      description: '',
      actif: true,
      nom_entite: '',
      type_permis: '',
      nationalite: ''
    })
  }

  // === Gérer la sélection d'un type de demande ===
  const handleTypeDemandeChange = (typeDemandeId: string) => {
    setSelectedTypeDemandeId(typeDemandeId)
    const selectedTypeDemande = typeDemandes.find(td => td.id === typeDemandeId)
    if (selectedTypeDemande) {
      // Utiliser le nom du type de demande tel quel pour remplir nom_entite
      // Le backend attend probablement le nom original, pas transformé
      setFormData({ ...formData, nom_entite: selectedTypeDemande.name })
    }
  }

  // === Soumission du formulaire ===
  const handleSubmit = async () => {
    try {
      setError(null)
      
      // Validation des champs requis
      if (!formData.libelle || formData.libelle.trim() === '') {
        setError('Le nom du circuit est requis')
        return
      }
      
      if (!formData.nom_entite || formData.nom_entite.trim() === '') {
        setError('L\'entité concernée est requise')
        return
      }
      
      // Utiliser le nom_entite tel quel (le backend attend probablement le nom du type de demande tel quel)
      const nomEntite = formData.nom_entite.trim()
      
      // Préparer le payload selon les paramètres attendus par l'API
      // Pour POST: l'API attend libelle
      // Pour PUT: l'API attend peut-être nom (même si la colonne en base s'appelle libelle)
      let payload: Record<string, any> = {}
      
      if (editingCircuit) {
        // Pour PUT: mapper libelle vers nom car le backend attend nom pour PUT
        payload = {
          libelle: formData.libelle.trim(),
          actif: formData.actif ?? true,
          nom_entite: nomEntite
        }
      } else {
        // Pour POST: utiliser libelle directement
        payload = {
          libelle: formData.libelle.trim(),
          actif: formData.actif ?? true,
          nom_entite: nomEntite
        }
      }
      
      // Ajouter nationalite seulement si elle a une valeur
      if (formData.nationalite && formData.nationalite.trim() !== '') {
        payload.nationalite = formData.nationalite.trim()
      }
      
      // Ajouter type_permis seulement s'il a une valeur
      if (formData.type_permis && formData.type_permis.trim() !== '') {
        payload.type_permis = formData.type_permis.trim()
      }
      
      console.log('📤 Payload de mise à jour du circuit:', payload)
      console.log('📤 ID du circuit à modifier:', editingCircuit?.id)
      
      if (editingCircuit) {
        // Utiliser PUT pour la mise à jour - le payload contient nom (mappé depuis libelle)
        const result = await circuitService.update(editingCircuit.id, payload)
        console.log('✅ Circuit mis à jour:', result)
      } else {
        await circuitService.create(payload)
      }
      await fetchCircuits()
      handleCloseDialog()
    } catch (err: any) {
      console.error('❌ Erreur lors de la sauvegarde du circuit:', err)
      console.error('❌ Détails de l\'erreur:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      
      // Afficher un message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la sauvegarde du circuit'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      // Ajouter les erreurs de validation si présentes
      if (err.response?.data?.errors) {
        const validationErrors = Object.entries(err.response.data.errors)
          .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ')
        errorMessage += ` - ${validationErrors}`
      }
      
      setError(errorMessage)
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
            <FormControl fullWidth margin="normal">
              <InputLabel>Type de demande (Entité concernée)</InputLabel>
              <Select
                value={selectedTypeDemandeId}
                label="Type de demande (Entité concernée)"
                onChange={(e) => handleTypeDemandeChange(e.target.value as string)}
                disabled={loadingTypeDemandes}
              >
                {loadingTypeDemandes ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">Chargement...</Typography>
                    </Box>
                  </MenuItem>
                ) : typeDemandes.length > 0 ? (
                  typeDemandes.map((typeDemande) => (
                    <MenuItem key={typeDemande.id} value={typeDemande.id}>
                      {typeDemande.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>Aucun type de demande disponible</MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Type de permis</InputLabel>
              <Select
                value={formData.type_permis ?? ''}
                label="Type de permis"
                onChange={(e) =>
                  setFormData({ ...formData, type_permis: e.target.value as string })
                }
              >
                {Array.isArray(typePermis) && typePermis.length > 0 ? (
                  typePermis.map((item) => (
                    <MenuItem key={item.id} value={item.code}>
                      {item.libelle}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>Aucun type de permis disponible</MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Etranger ?</InputLabel>
              <Select
                value={formData.nationalite ?? ''}
                label="Etranger"
                onChange={(e) =>
                  setFormData({ ...formData, nationalite: e.target.value as string })
                }
              >
                {Array.isArray(etrangerValues) && etrangerValues.length > 0 ? (
                  etrangerValues.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>Aucune réponse disponible</MenuItem>
                )}
              </Select>
            </FormControl>
            
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

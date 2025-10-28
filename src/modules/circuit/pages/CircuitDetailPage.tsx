import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import { useParams, useNavigate } from 'react-router-dom'
import { Circuit } from '../types/circuit'
import { Etape } from '../types/etape'
import { Statut } from '../../statut/types/statut'
import { circuitService } from '../services/circuit.service'
import { etapeService } from '../services/etape.service'
import { statutService } from '../../statut/services/statut.service'
import { typeDocumentService } from '../services/type-document.service'
import { TypeDocument } from '../types'

const CircuitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [circuit, setCircuit] = useState<Circuit | null>(null)
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [statuts, setStatuts] = useState<Statut[]>([])
  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openAddEtape, setOpenAddEtape] = useState(false)
  const [formEtape, setFormEtape] = useState<Partial<Etape>>({
    code: '',
    libelle: '',
    ordre: 0,
    auto_advance: false,
    statut_id: '',
    exigences: [],
  })

  // === Charger circuit, étapes et statuts ===
  const fetchData = async () => {
    if (!id) {
      setError('Identifiant de circuit manquant.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [circuitData, etapesData, statutsData, typeDocuments] = await Promise.all([
        circuitService.getById(id),
        etapeService.getByCircuitId(id),
        statutService.getAll(),
        statutService.getAll(),
        typeDocumentService.getTypeDocuments(),
      ])
      setCircuit(circuitData)
      setEtapes(etapesData)
      setStatuts(statutsData?.data || statutsData)
      setTypeDocuments(typeDocuments)
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  // === Ajouter une étape ===
  const handleAddEtape = async () => {
    try {
      const payload = { ...formEtape, circuit_id: id }
      await etapeService.create(payload)
      setFormEtape({
        code: '',
        libelle: '',
        ordre: 0,
        auto_advance: false,
        statut_id: '',
        exigences: [],
      })
      setOpenAddEtape(false)
      await fetchData()
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors de l’ajout de l’étape')
    }
  }

  const handleDeleteEtape = async (etapeId: string) => {
    if (!confirm('Supprimer cette étape ?')) return
    try {
      await etapeService.remove(etapeId)
      await fetchData()
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors de la suppression')
    }
  }

  // === États de chargement et erreurs ===
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </Box>
    )
  }

  if (!circuit) {
    return (
      <Box p={3}>
        <Typography>Aucun circuit trouvé.</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </Box>
    )
  }

  // === Vue principale ===
  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Retour à la liste
      </Button>

      {/* === Informations du circuit === */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Détails du circuit
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Nom du circuit
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {circuit.nom || '—'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Entité concernée
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {circuit.nom_entite || '—'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Statut
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {circuit.actif ? '✅ Actif' : '❌ Inactif'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {circuit.description || 'Aucune description'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* === SECTION ÉTAPES === */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Étapes du circuit</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddEtape(true)}
          >
            Nouvelle étape
          </Button>
        </Box>

        {etapes.length === 0 ? (
          <Typography color="text.secondary">Aucune étape enregistrée.</Typography>
        ) : (
          <Box>
            {etapes.map((etape) => (
              <Paper
                key={etape.id}
                sx={{
                  p: 2,
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexDirection: 'column',
                }}
              >
                <Box width="100%">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {etape.libelle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Code : {etape.code} — Ordre : {etape.ordre}
                  </Typography>
                  <Typography variant="body2">
                    {etape.auto_advance ? '⏩ Passage automatique' : '🕹️ Manuel'}
                  </Typography>
                  {etape.statut && (
                    <Typography variant="body2" color="primary">
                      Statut associé : {etape.statut.libelle} ({etape.statut.code})
                    </Typography>
                  )}

                  {/* Exigences */}
                  {etape.exigences && etape.exigences.length > 0 && (
                    <Box mt={1}>
                      <Typography variant="subtitle2">Exigences :</Typography>
                      <ul>
                        {etape.exigences.map((ex, idx) => (
                          <li key={idx}>
                            {ex.piece_code} — {ex.origine || 'Inconnue'} —{' '}
                            {ex.obligatoire ? 'Obligatoire' : 'Optionnelle'} (min :{' '}
                            {ex.nombre_min})
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Box>

                <Box alignSelf="flex-end">
                  <Tooltip title="Supprimer">
                    <IconButton color="error" onClick={() => handleDeleteEtape(etape.id!)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* === DIALOG AJOUT ÉTAPE === */}
      <Dialog open={openAddEtape} onClose={() => setOpenAddEtape(false)} maxWidth="md" fullWidth>
        <DialogTitle>Ajouter une étape</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code"
                value={formEtape.code ?? ''}
                onChange={(e) =>
                  setFormEtape({ ...formEtape, code: e.target.value.toUpperCase() })
                }
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Libellé"
                value={formEtape.libelle ?? ''}
                onChange={(e) => {
                  let v = e.target.value
                  v = v.charAt(0).toUpperCase() + v.slice(1)
                  setFormEtape({ ...formEtape, libelle: v })
                }}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Ordre"
                value={formEtape.ordre ?? 0}
                onChange={(e) =>
                  setFormEtape({ ...formEtape, ordre: Number(e.target.value) })
                }
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Statut associé</InputLabel>
                <Select
                  value={formEtape.statut_id ?? ''}
                  label="Statut associé"
                  onChange={(e) =>
                    setFormEtape({ ...formEtape, statut_id: e.target.value as string })
                  }
                >
                  {Array.isArray(statuts) && statuts.length > 0 ? (
                    statuts.map((statut) => (
                      <MenuItem key={statut.id} value={statut.id}>
                        {statut.libelle}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Aucun statut disponible</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formEtape.auto_advance ?? false}
                    onChange={(e) =>
                      setFormEtape({ ...formEtape, auto_advance: e.target.checked })
                    }
                  />
                }
                label="Passage automatique ?"
              />
            </Grid>

            {/* === Section Exigences === */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Exigences de pièces justificatives
              </Typography>

              {(formEtape.exigences ?? []).map((exigence, index) => (
                <Grid
                  container
                  key={index}
                  spacing={2}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2,
                    mb: 1,
                    backgroundColor: '#fafafa',
                  }}
                >
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Code pièce"
                      value={exigence.piece_code ?? ''}
                      onChange={(e) => {
                        const newEx = [...(formEtape.exigences ?? [])]
                        newEx[index].piece_code = e.target.value.toUpperCase()
                        setFormEtape({ ...formEtape, exigences: newEx })
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Nombre minimum"
                      value={exigence.nombre_min ?? 0}
                      onChange={(e) => {
                        const newEx = [...(formEtape.exigences ?? [])]
                        newEx[index].nombre_min = Number(e.target.value)
                        setFormEtape({ ...formEtape, exigences: newEx })
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Origine"
                      value={exigence.origine ?? ''}
                      onChange={(e) => {
                        const newEx = [...(formEtape.exigences ?? [])]
                        newEx[index].origine = e.target.value
                        setFormEtape({ ...formEtape, exigences: newEx })
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={2} display="flex" alignItems="center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exigence.obligatoire ?? false}
                          onChange={(e) => {
                            const newEx = [...(formEtape.exigences ?? [])]
                            newEx[index].obligatoire = e.target.checked
                            setFormEtape({ ...formEtape, exigences: newEx })
                          }}
                        />
                      }
                      label="Obligatoire"
                    />
                  </Grid>

                  <Grid item xs={12} md={1} display="flex" alignItems="center">
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        const newEx = (formEtape.exigences ?? []).filter(
                          (_, i) => i !== index
                        )
                        setFormEtape({ ...formEtape, exigences: newEx })
                      }}
                    >
                      Suppr.
                    </Button>
                  </Grid>
                </Grid>
              ))}

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const newEx = {
                    piece_code: '',
                    obligatoire: false,
                    nombre_min: 0,
                    origine: '',
                  }
                  setFormEtape({
                    ...formEtape,
                    exigences: [...(formEtape.exigences ?? []), newEx],
                  })
                }}
              >
                + Ajouter une exigence
              </Button>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenAddEtape(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddEtape}>
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CircuitDetailPage

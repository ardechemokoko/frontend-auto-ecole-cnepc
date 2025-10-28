import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import {
  PersonAdd,
  School,
  ArrowBack,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import {
  AutoEcole,
  Formation,
  autoEcoleService,
} from '../services';
import { authService } from '../../auth/services/authService';

interface InscriptionFormationFormProps {
  open: boolean;
  autoEcole: AutoEcole;
  onSuccess: () => void;
  onCancel: () => void;
}

const InscriptionFormationForm: React.FC<InscriptionFormationFormProps> = ({
  open,
  autoEcole,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // États pour les données
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [candidatId, setCandidatId] = useState<string | null>(null);
  const [personneId, setPersonneId] = useState<string | null>(null);
  
  // États du formulaire - Étape 1 : Informations personnelles
  const [personneData, setPersonneData] = useState({
    nom: '',
    prenom: '',
    email: '',
    contact: '',
    adresse: '',
    password: '',
    password_confirmation: '',
  });

  // États du formulaire - Étape 2 : Informations du candidat
  const [candidatData, setCandidatData] = useState({
    date_naissance: '',
    lieu_naissance: '',
    nip: '',
    type_piece: 'CNI',
    numero_piece: '',
    nationalite: 'Sénégalaise',
    genre: 'M',
  });

  // États du formulaire - Étape 3 : Formation
  const [formationData, setFormationData] = useState({
    formation_id: '',
    commentaires: '',
  });

  const steps = ['Informations personnelles', 'Informations du candidat', 'Choix de la formation'];

  // Charger les formations de l'auto-école
  const loadFormations = async () => {
    setLoadingFormations(true);
    try {
      const data = await autoEcoleService.getFormationsByAutoEcole(autoEcole.id);
      setFormations(data.filter(f => f.statut));
    } catch (err: any) {
      console.error('Erreur lors du chargement des formations:', err);
      setError('Impossible de charger les formations');
    } finally {
      setLoadingFormations(false);
    }
  };

  // Charger les formations au montage du composant
  useEffect(() => {
    if (open) {
      loadFormations();
      // Réinitialiser le formulaire
      setActiveStep(0);
      setCandidatId(null);
      setPersonneId(null);
      setPersonneData({
        nom: '',
        prenom: '',
        email: '',
        contact: '',
        adresse: '',
        password: '',
        password_confirmation: '',
      });
      setCandidatData({
        date_naissance: '',
        lieu_naissance: '',
        nip: '',
        type_piece: 'CNI',
        numero_piece: '',
        nationalite: 'Sénégalaise',
        genre: 'M',
      });
      setFormationData({
        formation_id: '',
        commentaires: '',
      });
      setError(null);
      setSuccess(null);
    }
  }, [open, autoEcole.id]);

  // Validation de l'étape 1
  const validateStep1 = () => {
    if (!personneData.nom || !personneData.prenom || !personneData.email || !personneData.contact || !personneData.password || !personneData.password_confirmation) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personneData.email)) {
      setError('Veuillez entrer un email valide');
      return false;
    }
    if (personneData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (personneData.password !== personneData.password_confirmation) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  // Validation de l'étape 2
  const validateStep2 = () => {
    if (!candidatData.date_naissance || !candidatData.lieu_naissance || !candidatData.nip || !candidatData.numero_piece) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    return true;
  };

  // Validation de l'étape 3
  const validateStep3 = () => {
    if (!formationData.formation_id) {
      setError('Veuillez sélectionner une formation');
      return false;
    }
    return true;
  };

  // Passer à l'étape suivante
  const handleNext = async () => {
    setError(null);

    if (activeStep === 0) {
      // Étape 1 : Valider les informations personnelles et enregistrer l'utilisateur
      if (!validateStep1()) return;
      
      setLoading(true);
      try {
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║  [FORMULAIRE] ÉTAPE 1 - ENREGISTREMENT UTILISATEUR         ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('📋 Données à enregistrer:');
        console.table({
          email: personneData.email,
          nom: personneData.nom,
          prenom: personneData.prenom,
          contact: personneData.contact,
          adresse: personneData.adresse,
          role: 'candidat',
        });
        console.log('═══════════════════════════════════════════════════════════════');
        
        // Enregistrer l'utilisateur avec le rôle "candidat"
        const registerResponse = await authService.register({
          email: personneData.email,
          password: personneData.password,
          password_confirmation: personneData.password_confirmation,
          nom: personneData.nom,
          prenom: personneData.prenom,
          contact: personneData.contact,
          adresse: personneData.adresse,
          role: 'candidat',
        });
        
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║  ✅ UTILISATEUR ENREGISTRÉ AVEC SUCCÈS !                    ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('📄 User ID:', registerResponse.user.id);
        console.log('📄 Personne ID:', registerResponse.user.personne?.id);
        console.log('📄 Email:', registerResponse.user.email);
        console.log('📄 Rôle:', registerResponse.user.role);
        console.log('═══════════════════════════════════════════════════════════════');
        
        // Récupérer le personne_id pour l'étape suivante
        if (registerResponse.user.personne?.id) {
          setPersonneId(registerResponse.user.personne.id);
          setActiveStep(1);
        } else {
          setError('Erreur: Impossible de récupérer l\'ID de la personne');
        }
      } catch (err: any) {
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.error('║  ❌ ERREUR LORS DE L\'ENREGISTREMENT                         ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        
        if (err.response?.data) {
          console.error('📋 Réponse de l\'API:', err.response.data);
          
          if (err.response.data.errors) {
            console.log('─────────────────────────────────────────────────────────────');
            console.error('🔍 CHAMPS AVEC ERREURS DE VALIDATION:');
            console.log('─────────────────────────────────────────────────────────────');
            
            let errorDetails = '';
            Object.entries(err.response.data.errors).forEach(([field, messages]: [string, any]) => {
              const messageList = Array.isArray(messages) ? messages : [messages];
              console.error(`❌ "${field}": ${messageList.join(', ')}`);
              errorDetails += `\n• ${field}: ${messageList.join(', ')}`;
            });
            
            setError(`Erreur de validation: ${errorDetails}`);
          } else {
            setError(err.response.data.message || 'Erreur lors de l\'enregistrement');
          }
        } else {
          console.error('❌ Erreur sans réponse API:', err.message);
          setError(err.message || 'Erreur lors de l\'enregistrement');
        }
        
        console.log('═══════════════════════════════════════════════════════════════');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // Étape 2 : Valider les informations du candidat et créer le candidat
      if (!validateStep2()) return;
      
      setLoading(true);
      try {
        if (!personneId) {
          setError('Erreur: ID de la personne manquant. Veuillez recommencer.');
          setLoading(false);
          return;
        }
        
        // Créer le candidat avec le personne_id récupéré à l'étape 1
        const numero_candidat = `CAN-${Date.now()}`;
        
        const candidatPayload = {
          personne_id: personneId,
          numero_candidat,
          date_naissance: candidatData.date_naissance,
          lieu_naissance: candidatData.lieu_naissance,
          nip: candidatData.nip,
          type_piece: candidatData.type_piece,
          numero_piece: candidatData.numero_piece,
          nationalite: candidatData.nationalite,
          genre: candidatData.genre,
        };
        
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║  [FORMULAIRE] ÉTAPE 2 - CRÉATION DU CANDIDAT                ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('📋 Personne ID récupéré:', personneId);
        console.log('📋 Données du candidat:');
        console.table(candidatData);
        console.log('📤 Payload complet qui sera envoyé à POST /candidats:');
        console.log(JSON.stringify(candidatPayload, null, 2));
        console.log('═══════════════════════════════════════════════════════════════');
        
        const response = await autoEcoleService.createCandidat(candidatPayload as any);
        
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║  ✅ CANDIDAT CRÉÉ AVEC SUCCÈS !                             ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('📄 Candidat ID:', response.data.id);
        console.log('📄 Personne ID:', response.data.personne_id);
        console.log('📄 Numéro candidat:', response.data.numero_candidat);
        console.log('═══════════════════════════════════════════════════════════════');
        
        setCandidatId(response.data.id);
        setActiveStep(2);
      } catch (err: any) {
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.error('║  ❌ ERREUR LORS DE LA CRÉATION DU CANDIDAT                  ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        
        if (err.response?.data) {
          console.error('📋 Réponse de l\'API:', err.response.data);
          
          if (err.response.data.errors) {
            console.log('─────────────────────────────────────────────────────────────');
            console.error('🔍 CHAMPS AVEC ERREURS DE VALIDATION:');
            console.log('─────────────────────────────────────────────────────────────');
            
            let errorDetails = '';
            Object.entries(err.response.data.errors).forEach(([field, messages]: [string, any]) => {
              const messageList = Array.isArray(messages) ? messages : [messages];
              console.error(`❌ "${field}": ${messageList.join(', ')}`);
              errorDetails += `\n• ${field}: ${messageList.join(', ')}`;
            });
            
            setError(`Erreur de validation: ${errorDetails}`);
          } else {
            setError(err.response.data.message || 'Erreur lors de la création du candidat');
          }
        } else {
          console.error('❌ Erreur sans réponse API:', err.message);
          setError(err.message || 'Erreur lors de la création du candidat');
        }
        
        console.log('═══════════════════════════════════════════════════════════════');
      } finally {
        setLoading(false);
      }
    }
  };

  // Revenir à l'étape précédente
  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Soumettre le formulaire complet
  const handleSubmit = async () => {
    if (!validateStep3()) return;
    
    if (!candidatId) {
      setError('Erreur: Candidat non créé');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Créer le dossier pour inscrire le candidat à la formation dans l'auto-école
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║  [FORMULAIRE] ÉTAPE 3 - CRÉATION DU DOSSIER                 ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      console.log('📋 Candidat ID:', candidatId);
      console.log('📋 Auto-École ID:', autoEcole.id);
      console.log('📋 Formation ID:', formationData.formation_id);
      console.log('📋 Commentaires:', formationData.commentaires || 'Aucun');
      console.log('═══════════════════════════════════════════════════════════════');
      
      const response = await autoEcoleService.createDossier({
        candidat_id: candidatId,
        auto_ecole_id: autoEcole.id,
        formation_id: formationData.formation_id,
        statut: 'en_attente',
        date_creation: today,
        commentaires: formationData.commentaires || undefined,
      });

      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║  ✅ DOSSIER CRÉÉ AVEC SUCCÈS !                              ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      console.log('📄 Dossier ID:', response.data.id);
      console.log('📄 Statut:', response.data.statut);
      console.log('📄 Date création:', response.data.date_creation);
      console.log('═══════════════════════════════════════════════════════════════');

      setSuccess(response.message || 'Inscription réussie ! Le dossier a été créé.');
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.error('║  ❌ ERREUR LORS DE LA CRÉATION DU DOSSIER                   ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      
      if (err.response?.data) {
        console.error('📋 Réponse de l\'API:', err.response.data);
        
        if (err.response.data.errors) {
          console.log('─────────────────────────────────────────────────────────────');
          console.error('🔍 CHAMPS AVEC ERREURS DE VALIDATION:');
          console.log('─────────────────────────────────────────────────────────────');
          
          let errorDetails = '';
          Object.entries(err.response.data.errors).forEach(([field, messages]: [string, any]) => {
            const messageList = Array.isArray(messages) ? messages : [messages];
            console.error(`❌ "${field}": ${messageList.join(', ')}`);
            errorDetails += `\n• ${field}: ${messageList.join(', ')}`;
          });
          
          setError(`Erreur de validation: ${errorDetails}`);
        } else {
          setError(err.response.data.message || 'Erreur lors de la création du dossier');
        }
      } else {
        console.error('❌ Erreur sans réponse API:', err.message);
        setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      }
      
      console.log('═══════════════════════════════════════════════════════════════');
    } finally {
      setLoading(false);
    }
  };

  // Obtenir le contenu de l'étape actuelle
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informations d'identité
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom"
                value={personneData.nom}
                onChange={(e) => setPersonneData({ ...personneData, nom: e.target.value })}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prénom"
                value={personneData.prenom}
                onChange={(e) => setPersonneData({ ...personneData, prenom: e.target.value })}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Coordonnées
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                value={personneData.email}
                onChange={(e) => setPersonneData({ ...personneData, email: e.target.value })}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Téléphone"
                value={personneData.contact}
                onChange={(e) => setPersonneData({ ...personneData, contact: e.target.value })}
                fullWidth
                required
                disabled={loading}
                placeholder="Ex: 0612345678"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Adresse"
                value={personneData.adresse}
                onChange={(e) => setPersonneData({ ...personneData, adresse: e.target.value })}
                fullWidth
                multiline
                rows={2}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Sécurité
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mot de passe"
                type="password"
                value={personneData.password}
                onChange={(e) => setPersonneData({ ...personneData, password: e.target.value })}
                fullWidth
                required
                disabled={loading}
                helperText="Minimum 8 caractères"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Confirmer le mot de passe"
                type="password"
                value={personneData.password_confirmation}
                onChange={(e) => setPersonneData({ ...personneData, password_confirmation: e.target.value })}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informations de naissance
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date de naissance"
                type="date"
                value={candidatData.date_naissance}
                onChange={(e) => setCandidatData({ ...candidatData, date_naissance: e.target.value })}
                fullWidth
                required
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Lieu de naissance"
                value={candidatData.lieu_naissance}
                onChange={(e) => setCandidatData({ ...candidatData, lieu_naissance: e.target.value })}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Identification
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="NIP (Numéro d'Identification Personnel)"
                value={candidatData.nip}
                onChange={(e) => setCandidatData({ ...candidatData, nip: e.target.value })}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type de pièce</InputLabel>
                <Select
                  value={candidatData.type_piece}
                  onChange={(e) => setCandidatData({ ...candidatData, type_piece: e.target.value })}
                  label="Type de pièce"
                  disabled={loading}
                >
                  <MenuItem value="CNI">Carte Nationale d'Identité</MenuItem>
                  <MenuItem value="Passeport">Passeport</MenuItem>
                  <MenuItem value="Permis_conduire">Permis de conduire</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Numéro de pièce"
                value={candidatData.numero_piece}
                onChange={(e) => setCandidatData({ ...candidatData, numero_piece: e.target.value })}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nationalité"
                value={candidatData.nationalite}
                onChange={(e) => setCandidatData({ ...candidatData, nationalite: e.target.value })}
                fullWidth
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={candidatData.genre}
                  onChange={(e) => setCandidatData({ ...candidatData, genre: e.target.value })}
                  label="Genre"
                  disabled={loading}
                >
                  <MenuItem value="M">Masculin</MenuItem>
                  <MenuItem value="F">Féminin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        const selectedFormation = formations.find(f => f.id === formationData.formation_id);
        return (
          <Box>
            <FormControl fullWidth required sx={{ mb: 3 }}>
              <InputLabel>Formation</InputLabel>
              <Select
                value={formationData.formation_id}
                onChange={(e) => setFormationData({ ...formationData, formation_id: e.target.value })}
                label="Formation"
                disabled={loadingFormations || loading}
              >
                {loadingFormations ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Chargement des formations...
                  </MenuItem>
                ) : formations.length === 0 ? (
                  <MenuItem disabled>
                    Aucune formation active disponible
                  </MenuItem>
                ) : (
                  formations.map((formation) => {
                    // Récupérer le libellé du type de permis de manière sûre
                    let typePermisLabel = 'N/A';
                    if (formation.typePermis) {
                      typePermisLabel = ('libelle' in formation.typePermis) 
                        ? formation.typePermis.libelle 
                        : ('nom' in formation.typePermis ? formation.typePermis.nom : 'N/A');
                    } else if (formation.type_permis) {
                      typePermisLabel = ('libelle' in formation.type_permis) 
                        ? formation.type_permis.libelle 
                        : ('nom' in formation.type_permis ? formation.type_permis.nom : 'N/A');
                    }
                    
                    return (
                      <MenuItem key={formation.id} value={formation.id}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <School fontSize="small" />
                            <Typography variant="body1" fontWeight="medium">
                              {formation.nom || `Formation ${typePermisLabel}`}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip 
                              label={typePermisLabel} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={formation.montant_formate || `${formation.montant} FCFA`} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                            {formation.session && (
                              <Chip 
                                label={formation.session.libelle} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>

            {selectedFormation && (() => {
              // Récupérer le libellé du type de permis de manière sûre
              let typePermisLabel = 'N/A';
              if (selectedFormation.typePermis) {
                typePermisLabel = ('libelle' in selectedFormation.typePermis) 
                  ? selectedFormation.typePermis.libelle 
                  : ('nom' in selectedFormation.typePermis ? selectedFormation.typePermis.nom : 'N/A');
              } else if (selectedFormation.type_permis) {
                typePermisLabel = ('libelle' in selectedFormation.type_permis) 
                  ? selectedFormation.type_permis.libelle 
                  : ('nom' in selectedFormation.type_permis ? selectedFormation.type_permis.nom : 'N/A');
              }
              
              return (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom fontWeight="bold">
                    Détails de la formation
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedFormation.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {selectedFormation.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Type de permis:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {typePermisLabel}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Montant:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {selectedFormation.montant_formate || `${selectedFormation.montant} FCFA`}
                      </Typography>
                    </Box>
                    {selectedFormation.session && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Session:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedFormation.session.libelle}
                        </Typography>
                      </Box>
                    )}
                    {selectedFormation.duree_jours && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Durée:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedFormation.duree_jours} jours
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })()}

            <TextField
              label="Commentaires (optionnel)"
              value={formationData.commentaires}
              onChange={(e) => setFormationData({ ...formationData, commentaires: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder="Ajoutez des notes ou commentaires concernant cette inscription..."
              disabled={loading}
            />
          </Box>
        );

      default:
        return 'Étape inconnue';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd color="primary" />
          <Typography variant="h6">
            Inscrire un nouveau candidat
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {autoEcole.nom_auto_ecole}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
            {success}
          </Alert>
        )}

        {/* Contenu de l'étape */}
        {getStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            startIcon={<ArrowBack />}
          >
            Précédent
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={loading}
            endIcon={loading ? <CircularProgress size={20} /> : <ArrowForward />}
          >
            {loading 
              ? (activeStep === 0 ? 'Enregistrement...' : 'Création du candidat...') 
              : (activeStep === 0 ? 'Créer le compte' : (activeStep === 1 ? 'Créer le candidat' : 'Suivant'))
            }
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || loadingFormations}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {loading ? 'Inscription en cours...' : 'Finaliser l\'inscription'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InscriptionFormationForm;

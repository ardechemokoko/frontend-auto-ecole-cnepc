import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Grid, TextField, FormControlLabel, RadioGroup, Radio, FormControl, FormLabel, CircularProgress, Button, Select, MenuItem, InputLabel, Divider } from '@mui/material';
import { Verified, CheckCircle, Info, Person, Fingerprint } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { NumeroPermisParts, PermisFormatType } from '../types';
import { buildNumeroPermis } from '../utils';

interface NumeroPermisStepProps {
  numeroPermisParts: NumeroPermisParts;
  isFicheEnregistre: boolean;
  loading: boolean;
  format: PermisFormatType;
  verifyingPermis?: boolean;
  permisVerified?: boolean;
  verificationError?: string | null;
  availableCategories?: string[];
  candidatNonTrouve?: boolean;
  personneData?: { nom?: string; prenom?: string };
  candidatData?: { date_naissance?: string; lieu_naissance?: string; numero_piece?: string };
  onNumeroPermisPartsChange: (parts: NumeroPermisParts) => void;
  onFormatChange: (format: PermisFormatType) => void;
  onVerifyPermis?: () => void;
}

export const NumeroPermisStep: React.FC<NumeroPermisStepProps> = ({
  numeroPermisParts,
  isFicheEnregistre,
  loading,
  format,
  verifyingPermis = false,
  permisVerified = false,
  verificationError = null,
  availableCategories = [],
  candidatNonTrouve = false,
  personneData,
  candidatData,
  onNumeroPermisPartsChange,
  onFormatChange,
  onVerifyPermis,
}) => {
  const numPermisComplet = buildNumeroPermis(numeroPermisParts, format);
  
  // Refs pour éviter les déclenchements multiples
  const permisVerifiedRef = useRef(false);
  const verificationErrorRef = useRef<string | null>(null);
  
  // État pour la vérification d'identité
  const [showIdentityVerification, setShowIdentityVerification] = useState(false);
  const [identityData, setIdentityData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    numeroIdentite: '',
  });
  const [isAutocompleted, setIsAutocompleted] = useState(false);
  const [verifyingIdentity, setVerifyingIdentity] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  
  // Afficher l'étape de vérification d'identité si le permis est vérifié et le candidat n'est pas trouvé
  useEffect(() => {
    if (permisVerified && candidatNonTrouve && !showIdentityVerification && !identityVerified) {
      setShowIdentityVerification(true);
    }
  }, [permisVerified, candidatNonTrouve, showIdentityVerification, identityVerified]);
  
  // Auto-remplir les champs avec les données de la réponse de vérification
  useEffect(() => {
    if (showIdentityVerification && permisVerified && candidatNonTrouve && !isAutocompleted) {
      const autoFilledData = {
        nom: personneData?.nom || '',
        prenom: personneData?.prenom || '',
        dateNaissance: candidatData?.date_naissance || '',
        lieuNaissance: candidatData?.lieu_naissance || '',
        numeroIdentite: candidatData?.numero_piece || '',
      };
      
      // Vérifier si des données sont disponibles pour l'auto-complétion
      if (autoFilledData.nom || autoFilledData.prenom || autoFilledData.dateNaissance || autoFilledData.lieuNaissance || autoFilledData.numeroIdentite) {
        setIdentityData(autoFilledData);
        setIsAutocompleted(true);
      }
    }
  }, [showIdentityVerification, permisVerified, candidatNonTrouve, personneData, candidatData, isAutocompleted]);
  
  // Fonction de vérification d'identité simulée
  const handleVerifyIdentity = async () => {
    // Validation des champs
    if (!identityData.nom || !identityData.prenom || !identityData.dateNaissance || !identityData.lieuNaissance || !identityData.numeroIdentite) {
      setIdentityError('Veuillez remplir tous les champs');
      return;
    }
    
    setVerifyingIdentity(true);
    setIdentityError(null);
    
    // Simulation de vérification (2 secondes)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Vérification simulée : toujours réussie pour l'instant
    setIdentityVerified(true);
    setVerifyingIdentity(false);
    
    toast.custom(
      (t) => (
        <Box
          onClick={() => toast.dismiss(t.id)}
          sx={{
            p: 3,
            borderRadius: 0,
            background: '#ffffff',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            cursor: 'pointer',
            minWidth: '300px',
            maxWidth: '500px',
            animation: t.visible
              ? 'slideInRight 0.3s ease-out forwards'
              : 'slideOutRight 0.3s ease-in forwards',
            '@keyframes slideInRight': {
              '0%': {
                transform: 'translateX(100%)',
                opacity: 0,
              },
              '100%': {
                transform: 'translateX(0)',
                opacity: 1,
              },
            },
            '@keyframes slideOutRight': {
              '0%': {
                transform: 'translateX(0)',
                opacity: 1,
              },
              '100%': {
                transform: 'translateX(100%)',
                opacity: 0,
              },
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: 3,
              height: '100%',
              background: '#4caf50',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <CheckCircle
              sx={{
                color: '#4caf50',
                fontSize: 24,
                mt: 0.5,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  color: '#66bb6a',
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                Vérification d'identité réussie. Vous pouvez maintenant continuer.
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
      {
        position: 'bottom-right',
        duration: 5000,
      }
    );
  };
  
  // Afficher des toasts pour les résultats de vérification
  useEffect(() => {
    if (permisVerified && !permisVerifiedRef.current) {
      permisVerifiedRef.current = true;
      toast.custom(
        (t) => (
          <Box
            onClick={() => toast.dismiss(t.id)}
            sx={{
              p: 3,
              borderRadius: 0,
              background: '#ffffff',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              cursor: 'pointer',
              minWidth: '300px',
              maxWidth: '500px',
              animation: t.visible
                ? 'slideInRight 0.3s ease-out forwards'
                : 'slideOutRight 0.3s ease-in forwards',
              '@keyframes slideInRight': {
                '0%': {
                  transform: 'translateX(100%)',
                  opacity: 0,
                },
                '100%': {
                  transform: 'translateX(0)',
                  opacity: 1,
                },
              },
              '@keyframes slideOutRight': {
                '0%': {
                  transform: 'translateX(0)',
                  opacity: 1,
                },
                '100%': {
                  transform: 'translateX(100%)',
                  opacity: 0,
                },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: 3,
                height: '100%',
                background: '#4caf50',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <CheckCircle
                sx={{
                  color: '#4caf50',
                  fontSize: 24,
                  mt: 0.5,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  Le permis a été vérifié avec succès et est authentique.
                </Typography>
              </Box>
            </Box>
          </Box>
        ),
        {
          position: 'bottom-right',
          duration: 5000,
        }
      );
    } else if (!permisVerified) {
      permisVerifiedRef.current = false;
    }
  }, [permisVerified]);

  useEffect(() => {
    if (verificationError && verificationError !== verificationErrorRef.current) {
      verificationErrorRef.current = verificationError;
      toast.custom(
        (t) => (
          <Box
            onClick={() => toast.dismiss(t.id)}
            sx={{
              p: 3,
              borderRadius: 0,
              background: '#ffffff',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              cursor: 'pointer',
              minWidth: '300px',
              maxWidth: '500px',
              animation: t.visible
                ? 'slideInRight 0.3s ease-out forwards'
                : 'slideOutRight 0.3s ease-in forwards',
              '@keyframes slideInRight': {
                '0%': {
                  transform: 'translateX(100%)',
                  opacity: 0,
                },
                '100%': {
                  transform: 'translateX(0)',
                  opacity: 1,
                },
              },
              '@keyframes slideOutRight': {
                '0%': {
                  transform: 'translateX(0)',
                  opacity: 1,
                },
                '100%': {
                  transform: 'translateX(100%)',
                  opacity: 0,
                },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: 3,
                height: '100%',
                background: '#d32f2f',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Info
                sx={{
                  color: 'text.secondary',
                  fontSize: 24,
                  mt: 0.5,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  {verificationError}
                </Typography>
              </Box>
            </Box>
          </Box>
        ),
        {
          position: 'bottom-right',
          duration: 5000,
        }
      );
    } else if (!verificationError) {
      verificationErrorRef.current = null;
    }
  }, [verificationError]);
  
  // Réinitialiser les champs quand on change de format
  const handleFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFormat = event.target.value as PermisFormatType;
    
    // Ne rien faire si le format est le même
    if (newFormat === format) {
      return;
    }
    
    if (newFormat === 'op') {
      // Pour le format PERM, on garde seulement le numéro et on vide les autres champs
      onNumeroPermisPartsChange({
        annee: '',
        province: '',
        categorie: '',
        numero: numeroPermisParts.numero || '', // Garder le numéro si déjà saisi
      });
    } else {
      // Pour le format standard, on vide tout si on passait de PERM à standard
      if (format === 'op') {
        onNumeroPermisPartsChange({
          annee: '',
          province: '',
          categorie: '',
          numero: '',
        });
      }
    }
    // Changer le format
    onFormatChange(newFormat);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isFicheEnregistre 
          ? 'Veuillez saisir le numéro de permis d\'origine du candidat.'
          : 'Veuillez saisir le numéro de permis du candidat.'}
      </Typography>
      
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">Format du numéro de permis</FormLabel>
        <RadioGroup
          row
          value={format}
          onChange={handleFormatChange}
        >
          <FormControlLabel 
            value="standard" 
            control={<Radio />} 
            label="Format standard (AAAA-P-C-NNNN)" 
            disabled={loading}
          />
          <FormControlLabel 
            value="op" 
            control={<Radio />} 
            label="Format PERM (PERM-XXXXXX)" 
            disabled={loading}
          />
        </RadioGroup>
      </FormControl>
      
      {format === 'standard' ? (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Format: AAAA-P-C-NNNN (ex: 2024-1-A-1234) - Minimum 4 chiffres pour le numéro
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Saisissez le numéro de permis exact tel qu'il apparaît (ex: PERM-12345678, PERM12345678, ou 12345678)
        </Typography>
      )}
      
      <Grid container spacing={2}>
        {format === 'standard' ? (
          <>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Année d'obtention"
                value={numeroPermisParts.annee}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  onNumeroPermisPartsChange({ ...numeroPermisParts, annee: value });
                }}
                fullWidth
                required
                disabled={loading}
                placeholder="2024"
                helperText="4 chiffres"
                inputProps={{ maxLength: 4 }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Province"
                value={numeroPermisParts.province}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^1-9]/g, '').slice(0, 1);
                  onNumeroPermisPartsChange({ ...numeroPermisParts, province: value });
                }}
                fullWidth
                required
                disabled={loading}
                placeholder="1"
                helperText="1 à 9"
                inputProps={{ maxLength: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              {availableCategories.length > 1 && permisVerified ? (
                <FormControl fullWidth required>
                  <InputLabel>Catégorie</InputLabel>
                  <Select
                    value={numeroPermisParts.categorie || ''}
                    onChange={(e) => {
                      const nouvelleCategorie = String(e.target.value).toUpperCase().trim();
                      console.log('✅ [NumeroPermisStep] Catégorie sélectionnée dans le select:', {
                        nouvelleCategorie,
                        ancienneCategorie: numeroPermisParts.categorie,
                        numeroPermisParts: numeroPermisParts,
                      });
                      const updatedParts = { ...numeroPermisParts, categorie: nouvelleCategorie };
                      console.log('✅ [NumeroPermisStep] Mise à jour numeroPermisParts:', updatedParts);
                      onNumeroPermisPartsChange(updatedParts);
                    }}
                    label="Catégorie"
                    disabled={loading}
                    required
                  >
                    {availableCategories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Plusieurs catégories détectées, veuillez choisir
                  </Typography>
                </FormControl>
              ) : (
                <TextField
                  label="Catégorie"
                  value={numeroPermisParts.categorie || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1);
                    console.log('✅ [NumeroPermisStep] Catégorie saisie:', value);
                    onNumeroPermisPartsChange({ ...numeroPermisParts, categorie: value });
                  }}
                  fullWidth
                  required
                  disabled={loading || (availableCategories.length > 1 && permisVerified)}
                  placeholder="A"
                  helperText={permisVerified && numeroPermisParts.categorie ? `Catégorie: ${numeroPermisParts.categorie}` : "1 lettre"}
                  inputProps={{ maxLength: 1 }}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Numéro"
                value={numeroPermisParts.numero}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  onNumeroPermisPartsChange({ ...numeroPermisParts, numero: value });
                }}
                fullWidth
                required
                disabled={loading}
                placeholder="1234"
                helperText="Minimum 4 chiffres"
                inputProps={{ minLength: 4, maxLength: 10 }}
              />
            </Grid>
          </>
        ) : (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Numéro de permis complet"
              value={numeroPermisParts.numero}
              onChange={(e) => {
                // Accepter lettres, chiffres et tirets - laisser l'utilisateur saisir exactement ce qu'il veut
                const value = e.target.value.toUpperCase();
                onNumeroPermisPartsChange({ ...numeroPermisParts, numero: value });
              }}
              fullWidth
              required
              disabled={loading}
              placeholder="PERM-12345678 ou 12345678"
              helperText="Saisissez le numéro complet exact (ex: PERM-12345678 ou 12345678)"
            />
          </Grid>
        )}
        {numPermisComplet && (
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2,
              borderRadius: 0,
              background: '#ffffff',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              display: 'inline-block',
              maxWidth: 'fit-content',
            }}>
              <Box sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: 3,
                height: '100%',
                background: '#1976d2',
              }} />
              <Typography 
                variant="body1" 
                sx={{
                  color: 'text.primary',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  pl: 1,
                }}
              >
                Numéro de permis: <strong>{numPermisComplet}</strong>
              </Typography>
            </Box>
          </Grid>
        )}
        
        {/* Bouton de vérification et messages */}
        {numPermisComplet && onVerifyPermis && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={verifyingPermis ? <CircularProgress size={20} /> : <Verified />}
                onClick={onVerifyPermis}
                disabled={loading || verifyingPermis || !numPermisComplet}
                sx={{ alignSelf: 'flex-start' }}
              >
                {verifyingPermis ? 'Vérification en cours...' : 'Vérifier le permis'}
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
      
      {/* Étape de vérification d'identité */}
      {showIdentityVerification && permisVerified && candidatNonTrouve && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Fingerprint sx={{ 
              color: identityVerified ? '#4caf50' : 'primary.main', 
              fontSize: 32,
              opacity: identityVerified ? 1 : 0.6,
              transition: 'all 0.3s ease',
            }} />
            <Typography 
              variant="h6" 
              sx={{
                color: identityVerified ? '#4caf50' : 'primary.main',
                opacity: identityVerified ? 1 : 0.6,
                fontWeight: identityVerified ? 600 : 500,
                transition: 'all 0.3s ease',
              }}
            >
              Vérification d'identité {identityVerified && '✓'}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            La personne trouvée n'est pas encore enregistrée dans le système. Veuillez vérifier son identité en saisissant les informations suivantes.
          </Typography>
          
          {identityError && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error">
                {identityError}
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom"
                value={identityData.nom}
                onChange={(e) => setIdentityData({ ...identityData, nom: e.target.value })}
                fullWidth
                required
                disabled={loading || verifyingIdentity || identityVerified || isAutocompleted}
                placeholder="Dupont"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prénom"
                value={identityData.prenom}
                onChange={(e) => setIdentityData({ ...identityData, prenom: e.target.value })}
                fullWidth
                required
                disabled={loading || verifyingIdentity || identityVerified || isAutocompleted}
                placeholder="Jean"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date de naissance"
                type="date"
                value={identityData.dateNaissance}
                onChange={(e) => setIdentityData({ ...identityData, dateNaissance: e.target.value })}
                fullWidth
                required
                disabled={loading || verifyingIdentity || identityVerified || isAutocompleted}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Lieu de naissance"
                value={identityData.lieuNaissance}
                onChange={(e) => setIdentityData({ ...identityData, lieuNaissance: e.target.value })}
                fullWidth
                required
                disabled={loading || verifyingIdentity || identityVerified || isAutocompleted}
                placeholder="Dakar, Sénégal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Numéro d'identité"
                value={identityData.numeroIdentite}
                onChange={(e) => setIdentityData({ ...identityData, numeroIdentite: e.target.value.toUpperCase() })}
                fullWidth
                required
                disabled={loading || verifyingIdentity || identityVerified || isAutocompleted}
                placeholder="1234567890123"
                helperText="Numéro de pièce d'identité"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={verifyingIdentity ? <CircularProgress size={20} /> : <Person />}
                onClick={handleVerifyIdentity}
                disabled={loading || verifyingIdentity || identityVerified}
                sx={{ alignSelf: 'flex-start' }}
              >
                {verifyingIdentity ? 'Vérification en cours...' : identityVerified ? 'Identité vérifiée ✓' : 'Vérifier l\'identité'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};


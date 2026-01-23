import React, { useEffect, useRef } from 'react';
import { Grid, Typography, TextField, Box, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Button, CircularProgress } from '@mui/material';
import { Verified, CheckCircle, Info, Warning } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { NumeroPermisParts, PermisFormatType } from '../types';
import { buildNumeroOriginePermis } from '../utils';

interface PermisOrigineStepProps {
  numeroOriginePermisParts: NumeroPermisParts;
  loading: boolean;
  permisOrigineFormat: PermisFormatType;
  lieuOrigine?: string;
  verifyingPermis?: boolean;
  permisVerified?: boolean;
  verificationError?: string | null;
  candidatNonTrouve?: boolean;
  onNumeroOriginePermisPartsChange: (parts: NumeroPermisParts) => void;
  onPermisOrigineFormatChange: (format: PermisFormatType) => void;
  onLieuOrigineChange?: (lieu: string) => void;
  onVerifyPermis?: () => void;
}

export const PermisOrigineStep: React.FC<PermisOrigineStepProps> = ({
  numeroOriginePermisParts,
  loading,
  permisOrigineFormat,
  lieuOrigine = '',
  verifyingPermis = false,
  permisVerified = false,
  verificationError = null,
  candidatNonTrouve = false,
  onNumeroOriginePermisPartsChange,
  onPermisOrigineFormatChange,
  onLieuOrigineChange,
  onVerifyPermis,
}) => {
  const numPermisOrigineComplet = buildNumeroOriginePermis(numeroOriginePermisParts, permisOrigineFormat);
  
  // Refs pour éviter les déclenchements multiples
  const permisVerifiedRef = useRef(false);
  const verificationErrorRef = useRef<string | null>(null);
  const candidatNonTrouveRef = useRef(false);
  
  // Détecter si les champs ont été autocomplétés (remplis automatiquement)
  const isAutocompletedRef = useRef(false);
  const previousValuesRef = useRef({
    annee: numeroOriginePermisParts.annee,
    province: numeroOriginePermisParts.province,
    categorie: numeroOriginePermisParts.categorie,
    numero: numeroOriginePermisParts.numero,
  });
  
  React.useEffect(() => {
    // Détecter si les valeurs ont changé automatiquement (sans interaction utilisateur)
    const hasAutocompletedData = permisOrigineFormat === 'standard' 
      ? (numeroOriginePermisParts.annee && numeroOriginePermisParts.province && numeroOriginePermisParts.categorie && numeroOriginePermisParts.numero)
      : numeroOriginePermisParts.numero;
    
    if (hasAutocompletedData && !permisVerified) {
      // Vérifier si les valeurs ont changé depuis le dernier rendu
      const valuesChanged = 
        previousValuesRef.current.annee !== numeroOriginePermisParts.annee ||
        previousValuesRef.current.province !== numeroOriginePermisParts.province ||
        previousValuesRef.current.categorie !== numeroOriginePermisParts.categorie ||
        previousValuesRef.current.numero !== numeroOriginePermisParts.numero;
      
      // Si les valeurs ont changé et qu'elles sont toutes remplies, c'est probablement de l'autocomplétion
      if (valuesChanged && hasAutocompletedData) {
        isAutocompletedRef.current = true;
      }
      
      // Mettre à jour les valeurs précédentes
      previousValuesRef.current = {
        annee: numeroOriginePermisParts.annee,
        province: numeroOriginePermisParts.province,
        categorie: numeroOriginePermisParts.categorie,
        numero: numeroOriginePermisParts.numero,
      };
    }
  }, [numeroOriginePermisParts, permisOrigineFormat, permisVerified]);
  
  const isAutocompleted = isAutocompletedRef.current && !permisVerified;
  
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
                  Le permis d'origine a été vérifié avec succès.
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

  useEffect(() => {
    if (candidatNonTrouve && permisVerified && !candidatNonTrouveRef.current) {
      candidatNonTrouveRef.current = true;
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
                background: '#ff9800',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Warning
                sx={{
                  color: '#ff9800',
                  fontSize: 24,
                  mt: 0.5,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    lineHeight: 1.6,
                    mb: 1,
                  }}
                >
                  Usager non enregistré
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  Cet usager n'est pas enregistré dans le système. Vous devrez créer un compte pour cet usager. Les prochaines étapes vous permettront de saisir ses informations personnelles et de candidat.
                </Typography>
              </Box>
            </Box>
          </Box>
        ),
        {
          position: 'bottom-right',
          duration: 6000,
        }
      );
    } else if (!candidatNonTrouve || !permisVerified) {
      candidatNonTrouveRef.current = false;
    }
  }, [candidatNonTrouve, permisVerified]);
  
  // Réinitialiser la vérification quand le numéro change
  useEffect(() => {
    if (numPermisOrigineComplet && onVerifyPermis) {
      // Réinitialiser l'état de vérification si le numéro change
      // Cette logique sera gérée dans le composant parent
    }
  }, [numPermisOrigineComplet, onVerifyPermis]);
  // Réinitialiser les champs quand on change de format pour le numéro d'origine
  const handleFormatChange = (newFormat: PermisFormatType) => {
    onPermisOrigineFormatChange(newFormat);
    if (newFormat === 'op') {
      onNumeroOriginePermisPartsChange({
        annee: '',
        province: '',
        categorie: '',
        numero: numeroOriginePermisParts.numero, // Garder le numéro si déjà saisi
      });
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Numéro de permis d'origine (obligatoire)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Le numéro de permis d'origine est requis pour les permis de catégorie C, D ou E.
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Format du numéro de permis d'origine</FormLabel>
          <RadioGroup
            row
            value={permisOrigineFormat}
            onChange={(e) => handleFormatChange(e.target.value as PermisFormatType)}
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
      </Grid>
      
      {permisOrigineFormat === 'standard' ? (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', ml: 2 }}>
          Format: AAAA-P-C-NNNN (ex: 2024-1-A-1234) - Minimum 4 chiffres pour le numéro
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', ml: 2 }}>
          Saisissez le numéro de permis d'origine exact tel qu'il apparaît (ex: PERM-12345678, PERM12345678, ou 12345678)
        </Typography>
      )}
      
      <Grid container spacing={2}>
        {permisOrigineFormat === 'standard' ? (
          <>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Année d'obtention"
                value={numeroOriginePermisParts.annee}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  onNumeroOriginePermisPartsChange({ ...numeroOriginePermisParts, annee: value });
                }}
                fullWidth
                required
                disabled={loading || isAutocompleted}
                placeholder="2024"
                helperText="4 chiffres"
                inputProps={{ maxLength: 4 }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Province"
                value={numeroOriginePermisParts.province}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^1-9]/g, '').slice(0, 1);
                  onNumeroOriginePermisPartsChange({ ...numeroOriginePermisParts, province: value });
                }}
                fullWidth
                required
                disabled={loading || isAutocompleted}
                placeholder="1"
                helperText="1 à 9"
                inputProps={{ maxLength: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Catégorie"
                value={numeroOriginePermisParts.categorie}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1);
                  // Seule la catégorie B est acceptée
                  if (value === '' || value === 'B') {
                    onNumeroOriginePermisPartsChange({ ...numeroOriginePermisParts, categorie: value });
                  }
                }}
                fullWidth
                required
                disabled={loading || isAutocompleted}
                placeholder="B"
                helperText={
                  numeroOriginePermisParts.categorie !== '' && numeroOriginePermisParts.categorie !== 'B'
                    ? 'Seule la catégorie B est acceptée pour le permis d\'origine'
                    : 'Catégorie B uniquement'
                }
                inputProps={{ maxLength: 1 }}
                error={numeroOriginePermisParts.categorie !== '' && numeroOriginePermisParts.categorie !== 'B'}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Numéro"
                value={numeroOriginePermisParts.numero}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  onNumeroOriginePermisPartsChange({ ...numeroOriginePermisParts, numero: value });
                }}
                fullWidth
                required
                disabled={loading || isAutocompleted}
                placeholder="1234"
                helperText="Minimum 4 chiffres"
                inputProps={{ minLength: 4, maxLength: 10 }}
              />
            </Grid>
          </>
        ) : (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Numéro de permis d'origine complet"
              value={numeroOriginePermisParts.numero}
              onChange={(e) => {
                // Accepter lettres, chiffres et tirets - laisser l'utilisateur saisir exactement ce qu'il veut
                const value = e.target.value.toUpperCase();
                onNumeroOriginePermisPartsChange({ ...numeroOriginePermisParts, numero: value });
              }}
              fullWidth
              required
              disabled={loading || isAutocompleted}
              placeholder="PERM-12345678 ou 12345678"
              helperText="Saisissez le numéro complet exact (ex: PERM-12345678 ou 12345678)"
            />
          </Grid>
        )}
        {buildNumeroOriginePermis(numeroOriginePermisParts, permisOrigineFormat) && (
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
                background: permisVerified ? '#4caf50' : '#1976d2',
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
                Numéro de permis d'origine: <strong>{buildNumeroOriginePermis(numeroOriginePermisParts, permisOrigineFormat)}</strong>
                {permisVerified && ' ✓ Vérifié'}
              </Typography>
            </Box>
          </Grid>
        )}
        
        {/* Champ Lieu d'origine */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Lieu d'origine"
            value={lieuOrigine}
            onChange={(e) => {
              if (onLieuOrigineChange) {
                onLieuOrigineChange(e.target.value);
              }
            }}
            fullWidth
            required
            disabled={loading || verifyingPermis || isAutocompleted}
            placeholder="Libreville"
            helperText="Lieu d'obtention du permis d'origine"
          />
        </Grid>
        
        {/* Bouton de vérification et messages */}
        {onVerifyPermis && numPermisOrigineComplet && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={onVerifyPermis}
                disabled={
                  loading || 
                  verifyingPermis || 
                  !numPermisOrigineComplet || 
                  (permisOrigineFormat === 'standard' && numeroOriginePermisParts.categorie !== 'B')
                }
                startIcon={verifyingPermis ? <CircularProgress size={20} /> : <Verified />}
                sx={{ alignSelf: 'flex-start' }}
              >
                {verifyingPermis ? 'Vérification en cours...' : 'Vérifier le permis d\'origine'}
              </Button>
              {permisOrigineFormat === 'standard' && numeroOriginePermisParts.categorie !== 'B' && numeroOriginePermisParts.categorie !== '' && (
                <Typography variant="caption" color="error" sx={{ mt: -1 }}>
                  Seule la catégorie B est acceptée pour le permis d'origine
                </Typography>
              )}
            </Box>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};


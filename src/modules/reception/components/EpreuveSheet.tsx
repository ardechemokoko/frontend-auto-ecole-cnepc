import React from 'react';
import { Box, Button, Divider, Drawer, IconButton, MenuItem, Select, SelectChangeEvent, Stack, TextField, Typography, Chip, Alert, CircularProgress, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { ReceptionDossier, EpreuvesResultat, EpreuveAttempt, EpreuveStatut } from '../types';
import axiosClient from '../../../shared/environment/envdev';

interface EpreuveSheetProps {
  open: boolean;
  onClose: () => void;
  dossier: ReceptionDossier | null;
  onSaved?: (results: EpreuvesResultat) => void;
}

const MAX_ATTEMPTS = 3;

function computeOverall(attempts?: EpreuveAttempt[], legacy?: EpreuveStatut): EpreuveStatut {
  if (legacy && legacy !== 'non_saisi') return legacy;
  if (!attempts || attempts.length === 0) return 'non_saisi';
  if (attempts.some(a => a.result === 'reussi')) return 'reussi';
  if (attempts.length >= MAX_ATTEMPTS && attempts.every(a => a.result !== 'reussi')) return 'echoue';
  return attempts[attempts.length - 1].result;
}

/**
 * Calcule le résultat global en fonction des trois épreuves
 * - Validé (reussi) : toutes les épreuves sont réussies
 * - Échoué (echoue) : au moins une épreuve est échouée
 * - Absent : au moins une épreuve est absente et aucune n'est échouée
 * - Non saisi : en cours de saisie ou aucune donnée suffisante
 */
function computeGeneral(
  creneaux: EpreuveStatut,
  codeConduite: EpreuveStatut,
  tourVille: EpreuveStatut
): EpreuveStatut {
  const statuses: EpreuveStatut[] = [creneaux, codeConduite, tourVille];
  
  // Réussi uniquement si toutes les épreuves sont réussies
  if (statuses.every(s => s === 'reussi')) return 'reussi';
  
  // Échoué si au moins une épreuve est échouée
  if (statuses.some(s => s === 'echoue')) return 'echoue';
  
  // Absent si on a au moins un absent et aucune échoue et pas toutes réussies
  if (statuses.some(s => s === 'absent')) return 'absent';
  
  // Sinon non saisi (en cours / aucune donnée suffisante)
  return 'non_saisi';
}

const EpreuveRow: React.FC<{
  label: string;
  attempts: EpreuveAttempt[];
  onAdd: (a: EpreuveAttempt) => void;
  onChange: (index: number, a: EpreuveAttempt) => void;
  onLock?: (index: number) => void;
  lockedAttempts?: Set<number>;
  disabled?: boolean;
}> = ({ label, attempts, onAdd, onChange, onLock, lockedAttempts = new Set(), disabled }) => {
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">{label}</Typography>
        <Button
          size="small"
          variant="outlined"
          disabled={disabled || attempts.length >= MAX_ATTEMPTS}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (attempts.length < MAX_ATTEMPTS) {
              onAdd({ result: 'non_saisi', date: new Date().toISOString() });
            }
          }}
        >
          Ajouter tentative
        </Button>
      </Stack>
      <Stack spacing={1}>
        {attempts.map((a, idx) => {
          const isLocked = lockedAttempts.has(idx);
          return (
            <Stack key={idx} direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ width: 60 }}>Tentative {idx + 1}</Typography>
              <Select
                size="small"
                value={a.result}
                onChange={(e: SelectChangeEvent) => onChange(idx, { ...a, result: e.target.value as any })}
                sx={{ width: 160 }}
                disabled={disabled || isLocked}
              >
                <MenuItem value="non_saisi">Non saisi</MenuItem>
                <MenuItem value="reussi">Réussi</MenuItem>
                <MenuItem value="echoue">Échoué</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
              </Select>
              <TextField
                size="small"
                type="datetime-local"
                sx={{ width: 240 }}
                value={new Date(a.date).toISOString().slice(0,16)}
                onChange={(e) => onChange(idx, { ...a, date: new Date(e.target.value).toISOString() })}
                disabled={disabled || isLocked}
              />
              <TextField
                size="small"
                placeholder="Note (optionnel)"
                value={a.note || ''}
                onChange={(e) => onChange(idx, { ...a, note: e.target.value })}
                sx={{ flex: 1 }}
                disabled={disabled || isLocked}
              />
              {onLock && (
                <Tooltip title={isLocked ? "Déverrouiller la tentative" : "Verrouiller la tentative"}>
                  <IconButton
                    size="small"
                    onClick={() => onLock(idx)}
                    color={isLocked ? "primary" : "default"}
                    disabled={disabled}
                  >
                    {isLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        })}
        {attempts.length === 0 && (
          <Typography variant="body2" color="text.secondary">Aucune tentative saisie.</Typography>
        )}
      </Stack>
    </Box>
  );
};

const EpreuveSheet: React.FC<EpreuveSheetProps> = ({ open, onClose, dossier, onSaved }) => {
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [values, setValues] = React.useState<EpreuvesResultat>({});
  const addingAttemptRef = React.useRef<Set<string>>(new Set());
  const previousDossierIdRef = React.useRef<string | null>(null);
  // État pour suivre les tentatives verrouillées par type d'épreuve
  const [lockedAttempts, setLockedAttempts] = React.useState<{
    creneaux: Set<number>;
    codeConduite: Set<number>;
    tourVille: Set<number>;
  }>({
    creneaux: new Set(),
    codeConduite: new Set(),
    tourVille: new Set()
  });
  // État pour la confirmation de verrouillage automatique
  const [lockConfirmation, setLockConfirmation] = React.useState<{
    open: boolean;
    type: 'creneaux' | 'codeConduite' | 'tourVille' | null;
    previousStatus: EpreuveStatut | null;
  }>({
    open: false,
    type: null,
    previousStatus: null
  });
  // État pour la confirmation d'échec définitif (3 tentatives échouées)
  const [failureConfirmation, setFailureConfirmation] = React.useState<{
    open: boolean;
    type: 'creneaux' | 'codeConduite' | 'tourVille' | null;
  }>({
    open: false,
    type: null
  });
  // Référence pour suivre les statuts précédents
  const previousStatusRef = React.useRef<{
    creneaux: EpreuveStatut;
    codeConduite: EpreuveStatut;
    tourVille: EpreuveStatut;
  }>({
    creneaux: 'non_saisi',
    codeConduite: 'non_saisi',
    tourVille: 'non_saisi'
  });
  // Référence pour suivre les épreuves pour lesquelles l'utilisateur a refusé le verrouillage
  const refusedLockRef = React.useRef<Set<'creneaux' | 'codeConduite' | 'tourVille'>>(new Set());
  // Référence pour suivre les épreuves pour lesquelles l'utilisateur a refusé le verrouillage d'échec
  const refusedFailureLockRef = React.useRef<Set<'creneaux' | 'codeConduite' | 'tourVille'>>(new Set());

  // Réinitialiser les tentatives verrouillées uniquement quand le dossier change
  React.useEffect(() => {
    if (dossier && dossier.id !== previousDossierIdRef.current) {
      // Le dossier a changé, réinitialiser les tentatives verrouillées
      setLockedAttempts({
        creneaux: new Set(),
        codeConduite: new Set(),
        tourVille: new Set()
      });
      // Réinitialiser les refus de verrouillage
      refusedLockRef.current.clear();
      refusedFailureLockRef.current.clear();
      // Réinitialiser les statuts précédents
      previousStatusRef.current = {
        creneaux: 'non_saisi',
        codeConduite: 'non_saisi',
        tourVille: 'non_saisi'
      };
      previousDossierIdRef.current = dossier.id;
    } else if (!dossier) {
      previousDossierIdRef.current = null;
    }
  }, [dossier]);

  // Charger les résultats depuis l'API /resultats
  React.useEffect(() => {
    const loadResultats = async () => {
      if (!open || !dossier) {
        // Réinitialiser les valeurs quand le drawer se ferme (mais pas les tentatives verrouillées)
        setValues({
          creneauxAttempts: [],
          codeConduiteAttempts: [],
          tourVilleAttempts: [],
          notes: ''
        });
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('📋 Chargement des résultats depuis /resultats pour le dossier:', dossier.id);
        
        // Appel API GET /resultats avec dossier_id en paramètre
        const response = await axiosClient.get('/resultats', {
          params: { dossier_id: dossier.id }
        });
        
        console.log('✅ Réponse complète API /resultats:', response.data);
        console.log('📦 Structure de la réponse:', {
          hasData: !!response.data?.data,
          dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
          hasLinks: !!response.data?.links,
          hasMeta: !!response.data?.meta
        });
        
        // La réponse contient { data: [...], links: {...}, meta: {...} } (structure paginée Laravel)
        const resultats = Array.isArray(response.data?.data) ? response.data.data : [];
        
        console.log(`📦 ${resultats.length} résultat(s) trouvé(s) dans response.data.data`);
        
        // Organiser les résultats par type d'examen
        // Utiliser un Map pour éviter les doublons basés sur (typeExamen, date, statut)
        const creneauxMap = new Map<string, EpreuveAttempt>();
        const codeConduiteMap = new Map<string, EpreuveAttempt>();
        const tourVilleMap = new Map<string, EpreuveAttempt>();
        let notes = '';
        
        resultats.forEach((resultat: any) => {
          console.log('📄 Traitement du résultat:', {
            id: resultat.id,
            typeExamen: resultat.typeExamen,
            statut: resultat.statut,
            date: resultat.date,
            hasCommentaire: !!resultat.commentaire
          });
          
          // Créer une clé unique pour éviter les doublons (typeExamen + date + statut)
          const dateKey = resultat.date ? new Date(resultat.date).toISOString().slice(0, 16) : '';
          const uniqueKey = `${resultat.typeExamen}_${dateKey}_${resultat.statut}`;
          
          const attempt: EpreuveAttempt = {
            result: resultat.statut as EpreuveStatut,
            date: resultat.date,
            note: resultat.commentaire || ''
          };
          
          // Mapper les types d'examen (peut être "creneaux", "codeConduite", "tourVille" ou autres formats)
          const typeExamen = (resultat.typeExamen || '').toLowerCase().trim();
          
          if (typeExamen.includes('creneau') || typeExamen === 'creneaux') {
            // Vérifier si on n'a pas déjà ce résultat
            if (!creneauxMap.has(uniqueKey)) {
              creneauxMap.set(uniqueKey, attempt);
              console.log('✅ Ajouté aux créneaux');
            } else {
              console.log('⚠️ Doublon détecté pour créneaux, ignoré:', uniqueKey);
            }
          } else if (typeExamen.includes('code') || typeExamen === 'codeconduite' || typeExamen === 'code_conduite') {
            if (!codeConduiteMap.has(uniqueKey)) {
              codeConduiteMap.set(uniqueKey, attempt);
              console.log('✅ Ajouté au code de conduite');
            } else {
              console.log('⚠️ Doublon détecté pour code de conduite, ignoré:', uniqueKey);
            }
          } else if (typeExamen.includes('ville') || typeExamen === 'tourville' || typeExamen === 'tour_ville') {
            if (!tourVilleMap.has(uniqueKey)) {
              tourVilleMap.set(uniqueKey, attempt);
              console.log('✅ Ajouté au tour de ville');
            } else {
              console.log('⚠️ Doublon détecté pour tour de ville, ignoré:', uniqueKey);
            }
          } else {
            // Si le type n'est pas reconnu, log pour debug
            console.warn('⚠️ Type d\'examen non reconnu:', resultat.typeExamen, 'pour le résultat ID:', resultat.id);
          }
          
          // Utiliser le commentaire comme notes générales si disponible
          if (resultat.commentaire && !notes) {
            notes = resultat.commentaire;
          }
        });
        
        // Convertir les Maps en arrays et trier par date (plus ancien en premier)
        const creneauxAttempts = Array.from(creneauxMap.values()).sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        });
        const codeConduiteAttempts = Array.from(codeConduiteMap.values()).sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        });
        const tourVilleAttempts = Array.from(tourVilleMap.values()).sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        });
        
        console.log('📊 Résultats organisés:', {
          creneaux: creneauxAttempts.length,
          codeConduite: codeConduiteAttempts.length,
          tourVille: tourVilleAttempts.length,
          notes: notes ? 'Oui' : 'Non'
        });
        
        // Log pour debug : afficher les tentatives chargées
        console.log('📋 Tentatives chargées:', {
          creneaux: creneauxAttempts.map(a => ({ result: a.result, date: a.date })),
          codeConduite: codeConduiteAttempts.map(a => ({ result: a.result, date: a.date })),
          tourVille: tourVilleAttempts.map(a => ({ result: a.result, date: a.date }))
        });
        
        setValues({
          creneauxAttempts,
          codeConduiteAttempts,
          tourVilleAttempts,
          notes
        });
        
        // Calculer les statuts après le chargement et initialiser previousStatusRef
        // pour éviter que le modal s'ouvre automatiquement pour les épreuves déjà réussies
        const loadedCreneauxStatus = computeOverall(creneauxAttempts);
        const loadedCodeStatus = computeOverall(codeConduiteAttempts);
        const loadedVilleStatus = computeOverall(tourVilleAttempts);
        
        // Si une épreuve est déjà réussie, verrouiller automatiquement toutes ses tentatives
        // et mettre à jour previousStatusRef pour éviter le modal
        if (loadedCreneauxStatus === 'reussi' && creneauxAttempts.length > 0) {
          const allCreneauxIndices = new Set(creneauxAttempts.map((_, idx) => idx));
          setLockedAttempts(prev => ({
            ...prev,
            creneaux: allCreneauxIndices
          }));
          previousStatusRef.current.creneaux = 'reussi';
        }
        // Si une épreuve a 3 tentatives échouées, verrouiller automatiquement
        else if (loadedCreneauxStatus === 'echoue' && 
                 creneauxAttempts.length === MAX_ATTEMPTS &&
                 creneauxAttempts.every(a => a.result === 'echoue' || a.result === 'absent')) {
          const allCreneauxIndices = new Set(creneauxAttempts.map((_, idx) => idx));
          setLockedAttempts(prev => ({
            ...prev,
            creneaux: allCreneauxIndices
          }));
          previousStatusRef.current.creneaux = 'echoue';
        }
        
        if (loadedCodeStatus === 'reussi' && codeConduiteAttempts.length > 0) {
          const allCodeIndices = new Set(codeConduiteAttempts.map((_, idx) => idx));
          setLockedAttempts(prev => ({
            ...prev,
            codeConduite: allCodeIndices
          }));
          previousStatusRef.current.codeConduite = 'reussi';
        }
        // Si une épreuve a 3 tentatives échouées, verrouiller automatiquement
        else if (loadedCodeStatus === 'echoue' && 
                 codeConduiteAttempts.length === MAX_ATTEMPTS &&
                 codeConduiteAttempts.every(a => a.result === 'echoue' || a.result === 'absent')) {
          const allCodeIndices = new Set(codeConduiteAttempts.map((_, idx) => idx));
          setLockedAttempts(prev => ({
            ...prev,
            codeConduite: allCodeIndices
          }));
          previousStatusRef.current.codeConduite = 'echoue';
        }
        
        if (loadedVilleStatus === 'reussi' && tourVilleAttempts.length > 0) {
          const allVilleIndices = new Set(tourVilleAttempts.map((_, idx) => idx));
          setLockedAttempts(prev => ({
            ...prev,
            tourVille: allVilleIndices
          }));
          previousStatusRef.current.tourVille = 'reussi';
        }
        // Si une épreuve a 3 tentatives échouées, verrouiller automatiquement
        else if (loadedVilleStatus === 'echoue' && 
                 tourVilleAttempts.length === MAX_ATTEMPTS &&
                 tourVilleAttempts.every(a => a.result === 'echoue' || a.result === 'absent')) {
          const allVilleIndices = new Set(tourVilleAttempts.map((_, idx) => idx));
          setLockedAttempts(prev => ({
            ...prev,
            tourVille: allVilleIndices
          }));
          previousStatusRef.current.tourVille = 'echoue';
        }
        
        // Initialiser les statuts précédents avec les valeurs chargées
        previousStatusRef.current = {
          creneaux: loadedCreneauxStatus,
          codeConduite: loadedCodeStatus,
          tourVille: loadedVilleStatus
        };
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des résultats depuis /resultats:', err);
        console.error('📋 Détails de l\'erreur:', {
          message: err?.message,
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          data: err?.response?.data,
          url: err?.config?.url,
          params: err?.config?.params
        });
        
        // En cas d'erreur, initialiser avec des valeurs vides
        setValues({
          creneauxAttempts: [],
          codeConduiteAttempts: [],
          tourVilleAttempts: [],
          notes: ''
        });
        
        // Afficher une erreur seulement si ce n'est pas une 404 (pas de résultats = normal)
        if (err?.response?.status !== 404) {
          const errorMessage = err?.response?.data?.message || err?.message || 'Erreur lors du chargement des résultats';
          setError(errorMessage);
          console.error('🚨 Erreur affichée à l\'utilisateur:', errorMessage);
        } else {
          console.log('ℹ️ Aucun résultat trouvé (404) - c\'est normal pour un nouveau dossier');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadResultats();
  }, [open, dossier]);

  const addAttempt = React.useCallback((key: keyof EpreuvesResultat) => (a: EpreuveAttempt) => {
    const keyString = String(key);
    
    // Vérifier si on est déjà en train d'ajouter une tentative pour cette clé
    if (addingAttemptRef.current.has(keyString)) {
      console.warn('⚠️ Tentative d\'ajout déjà en cours pour', keyString);
      return;
    }
    
    addingAttemptRef.current.add(keyString);
    
    setValues(v => {
      const currentArray = (v[key] as any[] || []);
      // Vérifier qu'on n'a pas déjà atteint le maximum
      if (currentArray.length >= MAX_ATTEMPTS) {
        console.warn('⚠️ Maximum de tentatives atteint');
        addingAttemptRef.current.delete(keyString);
        return v;
      }
      // Vérifier que la tentative n'existe pas déjà (éviter les doublons)
      const newArray = [...currentArray, a];
      addingAttemptRef.current.delete(keyString);
      return { ...v, [key]: newArray as any };
    });
  }, []);
  const setAttempt = (key: keyof EpreuvesResultat) => (index: number, a: EpreuveAttempt) => {
    setValues(v => {
      const arr = [ ...(v[key] as any[] || []) ];
      arr[index] = a;
      return { ...v, [key]: arr as any };
    });
  };

  // Fonction pour verrouiller/déverrouiller une tentative
  const handleLockAttempt = React.useCallback((key: 'creneaux' | 'codeConduite' | 'tourVille') => (index: number) => {
    setLockedAttempts(prev => {
      const newSet = new Set(prev[key]);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return {
        ...prev,
        [key]: newSet
      };
    });
  }, []);

  const handleSave = async () => {
    if (!dossier) return;
    setSaving(true);
    setError(null);
    
    try {
      // Préparer les résultats pour chaque type d'examen
      const resultatsToSave: Array<{
        dossier_id: string;
        typeExamen: string;
        statut: string;
        date: string;
        commentaire: string;
      }> = [];
      
      // Créneaux
      (values.creneauxAttempts || []).forEach((attempt) => {
        resultatsToSave.push({
          dossier_id: dossier.id,
          typeExamen: 'creneaux',
          statut: attempt.result,
          date: attempt.date,
          commentaire: attempt.note || values.notes || ''
        });
      });
      
      // Code de conduite
      (values.codeConduiteAttempts || []).forEach((attempt) => {
        resultatsToSave.push({
          dossier_id: dossier.id,
          typeExamen: 'codeConduite',
          statut: attempt.result,
          date: attempt.date,
          commentaire: attempt.note || values.notes || ''
        });
      });
      
      // Tour de ville
      (values.tourVilleAttempts || []).forEach((attempt) => {
        resultatsToSave.push({
          dossier_id: dossier.id,
          typeExamen: 'tourVille',
          statut: attempt.result,
          date: attempt.date,
          commentaire: attempt.note || values.notes || ''
        });
      });
      
      // Envoyer chaque résultat à l'API
      const savePromises = resultatsToSave.map((resultat) =>
        axiosClient.post('/resultats', resultat)
      );
      
      await Promise.all(savePromises);
      
      // Calculer les statuts pour le callback
      const payload: EpreuvesResultat = {
        ...values,
        dateSaisie: new Date().toISOString(),
        creneaux: computeOverall(values.creneauxAttempts, values.creneaux),
        codeConduite: computeOverall(values.codeConduiteAttempts, values.codeConduite),
        tourVille: computeOverall(values.tourVilleAttempts, values.tourVille),
        general: computeGeneral(
          computeOverall(values.creneauxAttempts, values.creneaux),
          computeOverall(values.codeConduiteAttempts, values.codeConduite),
          computeOverall(values.tourVilleAttempts, values.tourVille)
        ),
      };
      
      onSaved && onSaved(payload);
      onClose();
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'enregistrement des résultats:', err);
      setError(err?.response?.data?.message || err?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // Calculer les statuts individuels de chaque épreuve (recalculé à chaque rendu)
  const overallCreneaux = computeOverall(values.creneauxAttempts, values.creneaux);
  const overallCode = computeOverall(values.codeConduiteAttempts, values.codeConduite);
  const overallVille = computeOverall(values.tourVilleAttempts, values.tourVille);
  
  // Fonction helper pour vérifier si une épreuve a 3 tentatives échouées
  const hasThreeFailedAttempts = (attempts: EpreuveAttempt[]): boolean => {
    return attempts.length === MAX_ATTEMPTS && 
           attempts.every(a => a.result === 'echoue' || a.result === 'absent');
  };
  
  // Détecter quand une épreuve passe à "reussi" et demander confirmation
  // Ne pas demander confirmation si l'épreuve est déjà verrouillée
  React.useEffect(() => {
    if (!open || !dossier || loading) return; // Ne pas déclencher pendant le chargement
    
    const creneauxAttempts = values.creneauxAttempts || [];
    const codeAttempts = values.codeConduiteAttempts || [];
    const tourVilleAttempts = values.tourVilleAttempts || [];
    
    const creneauxAttemptsCount = creneauxAttempts.length;
    const codeAttemptsCount = codeAttempts.length;
    const tourVilleAttemptsCount = tourVilleAttempts.length;
    
    const creneauxAlreadyLocked = overallCreneaux === 'reussi' && 
      creneauxAttemptsCount > 0 && 
      lockedAttempts.creneaux.size === creneauxAttemptsCount;
    const codeAlreadyLocked = overallCode === 'reussi' && 
      codeAttemptsCount > 0 && 
      lockedAttempts.codeConduite.size === codeAttemptsCount;
    const villeAlreadyLocked = overallVille === 'reussi' && 
      tourVilleAttemptsCount > 0 && 
      lockedAttempts.tourVille.size === tourVilleAttemptsCount;
    
    // Vérifier les créneaux - réussite
    if (overallCreneaux === 'reussi' && 
        previousStatusRef.current.creneaux !== 'reussi' && 
        !refusedLockRef.current.has('creneaux') &&
        !creneauxAlreadyLocked) {
      setLockConfirmation({
        open: true,
        type: 'creneaux',
        previousStatus: previousStatusRef.current.creneaux
      });
    }
    // Vérifier les créneaux - 3 tentatives échouées
    else if (hasThreeFailedAttempts(creneauxAttempts) && 
             overallCreneaux === 'echoue' &&
             lockedAttempts.creneaux.size !== creneauxAttemptsCount &&
             !refusedFailureLockRef.current.has('creneaux')) {
      setFailureConfirmation({
        open: true,
        type: 'creneaux'
      });
    }
    // Vérifier le code de conduite - réussite
    else if (overallCode === 'reussi' && 
             previousStatusRef.current.codeConduite !== 'reussi' && 
             !refusedLockRef.current.has('codeConduite') &&
             !codeAlreadyLocked) {
      setLockConfirmation({
        open: true,
        type: 'codeConduite',
        previousStatus: previousStatusRef.current.codeConduite
      });
    }
    // Vérifier le code de conduite - 3 tentatives échouées
    else if (hasThreeFailedAttempts(codeAttempts) && 
             overallCode === 'echoue' &&
             lockedAttempts.codeConduite.size !== codeAttemptsCount &&
             !refusedFailureLockRef.current.has('codeConduite')) {
      setFailureConfirmation({
        open: true,
        type: 'codeConduite'
      });
    }
    // Vérifier le tour de ville - réussite
    else if (overallVille === 'reussi' && 
             previousStatusRef.current.tourVille !== 'reussi' && 
             !refusedLockRef.current.has('tourVille') &&
             !villeAlreadyLocked) {
      setLockConfirmation({
        open: true,
        type: 'tourVille',
        previousStatus: previousStatusRef.current.tourVille
      });
    }
    // Vérifier le tour de ville - 3 tentatives échouées
    else if (hasThreeFailedAttempts(tourVilleAttempts) && 
             overallVille === 'echoue' &&
             lockedAttempts.tourVille.size !== tourVilleAttemptsCount &&
             !refusedFailureLockRef.current.has('tourVille')) {
      setFailureConfirmation({
        open: true,
        type: 'tourVille'
      });
    }
    
    // Mettre à jour les statuts précédents seulement si ce n'est pas un changement depuis le chargement initial
    if (previousStatusRef.current.creneaux !== overallCreneaux ||
        previousStatusRef.current.codeConduite !== overallCode ||
        previousStatusRef.current.tourVille !== overallVille) {
      previousStatusRef.current = {
        creneaux: overallCreneaux,
        codeConduite: overallCode,
        tourVille: overallVille
      };
    }
  }, [overallCreneaux, overallCode, overallVille, open, dossier, loading, values, lockedAttempts]);
  
  // Gérer la confirmation de verrouillage
  const handleLockConfirmation = (confirmed: boolean) => {
    if (confirmed && lockConfirmation.type) {
      // Verrouiller toutes les tentatives de cette épreuve
      const attempts = lockConfirmation.type === 'creneaux' 
        ? values.creneauxAttempts || []
        : lockConfirmation.type === 'codeConduite'
        ? values.codeConduiteAttempts || []
        : values.tourVilleAttempts || [];
      
      const allIndices = new Set(attempts.map((_, idx) => idx));
      setLockedAttempts(prev => ({
        ...prev,
        [lockConfirmation.type!]: allIndices
      }));
      // Retirer de la liste des refus si présent
      refusedLockRef.current.delete(lockConfirmation.type);
    } else if (lockConfirmation.type) {
      // L'utilisateur a refusé, ajouter à la liste des refus pour ne pas redemander
      refusedLockRef.current.add(lockConfirmation.type);
    }
    
    setLockConfirmation({
      open: false,
      type: null,
      previousStatus: null
    });
  };
  
  // Gérer la confirmation d'échec définitif (3 tentatives échouées)
  const handleFailureConfirmation = (confirmed: boolean) => {
    if (confirmed && failureConfirmation.type) {
      // Verrouiller toutes les tentatives de cette épreuve
      const attempts = failureConfirmation.type === 'creneaux' 
        ? values.creneauxAttempts || []
        : failureConfirmation.type === 'codeConduite'
        ? values.codeConduiteAttempts || []
        : values.tourVilleAttempts || [];
      
      const allIndices = new Set(attempts.map((_, idx) => idx));
      setLockedAttempts(prev => ({
        ...prev,
        [failureConfirmation.type!]: allIndices
      }));
      // Retirer de la liste des refus si présent
      refusedFailureLockRef.current.delete(failureConfirmation.type);
    } else if (failureConfirmation.type) {
      // L'utilisateur a refusé, ajouter à la liste des refus pour ne pas redemander
      refusedFailureLockRef.current.add(failureConfirmation.type);
    }
    
    setFailureConfirmation({
      open: false,
      type: null
    });
  };
  
  // Verrouiller une épreuve si elle est réussie ET toutes les tentatives sont verrouillées (après confirmation)
  const creneauxAttemptsCount = (values.creneauxAttempts || []).length;
  const codeAttemptsCount = (values.codeConduiteAttempts || []).length;
  const tourVilleAttemptsCount = (values.tourVilleAttempts || []).length;
  
  const creneauxLocked = overallCreneaux === 'reussi' && 
    creneauxAttemptsCount > 0 && 
    lockedAttempts.creneaux.size === creneauxAttemptsCount;
  const codeLocked = overallCode === 'reussi' && 
    codeAttemptsCount > 0 && 
    lockedAttempts.codeConduite.size === codeAttemptsCount;
  const villeLocked = overallVille === 'reussi' && 
    tourVilleAttemptsCount > 0 && 
    lockedAttempts.tourVille.size === tourVilleAttemptsCount;
  
  // Calculer le résultat général (recalculé automatiquement à chaque changement)
  const overallGeneral = computeGeneral(overallCreneaux, overallCode, overallVille);

  // Fonction pour obtenir le libellé et la couleur du statut global
  const getStatutGlobalInfo = (statut: EpreuveStatut) => {
    switch (statut) {
      case 'reussi':
        return { label: 'Validé', color: 'success' as const };
      case 'echoue':
        return { label: 'Échoué', color: 'error' as const };
      case 'absent':
        return { label: 'Absent', color: 'warning' as const };
      case 'non_saisi':
      default:
        return { label: 'Non saisi', color: 'default' as const };
    }
  };

  const statutGlobalInfo = getStatutGlobalInfo(overallGeneral);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      hideBackdrop
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: true,
        disableScrollLock: true,
      }}
      PaperProps={{ sx: { width: { xs: '100%', md: 720 } } }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
            <Typography variant="h6">Résultats d'épreuves</Typography>
          <Typography variant="body2" color="text.secondary">
            {dossier ? `${dossier.candidatNom} ${dossier.candidatPrenom} • ${dossier.reference}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 2, display: 'grid', gap: 3 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Chargement des résultats depuis l'API...
            </Typography>
          </Box>
        )}
        {!loading && (
          <>
          <Box>
          <Typography variant="subtitle1" gutterBottom>Résultat global</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={statutGlobalInfo.label}
              color={statutGlobalInfo.color}
              size="medium"
              variant={overallGeneral === 'non_saisi' ? 'outlined' : 'filled'}
            />
            <Typography variant="body2" color="text.secondary">
              ({overallGeneral})
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {overallGeneral === 'reussi' && '✅ Toutes les épreuves sont validées'}
            {overallGeneral === 'echoue' && '❌ Au moins une épreuve est échouée'}
            {overallGeneral === 'absent' && '⚠️ Au moins un candidat est absent'}
            {overallGeneral === 'non_saisi' && '📝 En attente de saisie des résultats'}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Créneaux:</strong> {overallCreneaux} | 
              <strong> Code:</strong> {overallCode} | 
              <strong> Tour de ville:</strong> {overallVille}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <EpreuveRow
          label={`Créneaux (statut: ${overallCreneaux})`}
          attempts={values.creneauxAttempts || []}
          onAdd={addAttempt('creneauxAttempts')}
          onChange={setAttempt('creneauxAttempts')}
          onLock={handleLockAttempt('creneaux')}
          lockedAttempts={lockedAttempts.creneaux}
          disabled={creneauxLocked}
        />
        <Divider />
        <EpreuveRow
          label={`Code de conduite (statut: ${overallCode})`}
          attempts={values.codeConduiteAttempts || []}
          onAdd={addAttempt('codeConduiteAttempts')}
          onChange={setAttempt('codeConduiteAttempts')}
          onLock={handleLockAttempt('codeConduite')}
          lockedAttempts={lockedAttempts.codeConduite}
          disabled={codeLocked}
        />
        <Divider />
        <EpreuveRow
          label={`Tour de ville (statut: ${overallVille})`}
          attempts={values.tourVilleAttempts || []}
          onAdd={addAttempt('tourVilleAttempts')}
          onChange={setAttempt('tourVilleAttempts')}
          onLock={handleLockAttempt('tourVille')}
          lockedAttempts={lockedAttempts.tourVille}
          disabled={villeLocked}
        />
        <Divider />
        <TextField
          label="Notes générales"
          value={values.notes || ''}
          onChange={(e) => setValues(v => ({ ...v, notes: e.target.value }))}
          multiline
          minRows={3}
        />
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button onClick={onClose}>Fermer</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </Stack>
          </>
        )}
      </Box>
      
      {/* Dialog de confirmation pour le verrouillage automatique (réussite) */}
      <Dialog
        open={lockConfirmation.open}
        onClose={() => handleLockConfirmation(false)}
        aria-labelledby="lock-confirmation-dialog-title"
        aria-describedby="lock-confirmation-dialog-description"
      >
        <DialogTitle id="lock-confirmation-dialog-title">
          Confirmer le verrouillage de l'épreuve
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="lock-confirmation-dialog-description">
            L'épreuve "{lockConfirmation.type === 'creneaux' ? 'Créneaux' : lockConfirmation.type === 'codeConduite' ? 'Code de conduite' : 'Tour de ville'}" a été réussie.
            <br />
            <br />
            Voulez-vous verrouiller cette épreuve pour empêcher toute modification ultérieure ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleLockConfirmation(false)} color="inherit">
            Annuler
          </Button>
          <Button onClick={() => handleLockConfirmation(true)} variant="contained" color="primary" autoFocus>
            Verrouiller
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog de confirmation pour l'échec définitif (3 tentatives échouées) */}
      <Dialog
        open={failureConfirmation.open}
        onClose={() => handleFailureConfirmation(false)}
        aria-labelledby="failure-confirmation-dialog-title"
        aria-describedby="failure-confirmation-dialog-description"
      >
        <DialogTitle id="failure-confirmation-dialog-title">
          Confirmer l'échec définitif de l'épreuve
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="failure-confirmation-dialog-description">
            L'épreuve "{failureConfirmation.type === 'creneaux' ? 'Créneaux' : failureConfirmation.type === 'codeConduite' ? 'Code de conduite' : 'Tour de ville'}" a échoué 3 fois.
            <br />
            <br />
            Voulez-vous verrouiller cette épreuve pour confirmer qu'elle est définitivement échouée ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleFailureConfirmation(false)} color="inherit">
            Annuler
          </Button>
          <Button onClick={() => handleFailureConfirmation(true)} variant="contained" color="error" autoFocus>
            Confirmer l'échec
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      hideBackdrop
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: true,
        disableScrollLock: true,
      }}
      PaperProps={{ sx: { width: { xs: '100%', md: 720 } } }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
            <Typography variant="h6">Résultats d'épreuves</Typography>
          <Typography variant="body2" color="text.secondary">
            {dossier ? `${dossier.candidatNom} ${dossier.candidatPrenom} • ${dossier.reference}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 2, display: 'grid', gap: 3 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Chargement des résultats depuis l'API...
            </Typography>
          </Box>
        )}
        {!loading && (
          <>
          <Box>
          <Typography variant="subtitle1" gutterBottom>Résultat global</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={statutGlobalInfo.label}
              color={statutGlobalInfo.color}
              size="medium"
              variant={overallGeneral === 'non_saisi' ? 'outlined' : 'filled'}
            />
            <Typography variant="body2" color="text.secondary">
              ({overallGeneral})
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {overallGeneral === 'reussi' && '✅ Toutes les épreuves sont validées'}
            {overallGeneral === 'echoue' && '❌ Au moins une épreuve est échouée'}
            {overallGeneral === 'absent' && '⚠️ Au moins un candidat est absent'}
            {overallGeneral === 'non_saisi' && '📝 En attente de saisie des résultats'}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Créneaux:</strong> {overallCreneaux} | 
              <strong> Code:</strong> {overallCode} | 
              <strong> Tour de ville:</strong> {overallVille}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <EpreuveRow
          label={`Créneaux (statut: ${overallCreneaux})`}
          attempts={values.creneauxAttempts || []}
          onAdd={addAttempt('creneauxAttempts')}
          onChange={setAttempt('creneauxAttempts')}
          onLock={handleLockAttempt('creneaux')}
          lockedAttempts={lockedAttempts.creneaux}
          disabled={creneauxLocked}
        />
        <Divider />
        <EpreuveRow
          label={`Code de conduite (statut: ${overallCode})`}
          attempts={values.codeConduiteAttempts || []}
          onAdd={addAttempt('codeConduiteAttempts')}
          onChange={setAttempt('codeConduiteAttempts')}
          onLock={handleLockAttempt('codeConduite')}
          lockedAttempts={lockedAttempts.codeConduite}
          disabled={codeLocked}
        />
        <Divider />
        <EpreuveRow
          label={`Tour de ville (statut: ${overallVille})`}
          attempts={values.tourVilleAttempts || []}
          onAdd={addAttempt('tourVilleAttempts')}
          onChange={setAttempt('tourVilleAttempts')}
          onLock={handleLockAttempt('tourVille')}
          lockedAttempts={lockedAttempts.tourVille}
          disabled={villeLocked}
        />
        <Divider />
        <TextField
          label="Notes générales"
          value={values.notes || ''}
          onChange={(e) => setValues(v => ({ ...v, notes: e.target.value }))}
          multiline
          minRows={3}
        />
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button onClick={onClose}>Fermer</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </Stack>
          </>
        )}
      </Box>
      
      {/* Dialog de confirmation pour le verrouillage automatique (réussite) */}
      <Dialog
        open={lockConfirmation.open}
        onClose={() => handleLockConfirmation(false)}
        aria-labelledby="lock-confirmation-dialog-title"
        aria-describedby="lock-confirmation-dialog-description"
      >
        <DialogTitle id="lock-confirmation-dialog-title">
          Confirmer le verrouillage de l'épreuve
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="lock-confirmation-dialog-description">
            L'épreuve "{lockConfirmation.type === 'creneaux' ? 'Créneaux' : lockConfirmation.type === 'codeConduite' ? 'Code de conduite' : 'Tour de ville'}" a été réussie.
            <br />
            <br />
            Voulez-vous verrouiller cette épreuve pour empêcher toute modification ultérieure ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleLockConfirmation(false)} color="inherit">
            Annuler
          </Button>
          <Button onClick={() => handleLockConfirmation(true)} variant="contained" color="primary" autoFocus>
            Verrouiller
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog de confirmation pour l'échec définitif (3 tentatives échouées) */}
      <Dialog
        open={failureConfirmation.open}
        onClose={() => handleFailureConfirmation(false)}
        aria-labelledby="failure-confirmation-dialog-title"
        aria-describedby="failure-confirmation-dialog-description"
      >
        <DialogTitle id="failure-confirmation-dialog-title">
          Confirmer l'échec définitif de l'épreuve
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="failure-confirmation-dialog-description">
            L'épreuve "{failureConfirmation.type === 'creneaux' ? 'Créneaux' : failureConfirmation.type === 'codeConduite' ? 'Code de conduite' : 'Tour de ville'}" a échoué 3 fois.
            <br />
            <br />
            Voulez-vous verrouiller cette épreuve pour confirmer qu'elle est définitivement échouée ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleFailureConfirmation(false)} color="inherit">
            Annuler
          </Button>
          <Button onClick={() => handleFailureConfirmation(true)} variant="contained" color="error" autoFocus>
            Confirmer l'échec
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default EpreuveSheet;



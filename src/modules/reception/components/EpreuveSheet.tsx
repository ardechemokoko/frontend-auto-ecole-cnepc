import React from 'react';
import { Box, Button, Divider, Drawer, IconButton, MenuItem, Select, SelectChangeEvent, Stack, TextField, Typography, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ReceptionDossier, EpreuvesResultat, EpreuveAttempt, EpreuveStatut } from '../types';
import { receptionService } from '../services/reception.service';

interface EpreuveSheetProps {
  open: boolean;
  onClose: () => void;
  dossier: ReceptionDossier | null;
  onSaved?: (results: EpreuvesResultat) => void;
}

const MAX_ATTEMPTS = 3;

/**
 * Calcule le statut d'une épreuve en fonction de ses tentatives
 * - Réussi : si au moins une tentative est réussie (peu importe l'ordre) → épreuve validée
 * - Échoué : si 3 tentatives ont été faites et aucune n'est réussie
 * - Absent : si la dernière tentative non "non_saisi" est absente (et pas encore échoué/réussi)
 * - Non saisi : si aucune tentative ou toutes les tentatives sont "non_saisi"
 */
function computeOverall(attempts?: EpreuveAttempt[], legacy?: EpreuveStatut): EpreuveStatut {
  // Si un statut legacy existe et n'est pas "non_saisi", le retourner
  if (legacy && legacy !== 'non_saisi') return legacy;
  
  // Si pas de tentatives, retourner "non_saisi"
  if (!attempts || attempts.length === 0) return 'non_saisi';
  
  // Si au moins une tentative est réussie, l'épreuve est réussie (peu importe l'ordre) → épreuve validée
  if (attempts.some(a => a.result === 'reussi')) return 'reussi';
  
  // Filtrer les tentatives qui ne sont pas "non_saisi" pour le calcul
  const validAttempts = attempts.filter(a => a.result !== 'non_saisi');
  
  // Si on a épuisé les 3 tentatives et qu'aucune n'est réussie, l'épreuve est échouée
  if (attempts.length >= MAX_ATTEMPTS && validAttempts.length > 0 && validAttempts.every(a => a.result !== 'reussi')) {
    return 'echoue';
  }
  
  // Si on a des tentatives avec des résultats valides, retourner le résultat de la dernière tentative valide
  if (validAttempts.length > 0) {
    return validAttempts[validAttempts.length - 1].result;
  }
  
  // Sinon, toutes les tentatives sont "non_saisi"
  return 'non_saisi';
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
  disabled?: boolean;
}> = ({ label, attempts, onAdd, onChange, disabled }) => {
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">{label}</Typography>
        <Button
          size="small"
          variant="outlined"
          disabled={disabled || attempts.length >= MAX_ATTEMPTS || attempts.some(a => a.result === 'reussi')}
          onClick={() => onAdd({ result: 'non_saisi' as EpreuveStatut, date: new Date().toISOString() })}
        >
          Ajouter tentative
        </Button>
      </Stack>
      <Stack spacing={1}>
        {attempts.map((a, idx) => (
          <Stack key={idx} direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ width: 60 }}>Tentative {idx + 1}</Typography>
            <Select
              size="small"
              value={a.result || 'non_saisi'}
              onChange={(e: SelectChangeEvent) => onChange(idx, { ...a, result: e.target.value as any })}
              sx={{ width: 160 }}
              disabled={disabled}
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
              disabled={disabled}
            />
            <TextField
              size="small"
              placeholder="Note (optionnel)"
              value={a.note || ''}
              onChange={(e) => onChange(idx, { ...a, note: e.target.value })}
              sx={{ flex: 1 }}
              disabled={disabled}
            />
          </Stack>
        ))}
        {attempts.length === 0 && (
          <Typography variant="body2" color="text.secondary">Aucune tentative saisie.</Typography>
        )}
      </Stack>
    </Box>
  );
};

const EpreuveSheet: React.FC<EpreuveSheetProps> = ({ open, onClose, dossier, onSaved }) => {
  const [saving, setSaving] = React.useState(false);
  const [values, setValues] = React.useState<EpreuvesResultat>({});

  React.useEffect(() => {
    if (!open || !dossier) return;
    const local = receptionService.getEpreuvesLocal(dossier.id);
    const initial: EpreuvesResultat = local || dossier.epreuves || {};
    setValues({
      ...initial,
      creneauxAttempts: initial.creneauxAttempts || [],
      codeConduiteAttempts: initial.codeConduiteAttempts || [],
      tourVilleAttempts: initial.tourVilleAttempts || [],
    });
  }, [open, dossier]);

  const addAttempt = (key: keyof EpreuvesResultat) => (a: EpreuveAttempt) => {
    setValues(v => ({ ...v, [key]: ([...(v[key] as any[] || []), a]) as any }));
  };
  const setAttempt = (key: keyof EpreuvesResultat) => (index: number, a: EpreuveAttempt) => {
    setValues(v => {
      const arr = [ ...(v[key] as any[] || []) ];
      arr[index] = a;
      return { ...v, [key]: arr as any };
    });
  };

  const handleSave = async () => {
    if (!dossier) return;
    setSaving(true);
    try {
      const payload: EpreuvesResultat = {
        ...values,
        dateSaisie: new Date().toISOString(),
        // compute legacy overall statuses for compatibility
        creneaux: computeOverall(values.creneauxAttempts, values.creneaux),
        codeConduite: computeOverall(values.codeConduiteAttempts, values.codeConduite),
        tourVille: computeOverall(values.tourVilleAttempts, values.tourVille),
        // résultat général basé sur la logique des trois épreuves
        general: computeGeneral(
          computeOverall(values.creneauxAttempts, values.creneaux),
          computeOverall(values.codeConduiteAttempts, values.codeConduite),
          computeOverall(values.tourVilleAttempts, values.tourVille)
        ),
      };
      await receptionService.saveEpreuves(dossier.id, payload);
      onSaved && onSaved(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Calculer les statuts individuels de chaque épreuve (recalculé à chaque rendu)
  const overallCreneaux = computeOverall(values.creneauxAttempts, values.creneaux);
  const overallCode = computeOverall(values.codeConduiteAttempts, values.codeConduite);
  const overallVille = computeOverall(values.tourVilleAttempts, values.tourVille);
  
  // Verrouiller une épreuve si :
  // - Au moins une tentative a réussi (l'épreuve est validée, on ne la repasse plus)
  // - OU si l'épreuve est échouée (3 tentatives sans réussite)
  const shouldLockEpreuve = (attempts: EpreuveAttempt[] | undefined, status: EpreuveStatut): boolean => {
    if (!attempts || attempts.length === 0) return false;
    
    // Si au moins une tentative a réussi, verrouiller immédiatement (épreuve validée)
    if (attempts.some(a => a.result === 'reussi')) return true;
    
    // Si échoué (3 tentatives sans réussite), verrouiller aussi
    if (status === 'echoue') return true;
    
    return false;
  };
  
  const creneauxLocked = shouldLockEpreuve(values.creneauxAttempts, overallCreneaux);
  const codeLocked = shouldLockEpreuve(values.codeConduiteAttempts, overallCode);
  const villeLocked = shouldLockEpreuve(values.tourVilleAttempts, overallVille);
  
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
          disabled={creneauxLocked}
        />
        <Divider />
        <EpreuveRow
          label={`Code de conduite (statut: ${overallCode})`}
          attempts={values.codeConduiteAttempts || []}
          onAdd={addAttempt('codeConduiteAttempts')}
          onChange={setAttempt('codeConduiteAttempts')}
          disabled={codeLocked}
        />
        <Divider />
        <EpreuveRow
          label={`Tour de ville (statut: ${overallVille})`}
          attempts={values.tourVilleAttempts || []}
          onAdd={addAttempt('tourVilleAttempts')}
          onChange={setAttempt('tourVilleAttempts')}
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
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default EpreuveSheet;



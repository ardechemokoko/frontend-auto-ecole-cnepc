import React from 'react';
import { Box, Button, Divider, Drawer, IconButton, MenuItem, Select, SelectChangeEvent, Stack, TextField, Typography } from '@mui/material';
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

function computeOverall(attempts?: EpreuveAttempt[], legacy?: EpreuveStatut): EpreuveStatut {
  if (legacy && legacy !== 'non_saisi') return legacy;
  if (!attempts || attempts.length === 0) return 'non_saisi';
  if (attempts.some(a => a.result === 'reussi')) return 'reussi';
  if (attempts.length >= MAX_ATTEMPTS && attempts.every(a => a.result !== 'reussi')) return 'echoue';
  return attempts[attempts.length - 1].result;
}

// Résultat général en fonction des trois épreuves
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
          disabled={disabled || attempts.length >= MAX_ATTEMPTS}
          onClick={() => onAdd({ result: 'echoue', date: new Date().toISOString() })}
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
              value={a.result}
              onChange={(e: SelectChangeEvent) => onChange(idx, { ...a, result: e.target.value as any })}
              sx={{ width: 160 }}
              disabled={disabled}
            >
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

  const overallCreneaux = computeOverall(values.creneauxAttempts, values.creneaux);
  const overallCode = computeOverall(values.codeConduiteAttempts, values.codeConduite);
  const overallVille = computeOverall(values.tourVilleAttempts, values.tourVille);
  const creneauxLocked = overallCreneaux === 'reussi';
  const codeLocked = overallCode === 'reussi';
  const villeLocked = overallVille === 'reussi';
  const overallGeneral = computeGeneral(overallCreneaux, overallCode, overallVille);

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
          <Typography variant="subtitle1">Résultat général</Typography>
          <Typography variant="body1" color="text.primary">{overallGeneral}</Typography>
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



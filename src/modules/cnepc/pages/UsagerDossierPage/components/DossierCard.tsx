import React from 'react';
import { Grid, Card, CardContent, Chip, Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Folder, Assignment, Timeline } from '@mui/icons-material';
import { Dossier } from '../../../types/auto-ecole';
import { getTypePermisLabel, getTypeDemandeName, getStatutLabel, getStatutColor, formatDate } from '../utils';
import { showCircuitToast } from './CircuitToast';

interface DossierCardProps {
  dossier: Dossier;
  isSelected: boolean;
  referentielsCache: Map<string, any>;
  typeDemandeCache: Map<string, any>;
  dossierStatusCache: Map<string, string>;
  onDossierClick: (dossierId: string) => void;
}

const DossierCard: React.FC<DossierCardProps> = React.memo(({
  dossier,
  isSelected,
  referentielsCache,
  typeDemandeCache,
  dossierStatusCache,
  onDossierClick,
}) => {
  const getCalculatedStatut = (d: Dossier): string => {
    return dossierStatusCache.get(d.id) || d.statut || 'en_attente';
  };

  const typePermis = getTypePermisLabel(dossier, referentielsCache);
  const typeDemande = getTypeDemandeName(dossier, typeDemandeCache);

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card
        elevation={isSelected ? 6 : 2}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          borderRadius: 0,
          background: isSelected 
            ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)'
            : 'background.paper',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: '100%',
            backgroundColor: isSelected ? 'primary.main' : 'divider',
            transition: 'all 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
            borderColor: 'primary.main',
            '&::before': {
              backgroundColor: 'primary.main',
              width: 5,
            },
          },
        }}
        onClick={() => onDossierClick(dossier.id)}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Folder 
              sx={{ 
                color: isSelected ? 'primary.main' : 'text.secondary',
                fontSize: 28 
              }} 
            />
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Voir le circuit du dossier">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    showCircuitToast({ dossier, typeDemandeCache });
                  }}
                  sx={{
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'primary.main',
                    },
                  }}
                >
                  <Timeline fontSize="small" />
                </IconButton>
              </Tooltip>
              <Chip
                label={getStatutLabel(getCalculatedStatut(dossier))}
                color={getStatutColor(getCalculatedStatut(dossier)) as any}
                size="small"
              />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.7rem',
                fontWeight: 600,
                mb: 0.5,
                display: 'block'
              }}
            >
              Type de Permis
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color: isSelected ? 'primary.main' : 'text.primary',
                mb: 1
              }}
            >
              {typePermis}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.7rem',
                fontWeight: 600,
                mb: 0.5,
                display: 'block'
              }}
            >
              Type de Demande
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                {typeDemande}
              </Typography>
            </Box>
          </Box>

          <Box 
            sx={{ 
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Date: {formatDate(dossier.date_creation || dossier.created_at)}
            </Typography>
            {dossier.formation?.nom && (
              <Typography variant="caption" color="text.secondary" noWrap>
                Formation: {dossier.formation.nom}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}, (prevProps, nextProps) => {
  // Ne re-rendre que si isSelected change ou si le dossier lui-même change
  return (
    prevProps.dossier.id === nextProps.dossier.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.dossierStatusCache.get(prevProps.dossier.id) === nextProps.dossierStatusCache.get(nextProps.dossier.id)
  );
});

DossierCard.displayName = 'DossierCard';

export default DossierCard;


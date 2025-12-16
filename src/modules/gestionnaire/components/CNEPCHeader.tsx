import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  School,
  People,
  Schedule,
  Quiz,
} from '@mui/icons-material';
import { CNEPCStats } from '../types';

interface CNEPCHeaderProps {
  stats: CNEPCStats;
  loading: boolean;
}

interface StatItemProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  loading: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, loading }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
      {icon}
    </Avatar>
    <Box>
      {loading ? (
        <CircularProgress size={16} sx={{ color: 'white' }} />
      ) : (
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, lineHeight: 1 }}>
          {value}
        </Typography>
      )}
      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem' }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

const CNEPCHeader: React.FC<CNEPCHeaderProps> = ({ stats, loading }) => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#f57c00', borderRadius: 0 }}>
      <Toolbar sx={{ flexWrap: 'wrap', py: 1 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, mb: { xs: 2, sm: 0 } }}>
          CENTRE NATIONAL D'EXAMEN DU PERMIS DE CONDUIRE
        </Typography>
        
        {/* Statistiques dans l'AppBar */}
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 3 }, flexWrap: 'wrap', alignItems: 'center' }}>
          <StatItem
            icon={<School sx={{ fontSize: 18 }} />}
            value={stats.totalAutoEcoles}
            label="Auto-Écoles"
            loading={loading}
          />

          <StatItem
            icon={<People sx={{ fontSize: 18 }} />}
            value={stats.totalCandidats}
            label="Candidats"
            loading={loading}
          />

          <StatItem
            icon={<Schedule sx={{ fontSize: 18 }} />}
            value={stats.totalSessions}
            label="Sessions"
            loading={loading}
          />

          <StatItem
            icon={<Quiz sx={{ fontSize: 18 }} />}
            value={stats.totalExamensReussis}
            label="Examens Réussis"
            loading={loading}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default CNEPCHeader;


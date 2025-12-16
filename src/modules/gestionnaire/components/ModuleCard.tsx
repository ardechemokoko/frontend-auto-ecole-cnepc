import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { ModuleCardProps } from '../types';

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  badge,
  chips,
  primaryAction,
  secondaryAction,
  avatarColor,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${avatarColor}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              {title}
            </Typography>
            {badge && (
              <Chip
                label={badge.label}
                color={badge.color}
                size="small"
                sx={{ mb: 1 }}
              />
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {chips.map((chip, index) => (
            <Chip
              key={index}
              icon={chip.icon}
              label={chip.label}
              size="small"
            />
          ))}
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={primaryAction.icon}
          onClick={primaryAction.onClick}
          sx={{ py: 1.5, mb: secondaryAction ? 1 : 0 }}
        >
          {primaryAction.label}
        </Button>
        {secondaryAction && (
          <Button
            variant="outlined"
            fullWidth
            startIcon={secondaryAction.icon}
            onClick={secondaryAction.onClick}
            sx={{ py: 1.5 }}
          >
            {secondaryAction.label}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ModuleCard;


import { Box, Button, TextField, Typography, CircularProgress } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { CaptchaResponse } from '../services/types';

interface CaptchaInputProps {
  value: string;
  onChange: (value: string) => void;
  onCaptchaIdChange: (captchaId: string) => void;
  error?: boolean;
  helperText?: string;
}

export const CaptchaInput = ({
  value,
  onChange,
  onCaptchaIdChange,
  error,
  helperText,
}: CaptchaInputProps) => {
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fetchCaptcha = async () => {
    try {
      setLoading(true);
      setImageError(false);
      const captchaData = await authService.getCaptcha();
      setCaptcha(captchaData);
      onCaptchaIdChange(captchaData.captcha_id);
      onChange(''); // Réinitialiser la valeur du champ
    } catch (error) {
      console.error('Erreur lors de la récupération du captcha:', error);
      setImageError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    fetchCaptcha();
  };

  const getCaptchaImageSrc = (imageData: string) => {
    if (imageData.startsWith('data:')) {
      return imageData;
    }
    return `data:image/png;base64,${imageData}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Code de vérification
        </Typography>
        <Button
          size="small"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          Actualiser
        </Button>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 100,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            bgcolor: '#f5f5f5',
          }}
        >
          <CircularProgress size={24} />
        </Box>
      ) : imageError ? (
        <Box
          sx={{
            p: 2,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            bgcolor: '#f5f5f5',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="error">
            Erreur lors du chargement du captcha
          </Typography>
          <Button size="small" onClick={handleRefresh} sx={{ mt: 1 }}>
            Réessayer
          </Button>
        </Box>
      ) : captcha ? (
        <Box>
          <Box
            component="img"
            src={getCaptchaImageSrc(captcha.image)}
            alt="Captcha"
            onError={() => setImageError(true)}
            sx={{
              width: '100%',
              maxWidth: 300,
              height: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              mb: 1,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
            onClick={handleRefresh}
            title="Cliquez pour actualiser"
          />
          <TextField
            label="Entrez le code ci-dessus"
            fullWidth
            value={value}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            helperText={helperText}
            size={window.innerWidth < 600 ? 'small' : 'medium'}
            autoComplete="off"
            inputProps={{
              style: { textTransform: 'uppercase' },
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
};


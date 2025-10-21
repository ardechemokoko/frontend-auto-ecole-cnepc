import React, { useState, useEffect } from 'react';
import { Button, TextField, Card, CardContent, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store';
import { authService } from '../services/authService';
import { User } from '../types';
import { ROUTES } from '../../../shared/constants';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const { login, setLoading, isLoading, isAuthenticated } = useAppStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirection automatique si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  // Afficher le loader pendant la vérification de l'authentification
  if (isLoading && !isAuthenticated) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#50C786', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Vérification de l'authentification...
          </Typography>
        </Box>
      </Box>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      // Utilisation du service mocké
      const authResponse = await authService.login({
        email: formData.email,
        password: formData.password,
      });
      
      // Conversion du type pour correspondre au store
      const user: User = {
        id: authResponse.user.id,
        email: authResponse.user.email,
        name: authResponse.user.name,
        role: authResponse.user.role as 'admin' | 'instructor' | 'student',
        createdAt: authResponse.user.createdAt,
      };
      
      login(user, authResponse.token);
      setMessage({ type: 'success', text: 'Connexion réussie !' });
      
      // Redirection vers le dashboard après connexion réussie
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 1000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur de connexion' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        backgroundColor: '#f5f5f5'
      }}
    >
      {/* Section gauche - Présentation */}
      <Box 
        sx={{ 
          flex: { xs: 'none', lg: 1 },
          height: { xs: '40vh', lg: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #50C786 0%, #40B676 100%)',
          color: 'white',
          p: { xs: 3, sm: 4 },
          position: 'relative'
        }}
      >
        <Box sx={{ 
          textAlign: 'center', 
          maxWidth: { xs: '100%', sm: 500 },
          px: { xs: 2, sm: 0 }
        }}>
          {/* Images officielles */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: { xs: 2, sm: 3, md: 4 },
            mb: { xs: 2, sm: 3 },
            flexWrap: 'wrap'
          }}>
            <Box sx={{ 
              width: { xs: 60, sm: 80, md: 100 },
              height: { xs: 60, sm: 80, md: 100 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/src/assets/img/blason.png" 
                alt="Blason du Gabon" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }}
              />
            </Box>
            <Box sx={{ 
              width: { xs: 60, sm: 80, md: 100 },
              height: { xs: 60, sm: 80, md: 100 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/src/assets/img/mtt.png" 
                alt="Ministère des Transports" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }}
              />
            </Box>
          </Box>
          
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem' }
            }}
            className="font-display"
          >
            Portail Auto-École
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              mb: { xs: 3, sm: 4 },
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.3rem' },
              display: { xs: 'none', sm: 'block' }
            }}
            className="font-primary"
          >
            Logiciel officiel du Ministère des Transports, de la Marine Marchande et de la Logistique
          </Typography>
          
          {/* Version mobile du texte */}
          <Typography 
            variant="body1" 
            sx={{ 
              mb: { xs: 3, sm: 4 },
              fontWeight: 400,
              lineHeight: 1.4,
              fontSize: '0.9rem',
              display: { xs: 'block', sm: 'none' }
            }}
            className="font-primary"
          >
            Logiciel officiel du Ministère des Transports
          </Typography>
          
          <Box sx={{ mt: { xs: 3, sm: 6 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: { xs: '0.9rem', sm: '1.1rem' }
              }}
            >
              Développé par
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                mt: 1,
                fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' }
              }}
            >
              Rengus Digital
            </Typography>
          </Box>
          
        </Box>
      </Box>

      {/* Section droite - Formulaire de connexion */}
      <Box 
        sx={{ 
          flex: { xs: 1, lg: 1 },
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: { xs: 2, sm: 3, md: 4 },
          minHeight: { xs: '60vh', lg: 'auto' },
          position: 'relative',
          backgroundImage: 'url(/src/assets/img/back-driver.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/src/assets/img/back-driver.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            zIndex: -1
          }
        }}
      >
        <Card sx={{ 
          width: '100%', 
          maxWidth: { xs: '100%', sm: 400 }, 
          boxShadow: { xs: 1, sm: 3 },
          mx: { xs: 1, sm: 0 },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 1
        }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                textAlign: 'center', 
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
              className="font-display"
            >
              Connexion
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                textAlign: 'center', 
                mb: 3, 
                color: 'text.secondary',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
              className="font-primary"
            >
              Accédez à votre espace de gestion
            </Typography>
            
            {message && (
              <Alert 
                severity={message.type} 
                sx={{ mb: 2 }}
                onClose={() => setMessage(null)}
              >
                {message.text}
              </Alert>
            )}
            
            <form onSubmit={onSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  size={window.innerWidth < 600 ? 'small' : 'medium'}
                />
                
                <TextField
                  label="Mot de passe"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!errors.password}
                  helperText={errors.password}
                  size={window.innerWidth < 600 ? 'small' : 'medium'}
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size={window.innerWidth < 600 ? 'medium' : 'large'}
                  disabled={isLoading}
                  sx={{
                    mt: { xs: 1.5, sm: 2 },
                    backgroundColor: '#50C786',
                    '&:hover': { backgroundColor: '#40B676' },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    py: { xs: 1.5, sm: 2 }
                  }}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
        
        {/* Lignes colorées décoratives en bas de la section droite */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          height: 8 
        }}>
          <Box sx={{ flex: 1, backgroundColor: '#2E8B57', height: '100%' }} />
          <Box sx={{ flex: 1, backgroundColor: '#FFD700', height: '100%' }} />
          <Box sx={{ flex: 1, backgroundColor: '#1E90FF', height: '100%' }} />
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm;

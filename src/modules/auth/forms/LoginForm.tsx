import { Alert, Box, Button, Card, CardContent, CircularProgress, Link, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';
import { useAppStore } from '../../../store';
import { tokenService } from '../services';
import { authService } from '../services/authService';

import { User, MeResponse } from '../types';
import { AutoEcoleDetailResponse } from '../../cnepc/types/auto-ecole';


interface LoginFormData {
  email: string;
  password: string;
}
export interface FormDataEmail {
  email: string;
}

const LoginForm: React.FC = () => {
  const { login, setLoading, isLoading, isAuthenticated } = useAppStore();
  const [isLoadingSendEmail, setIsLoadingSendEmail] = useState<boolean>(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [forgotPassword, setForgotPassword] = useState<boolean>(false);
  const [emailerrors, setMailerrors] = useState<String>('');
  const [emailData, setEmailFormData] = useState<FormDataEmail>({
    email: "",
  });


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

  // Afficher l'envoi des email
  if (isLoadingSendEmail) {
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
            Envoi de Mail En cours...
          </Typography>
        </Box>
      </Box>
    );
  }

  //   if (isLoadingSendEmailError) {
  //   return (
  //     <Box
  //       sx={{
  //         minHeight: '100vh',
  //         display: 'flex',
  //         alignItems: 'center',
  //         justifyContent: 'center',
  //         backgroundColor: '#f5f5f5'
  //       }}
  //     >
  //       <Box sx={{ textAlign: 'center' }}>
  //         <CircularProgress size={60} sx={{ color: '#50C786', mb: 2 }} />
  //         <Typography variant="h6" color="text.secondary">
  //           Envoi de Mail En cours...
  //         </Typography>
  //       </Box>
  //     </Box>
  //   );
  // }
  const validateEmail = (): boolean => {
    const newErrors: Partial<String> = {};
    if (!emailData.email) {
      setMailerrors('L\'email est requis')
    } else if (!/\S+@\S+\.\S+/.test(emailData.email)) {
      setMailerrors('Email invalide')
    }
    return Object.keys(newErrors).length === 0;
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

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();

    setEmailFormData({
      email: value
    });
    if (!emailData.email) {
      setMailerrors('L\'email est requis')
    } else if (!/\S+@\S+\.\S+/.test(emailData.email)) {
      setMailerrors('Email invalide')
    } else {
      setMailerrors('')
    }
    if (emailData.email = "") {
      setMailerrors('')
    }
  };

  const onSubmitForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateEmail()) {
      return;
    }
    try {
      if (emailData.email != "") {
        setIsLoadingSendEmail(true);
      }
      //
      const rest = await authService.forgotPassword(emailData);
      if (rest) {
        setMessage({ type: 'success', text: 'Veuillez consulter votre email' });

      }
      // console.log(rest)
    } catch (e) {
      setIsLoadingSendEmail(false);
      console.log(e)
    }
    setTimeout(() => {
      navigate(ROUTES.RPW);
    }, 1000);
    // console.log(emailData.email)
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (formData.email != "" && formData.password != "") {
        setLoading(true);
      }

      setMessage(null);

      // Utilisation du service mocké
      const authResponse = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      //console.log(authResponse);

      // Vérifier si le token est bien un JWT
      const token = authResponse.data.access_token;
      
      // Vérifier le rôle utilisateur via l'endpoint /auth/me
      console.log('🔍 Vérification du rôle utilisateur...');
      const meResponse: MeResponse = await authService.getCurrentUser(token);
      
      if (!meResponse.success) {
        throw new Error('Erreur lors de la vérification du rôle utilisateur');
      }

      // Conversion du type pour correspondre au store avec les données vérifiées
      const user: User = {
        id: meResponse.user.id,
        email: meResponse.user.email,
        name: meResponse.user.personne.nom_complet,
        role: meResponse.user.role as 'admin' | 'instructor' | 'student' | 'candidat' | 'responsable_auto_ecole',
        createdAt: new Date(meResponse.user.created_at),
        created_at: meResponse.user.created_at,
        personne: meResponse.user.personne
      };

      // Si l'utilisateur est responsable d'auto-école, récupérer les informations de l'auto-école
      let autoEcoleInfo: AutoEcoleDetailResponse | null = null;
      if (user.role === 'responsable_auto_ecole') {
        console.log('🏫 Récupération des informations de l\'auto-école...');
        try {
          // Trouver l'ID du responsable dans les données utilisateur
          const responsableId = meResponse.user.personne.id;
          autoEcoleInfo = await authService.findAutoEcoleByResponsableId(responsableId, token);
          
          if (autoEcoleInfo) {
            console.log('✅ Informations auto-école récupérées:', autoEcoleInfo.data.nom_auto_ecole);
            // Stocker les informations de l'auto-école dans le localStorage
            localStorage.setItem('auto_ecole_info', JSON.stringify(autoEcoleInfo.data));
          } else {
            console.warn('⚠️ Aucune auto-école trouvée pour ce responsable');
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération des informations auto-école:', error);
          // Ne pas bloquer la connexion si la récupération de l'auto-école échoue
        }
      }

      // login(user, token);
      // setMessage({ type: 'success', text: 'Connexion réussie !' });
      // tokenService.setAuthData(token, user);
   
      if (user.role !== 'candidat') {
        login(user, token);
        setMessage({ type: 'success', text: 'Connexion réussie !' });
        tokenService.setAuthData(token, user);

        console.log('✅ Token sauvegardé dans localStorage avec la clé "access_token"');
      console.log('✅ Token sauvegardé dans localStorage avec la clé "access_token"');
      console.log('✅ Rôle utilisateur vérifié:', user.role);
      if (autoEcoleInfo) {
        console.log('✅ Informations auto-école sauvegardées');
      }

        // Redirection vers le dashboard après connexion réussie
        setTimeout(() => {
          navigate(ROUTES.DASHBOARD);
        }, 1000);
      }else{
        setMessage({ type: 'error', text: 'Accès refusé. Vous n\'êtes pas autorisé à accéder à cette application.' });
        tokenService.clearAll()
        //authService.logoutBackEnd();
      }

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

          {/* <Box sx={{ mt: { xs: 3, sm: 6 } }}>
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
          </Box> */}

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
              {forgotPassword ? "Mot de passe oublié" : "Connexion"}

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
            {forgotPassword ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
              <form onSubmit={onSubmitForgotPassword}>
                <TextField
                  label="Email"
                  type="email"

                  fullWidth
                  value={emailData.email}
                  onChange={handleEmailChange}
                  error={!!emailerrors}
                  helperText={emailerrors}
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
                  Envoi Email
                </Button>
              </form>

              <Box textAlign="right" mt={1}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setForgotPassword((prev) => !prev)
                  }}
                  underline="hover"
                  sx={{
                    fontSize: "0.85rem",
                    color: "text.secondary",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  connexion
                </Link>
              </Box>
            </Box> : <form onSubmit={onSubmit}>
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
                {/* <Box textAlign="right" mt={1}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => {
                      setForgotPassword((prev) => !prev)
                    }}
                    underline="hover"
                    sx={{
                      fontSize: "0.85rem",
                      color: "text.secondary",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    Mot de passe oublié
                  </Link>
                </Box> */}
              </Box>
            </form>}

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

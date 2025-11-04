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
  const [isLoadingSendEmail,] = useState<boolean>(false);
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
          <CircularProgress size={60} sx={{ color: '#1976D2', mb: 2 }} />
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
          <CircularProgress size={60} sx={{ color: '#1976D2', mb: 2 }} />
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
      const refreshToken = authResponse.data.refresh_token;
      
      // Sauvegarder le refresh_token si présent
      if (refreshToken) {
        tokenService.setRefreshToken(refreshToken);
        console.log('✅ Refresh token sauvegardé');
      }
      
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
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: '#eee'
      }}
    >
      {/* Panneau gauche avec image + voile bleu */}
      <Box
        sx={{
          flex: 1,
          minHeight: { xs: 300, md: '100vh' },
          backgroundImage: 'url(/src/assets/img/img1.avif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          color: 'white',
          overflow: 'hidden'
        }}
      >
        {/* Voile bleu */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(25, 118, 210, 0.85)',
            opacity: 0.85
          }}
        />

        {/* Contenu */}
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 4,
            zIndex: 1,
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/src/assets/img/drapeau_sceau.jpg"
              alt="Drapeau Gabon"
              sx={{
                width: 70,
                height: 45,
                borderRadius: '2px',
              }}
            />
            <Typography
              variant="body1"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Portail National des Titres <br/>
              et Actes de Transport Terrestre Sécurisé
            </Typography>
          </Box>

          {/* Main Content */}
          <Box sx={{ maxWidth: '500px' }}>
            <Typography
              variant="h3"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: { md: '2rem', lg: '3rem' },
                lineHeight: 1,
                mb: 3,
                textAlign: 'justify',
                
              }}
            >
              Bienvenue dans l'espace de gestion des auto-écoles 
              et des examens de permis de conduire!
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'white',
                fontSize: '1rem',
                lineHeight: 1.5,
                opacity: 0.95,
                textAlign: 'justify',
              }}
            >
              Connectez-vous pour gérer les dossiers, inscrire des candidats, gérer les examens,
              accéder à vos documents officiels ou utiliser les services en
              ligne du ministère des Transports. Votre compte vous ouvre les
              portes d'une administration plus rapide, plus simple et entièrement
              numérique.
            </Typography>
          </Box>


          {/* Footer */}
          <Typography
            variant="body2"
            sx={{
              color: 'white',
              fontSize: '0.875rem',
              opacity: 0.8,
            }}
          >
            Copyright © 2025. Rengus Digital, tous droits reservés.
          </Typography>
        </Box>
      </Box>

      {/* Panneau droit: formulaire sur fond blanc */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 6 }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 520 }}>
          <Typography
            variant="h5"
            sx={{ mb: 3, fontWeight: 700 }}
          >
            Se connecter
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

          {(
            <form onSubmit={onSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    mt: 1,
                    backgroundColor: '#1976D2',
                    '&:hover': { backgroundColor: '#1565C0' }
                  }}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>

                
              </Box>
            </form>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm;

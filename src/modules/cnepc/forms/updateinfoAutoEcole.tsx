
import React, { useState, useEffect } from 'react';
import { Button, TextField, Card, CardContent, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store';
// import { authService } from '../services/authService';
// import { tokenService } from '../services';
// import { User } from '../types';
import { ROUTES } from '../../../shared/constants';
const PageUpdateAutoecole: React.FC = () => {
     return (    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        backgroundColor: '#f5f5f5'
      }}
    >
      {/* Section gauche - Présentation */}


      {/* Section droite - Formulaire de connexion */}
      <Box 
        sx={{ 
          flex: { xs: 1, lg: 1 },
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: { xs: 2, sm: 3, md: 4 },
          minHeight: { xs: '6vh', lg: 'auto' },
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
              Modifier vos informations
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
            
            {/* {message && (
              <Alert 
                severity={message.type} 
                sx={{ mb: 2 }}
                onClose={() => setMessage(null)}
              >
                {message.text}
              </Alert>
            )} */}
            
            <form >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                 
                  size={window.innerWidth < 600 ? 'small' : 'medium'}
                />
                
                <TextField
                  label="Mot de passe"
                  type="password"
                  fullWidth
                
                  size={window.innerWidth < 600 ? 'small' : 'medium'}
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size={window.innerWidth < 600 ? 'medium' : 'large'}
                 
                  sx={{
                    mt: { xs: 1.5, sm: 2 },
                    backgroundColor: '#50C786',
                    '&:hover': { backgroundColor: '#40B676' },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    py: { xs: 1.5, sm: 2 }
                  }}
                >
              
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
    </Box>);
}
export default PageUpdateAutoecole;
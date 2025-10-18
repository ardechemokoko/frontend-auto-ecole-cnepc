import React, { useState } from 'react';
import { Button, TextField, Card, CardContent, Typography, Box, Alert } from '@mui/material';
import { useAppStore } from '../../../store';
import { authService } from '../services/authService';
import { User } from '../types';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const { login, setLoading, isLoading } = useAppStore();
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ textAlign: 'center', mb: 3 }}
          >
            Connexion
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
              />
              
              <TextField
                label="Mot de passe"
                type="password"
                fullWidth
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
              />
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                sx={{
                  mt: 2,
                  backgroundColor: '#50C786',
                  '&:hover': { backgroundColor: '#40B676' },
                }}
              >
                        {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;

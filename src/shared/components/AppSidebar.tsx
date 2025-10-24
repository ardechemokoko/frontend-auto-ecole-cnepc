import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  People as UserGroupIcon,
  CheckCircle as CheckCircleIcon,
  Send as PaperAirplaneIcon,
  Business as BuildingOffice2Icon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Notifications as BellIcon,
  Logout as ArrowRightOnRectangleIcon,
  ExpandMore as ChevronDownIcon,
} from '@mui/icons-material';
import { ROUTES } from '../constants';

interface AppSidebarProps {
  open: boolean;
  onToggle: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAppStore();
  const [candidatsOpen, setCandidatsOpen] = useState(false);

  const menuItems = [
    {
      title: 'Tableau de bord',
      icon: HomeIcon,
      path: ROUTES.DASHBOARD,
      description: 'Vue d\'ensemble de l\'application'
    },
    {
      title: 'Gestion des Candidats',
      icon: UserGroupIcon,
      path: ROUTES.ELEVES,
      description: 'Inscrire et gérer les dossiers des candidats',
      hasSubmenu: true,
      submenu: [
        {
          path: `${ROUTES.ELEVES}/demandes`,
          title: 'Demandes d\'inscription',
          description: 'Voir les demandes d\'inscription'
        },
        {
          path: `${ROUTES.ELEVES}/inscrits`,
          title: 'Candidats inscrits',
          description: 'Voir les candidats inscrits'
        },
        {
          path: `${ROUTES.ELEVES}/nouvelle`,
          title: 'Nouvelle inscription',
          description: 'Créer une nouvelle inscription'
        }
      ]
    },
    {
      title: 'Validation des Dossiers',
      icon: CheckCircleIcon,
      path: ROUTES.VALIDATION,
      description: 'Valider les dossiers complets des élèves'
    },
    {
      title: 'Envoi CNEPC',
      icon: PaperAirplaneIcon,
      path: ROUTES.CNEPC,
      description: 'Transmettre les dossiers validés au CNEPC'
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const isActive = (path: string) => {
    if (path === ROUTES.DASHBOARD) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: open ? 240 : 64,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? 240 : 64,
            boxSizing: 'border-box',
            transition: 'width 0.3s ease-in-out',
            overflowX: 'hidden',
            backgroundColor: '#3A75C4',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: '#2A5A9A',
            color: 'white',
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'white',
              width: 40,
              height: 40,
            }}
          >
            <img
              src="/src/assets/img/mtt.png"
              alt="DGTT Gabon"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
            />
          </Avatar>
          {open && (
            <Box sx={{ ml: 1, minWidth: 0, transition: 'all 0.3s ease-in-out' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                DGTT Gabon
              </Typography>
              <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
                Espace Administration
              </Typography>
            </Box>
          )}
        </Box>

        {/* Navigation */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List sx={{ px: 1, py: 2 }}>
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              const isCandidatsItem = item.title === 'Gestion des Candidats';
              
              return (
                <React.Fragment key={item.path}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        if (isCandidatsItem && item.hasSubmenu) {
                          setCandidatsOpen(!candidatsOpen);
                        } else {
                          handleNavigation(item.path);
                        }
                      }}
                      sx={{
                        mx: 1,
                        borderRadius: 2,
                        mb: 0.5,
                        backgroundColor: active ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                        borderLeft: active ? '4px solid white' : 'none',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: active ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      title={open ? item.description : item.title}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: open ? 40 : 'auto',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        <IconComponent />
                      </ListItemIcon>
                      {open && (
                        <>
                          <ListItemText
                            primary={item.title}
                            primaryTypographyProps={{
                              variant: 'body2',
                              fontWeight: active ? 'medium' : 'normal',
                              color: 'white',
                            }}
                          />
                          {isCandidatsItem && item.hasSubmenu && (
                            <ChevronDownIcon
                              sx={{
                                transform: candidatsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease-in-out',
                              }}
                            />
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>
                  
                  {/* Submenu for candidats */}
                  {open && isCandidatsItem && item.hasSubmenu && (
                    <Collapse in={candidatsOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.submenu?.map((subItem) => {
                          const subActive = isActive(subItem.path);
                          return (
                            <ListItem key={subItem.path} disablePadding>
                              <ListItemButton
                                onClick={() => handleNavigation(subItem.path)}
                                sx={{
                                  ml: 4,
                                  mr: 1,
                                  borderRadius: 2,
                                  mb: 0.5,
                                  backgroundColor: subActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                  color: subActive ? 'white' : 'rgba(255, 255, 255, 0.8)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                  },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              >
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontSize: '0.875rem',
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </Box>

        {/* User Info & Actions */}
        <Box sx={{ mt: 'auto' }}>
          {/* User Info */}
          <Box
            sx={{
              backgroundColor: '#1A4A8A',
              color: 'white',
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: 'green',
                  width: 32,
                  height: 32,
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              {open && (
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'white' }}>
                    {user?.name || 'Utilisateur'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Administrateur
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Logout Button */}
          <Box
            sx={{
              backgroundColor: '#0A3A7A',
              color: 'white',
              p: 2,
            }}
          >
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              title="Se déconnecter"
            >
              <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', justifyContent: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: 'white',
                    width: 32,
                    height: 32,
                  }}
                >
                  <ArrowRightOnRectangleIcon sx={{ color: '#3A75C4' }} />
                </Avatar>
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary="Déconnexion"
                  secondary="Se déconnecter"
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold', color: 'white' }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'white', opacity: 0.8 }}
                />
              )}
            </ListItemButton>
          </Box>
        </Box>
      </Drawer>

      {/* Toggle Button */}
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'fixed',
          top: '50%',
          left: open ? 240 : 64,
          transform: 'translateY(-50%)',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
          },
          transition: 'all 0.3s ease-in-out',
          display: { xs: 'none', sm: 'flex' },
        }}
        title={open ? 'Réduire la sidebar' : 'Étendre la sidebar'}
      >
        {open ? <ChevronLeftIcon color="primary" /> : <ChevronRightIcon color="primary" />}
      </IconButton>

      {/* Mobile Bottom Bar */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: '#3A75C4',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            display: { xs: 'block', sm: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', py: 1 }}>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              return (
                <IconButton
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    flexDirection: 'column',
                    color: 'white',
                    p: 1,
                    minWidth: 0,
                    flex: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                  title={item.title}
                >
                  <IconComponent sx={{ fontSize: 20, mb: 0.5 }} />
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'white' }}>
                    {item.title.split(' ')[0]}
                  </Typography>
                </IconButton>
              );
            })}
          </Box>
        </Box>
      )}
    </>
  );
};

export default AppSidebar;

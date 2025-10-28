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
  Edit as EditIcon,
  Refresh as Ref,
  People as UserGroupIcon,
  CheckCircle as CheckCircleIcon,
  Send as PaperAirplaneIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as ArrowRightOnRectangleIcon,
  ExpandMore as ChevronDownIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Password,
} from '@mui/icons-material';
import { ROUTES } from '../constants';
import tokenService from '../../modules/auth/services/tokenService';
import { authService } from '../../modules/auth/services/authService';
import { canAccessMenu } from '../utils/permissions';

interface AppSidebarProps {
  open: boolean;
  onToggle: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAppStore();
  const [candidatsOpen, setCandidatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cnepcOpen, setCnepcOpen] = useState(false);

  // Définition de tous les menus possibles avec leurs clés
  const allMenuItems = [
    {
      title: 'Tableau de bord',
      icon: HomeIcon,
      path: ROUTES.DASHBOARD,
      description: 'Vue d\'ensemble de l\'application',
      key: 'dashboard'
    },
    {
      title: 'Modifier Vos informations personnelles',
      icon: PersonIcon,
      path: ROUTES.UPDATE,
      description: 'modifier les informations de l\' auto-école',
      key: 'update'
    },
    {
      title: 'Referentiel',
      icon: Ref,
      path: ROUTES.REF,
      description: 'reference de l\' auto-école'
    },
    {
      title: 'Change mot de passe',
      icon: Password,
      path: ROUTES.CPW,
      description: 'changement de mot de passe'
    },
    {
      title: 'Gestion des Candidats',
      icon: UserGroupIcon,
      path: ROUTES.ELEVES,
      description: 'Inscrire et gérer les dossiers des candidats',
      key: 'candidates',
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
      description: 'Valider les dossiers complets des élèves',
      key: 'validation'
    },
    {
      title: 'CNEPC',
      icon: PaperAirplaneIcon,
      path: ROUTES.CNEPC,
      description: 'Gestion CNEPC et Auto-Écoles',
      hasSubmenu: true,
      submenu: [
        {
          path: ROUTES.AUTO_ECOLES,
          title: 'Gestion des Auto-Écoles',
          description: 'Gérer les auto-écoles et leurs candidats inscrits'
        },
        {
          path: ROUTES.CNEPC,
          title: 'Management',
          description: 'Transmettre les dossiers validés au CNEPC'
        }
      ]
    },
    {
      title: 'Paramètres',
      icon: SettingsIcon,
      path: ROUTES.SETTINGS,
      description: 'Configuration et gestion du système',
      key: 'settings',
      hasSubmenu: true,
      submenu: [
        {
          path: ROUTES.USER_MANAGEMENT,
          title: 'Gestion d\'utilisateurs',
          description: 'Créer et gérer les opérateurs'
        }
      ]
    },
    {
      title: 'Workflow',
      icon: UserGroupIcon,
      path: ROUTES.WORKFLOW,
      description: 'Gestion du workflow',
      hasSubmenu: true,
      submenu: [
        {
          path: ROUTES.WORKFLOW_CIRCUIT,
          title: 'Circuits',
          description: 'Créer et gérer les circuits de validation'
        },
        {
          path: ROUTES.WORKFLOW_STATUT,
          title: 'Statuts',
          description: 'Créer et gérer les status'
        },
      ]
    },
  ];

  // Filtrer les menus selon les permissions de l'utilisateur
  console.log('🎭 AppSidebar: Filtrage des menus pour l\'utilisateur', {
    userRole: user?.role,
    userName: user?.name || user?.email,
    totalMenus: allMenuItems.length
  });
  
  const menuItems = allMenuItems.filter(item => {
    const hasAccess = canAccessMenu(user, item.key!);
    console.log('🎭 AppSidebar: Menu', item.title, '->', hasAccess ? 'AUTORISÉ' : 'REFUSÉ');
    return hasAccess;
  });
  
  console.log('🎭 AppSidebar: Menus finaux autorisés', {
    count: menuItems.length,
    menus: menuItems.map(item => item.title)
  });

  const handleNavigation = (path: string) => {
    navigate(path);
    // Ne pas fermer la sidebar sur desktop
    if (isMobile) {
      // Sur mobile, on peut laisser la sidebar se fermer
    }
  };

  const handleLogout = () => {
    try {
      authService.logoutBackEnd();
      tokenService.clearAll()
      logout();
      navigate(ROUTES.LOGIN);
    } catch (e) {

    }
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
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isCandidatsItem = item.title === 'Gestion des Candidats';
              const isSettingsItem = item.title === 'Paramètres';
              const isCnepcItem = item.title === 'CNEPC';
              return (
                <React.Fragment key={item.path}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        if (isCandidatsItem && item.hasSubmenu) {
                          setCandidatsOpen(!candidatsOpen);
                        } else if (isSettingsItem && item.hasSubmenu) {
                          setSettingsOpen(!settingsOpen);
                        } else if (isCnepcItem && item.hasSubmenu) {
                          setCnepcOpen(!cnepcOpen);
                        } else {
                          handleNavigation(item.path);
                        }
                      }}
                      sx={{
                        mx: 1,
                        borderRadius: 2,
                        mb: 0.5,
                        backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                        borderLeft: isActive(item.path) ? '4px solid white' : 'none',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
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
                              fontWeight: isActive(item.path) ? 'medium' : 'normal',
                              color: 'white',
                            }}
                          />
                          {(isCandidatsItem || isSettingsItem || isCnepcItem) && item.hasSubmenu && (
                            <ChevronDownIcon
                              sx={{
                                transform: (isCandidatsItem ? candidatsOpen : (isSettingsItem ? settingsOpen : cnepcOpen)) ? 'rotate(180deg)' : 'rotate(0deg)',
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

                  {/* Submenu for settings */}
                  {open && isSettingsItem && item.hasSubmenu && (
                    <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
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

                  {/* Submenu for CNEPC */}
                  {open && isCnepcItem && item.hasSubmenu && (
                    <Collapse in={cnepcOpen} timeout="auto" unmountOnExit>
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
                  secondaryTypographyProps={{ variant: 'caption', color: 'rgba(255, 255, 255, 0.8)' }}
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

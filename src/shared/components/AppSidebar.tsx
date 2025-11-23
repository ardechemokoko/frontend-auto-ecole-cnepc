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
  HomeIcon,
  ArrowPathIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  UserPlusIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
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
  const [workflowOpen, setWorkflowOpen] = useState(false);

  // Définition de tous les menus possibles avec leurs clés
   const allMenuItemsAutoEcole = [
      {
      title: 'Tableau de bord',
      icon: HomeIcon,
      path: ROUTES.DASHBOARD,
      description: 'Vue d\'ensemble de l\'application',
      key: 'dashboard'
    },
    //    {
    //   title: 'Modifier Vos informations personnelles',
    //   icon: PersonIcon,
    //   path: ROUTES.UPDATE,
    //   description: 'modifier les informations de l\' auto-école',
    //   key: 'update'
    // },
    //  {
    //   title: 'Change mot de passe',
    //   icon: Password,
    //   path: ROUTES.CPW,
    //   description: 'changement de mot de passe'
    // },
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
          description: 'Voir les demandes d\'inscription',
          icon: EnvelopeIcon
        },
        {
          path: `${ROUTES.ELEVES}/inscrits`,
          title: 'Candidats inscrits',
          description: 'Voir les candidats inscrits',
          icon: UserPlusIcon
        }
      ]
    },
    {
      title: 'Nos formations',
      icon: AcademicCapIcon,
      path: ROUTES.FORMATIONS,
      description: 'Consulter les formations de votre auto-école'
    },
   ]
  const allMenuItems = [
    {
      title: 'Tableau de bord',
      icon: HomeIcon,
      path: ROUTES.DASHBOARD,
      description: 'Vue d\'ensemble de l\'application',
      key: 'dashboard'
    },
    // {
    //   title: 'Modifier Vos informations personnelles',
    //   icon: PersonIcon,
    //   path: ROUTES.UPDATE,
    //   description: 'modifier les informations de l\' auto-école',
    //   key: 'update'
    // },
    {
      title: 'Referentiel',
      icon: ArrowPathIcon,
      path: ROUTES.REF,
      description: 'reference de l\' auto-école',
      key: 'referentiel'
    },
    // {
    //   title: 'Change mot de passe',
    //   icon: Password,
    //   path: ROUTES.CPW,
    //   description: 'changement de mot de passe'
    // },
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
          description: 'Voir les demandes d\'inscription',
          icon: EnvelopeIcon
        },
        {
          path: `${ROUTES.ELEVES}/inscrits`,
          title: 'Candidats inscrits',
          description: 'Voir les candidats inscrits',
          icon: UserPlusIcon
        }
      ]
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
      icon: Cog6ToothIcon,
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

  // Préparer la liste des menus selon le rôle
  const baseMenuItems = user?.role === "responsable_auto_ecole" ? allMenuItemsAutoEcole : allMenuItems;
  // Pour l'administrateur: n'afficher que le menu CNEPC, Workflow et Referentiel
  const roleAdjustedMenuItems = user?.role === 'admin'
    ? allMenuItems.filter(item => item.title === 'CNEPC' || item.title === 'Workflow' || item.title === 'Referentiel')
    : baseMenuItems;

  // Filtrer les menus selon les permissions de l'utilisateur
  console.log('🎭 AppSidebar: Filtrage des menus pour l\'utilisateur', {
    userRole: user?.role,
    userName: user?.name || user?.email,
    totalMenus: roleAdjustedMenuItems.length
  });
  
  const menuItems = roleAdjustedMenuItems.filter(item => {
    const hasAccess = item.key ? canAccessMenu(user, item.key) : true;
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
      console.log(e);
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
          width: open ? 256 : 64,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? 256 : 64,
            boxSizing: 'border-box',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
            backgroundColor: '#3A75C4',
            borderRight: 'none',
            borderRadius: 0,
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: '#2A5A9A',
            color: 'white',
            p: open ? 3 : 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            mb: open ? 2.5 : 0,
          }}>
          <Avatar
                sx={{
                  backgroundColor: '#10b981',
                  width: open ? 56 : 40,
                  height: open ? 56 : 40,
                  fontSize: open ? '1.75rem' : '1.25rem',
                  fontWeight: 600,
                  borderRadius: 0,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
          </Box>
          
          {open && (
            <Box sx={{ 
              mt: 1.5,
              textAlign: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'white',
                  fontSize: '0.9375rem',
                  mb: 0.5,
                }}
              >
                 {user?.name || 'Utilisateur'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.8125rem',
                }}
              >
                Espace Administration
              </Typography>
            </Box>
          )}
        </Box>
      

        {/* Navigation */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
          <List sx={{ px: open ? 1.5 : 1, py: 0 }}>
            {user?.role !== "responsable_auto_ecole" ? menuItems.map((item) => {
              const IconComponent = item.icon;
              const isCandidatsItem = item.title === 'Gestion des Candidats';
              const isSettingsItem = item.title === 'Paramètres';
              const isCnepcItem = item.title === 'CNEPC';
              const isWorkflowItem = item.title === 'Workflow';
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
                        }else if (isWorkflowItem && item.hasSubmenu) {
                          setWorkflowOpen(!workflowOpen);
                        } else {
                          handleNavigation(item.path);
                        }
                      }}
                      sx={{
                        mx: 0,
                        px: open ? 1.5 : 1,
                        py: 0.875,
                        mb: 0.5,
                        borderRadius: 0,
                        justifyContent: open ? 'flex-start' : 'center',
                        backgroundColor: isActive(item.path) 
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'transparent',
                        color: isActive(item.path) ? 'white' : 'rgba(255, 255, 255, 0.85)',
                        minHeight: 44,
                        '&:hover': {
                          backgroundColor: isActive(item.path) 
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      title={open ? item.description : item.title}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: open ? 40 : 0,
                          justifyContent: 'center',
                          color: 'inherit',
                          mr: open ? 1.5 : 0,
                        }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: 'inherit' }} />
                      </ListItemIcon>
                      {open && (
                        <>
                          <ListItemText
                            primary={item.title}
                            primaryTypographyProps={{
                              variant: 'body2',
                              fontWeight: isActive(item.path) ? 600 : 500,
                              color: 'inherit',
                              fontSize: '0.875rem',
                            }}
                          />
                          {(isCandidatsItem || isSettingsItem || isCnepcItem || isWorkflowItem) && item.hasSubmenu && (
                            <ChevronDownIcon
                              className="w-5 h-5"
                              style={{
                                transform: (isCandidatsItem ? candidatsOpen : (isSettingsItem ? settingsOpen : (isCnepcItem ? cnepcOpen : workflowOpen))) ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                color: 'rgba(255, 255, 255, 0.7)',
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
                          const SubIconComponent = (subItem as any).icon;
                          return (
                            <ListItem key={subItem.path} disablePadding>
                              <ListItemButton
                                onClick={() => handleNavigation(subItem.path)}
                                sx={{
                                  ml: 4.5,
                                  mr: 1.5,
                                  px: 1.5,
                                  py: 0.75,
                                  mb: 0.5,
                                  borderRadius: 0,
                                  backgroundColor: subActive 
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'transparent',
                                  color: subActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                  minHeight: 40,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                  },
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                {SubIconComponent && (
                                  <ListItemIcon
                                    sx={{
                                      minWidth: 36,
                                      color: 'inherit',
                                    }}
                                  >
                                    <SubIconComponent className="w-5 h-5" style={{ color: 'inherit' }} />
                                  </ListItemIcon>
                                )}
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontSize: '0.8125rem',
                                    fontWeight: subActive ? 500 : 400,
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
                                  ml: 4.5,
                                  mr: 1.5,
                                  px: 1.5,
                                  py: 0.75,
                                  mb: 0.5,
                                  borderRadius: 0,
                                  backgroundColor: subActive 
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'transparent',
                                  color: subActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                  minHeight: 40,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                  },
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontSize: '0.8125rem',
                                    fontWeight: subActive ? 500 : 400,
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
                                  ml: 4.5,
                                  mr: 1.5,
                                  px: 1.5,
                                  py: 0.75,
                                  mb: 0.5,
                                  borderRadius: 0,
                                  backgroundColor: subActive 
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'transparent',
                                  color: subActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                  minHeight: 40,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                  },
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontSize: '0.8125rem',
                                    fontWeight: subActive ? 500 : 400,
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
                  {open && isWorkflowItem && item.hasSubmenu && (
                    <Collapse in={workflowOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.submenu?.map((subItem) => {
                          const subActive = isActive(subItem.path);
                          return (
                            <ListItem key={subItem.path} disablePadding>
                              <ListItemButton
                                onClick={() => handleNavigation(subItem.path)}
                                sx={{
                                  ml: 4.5,
                                  mr: 1.5,
                                  px: 1.5,
                                  py: 0.75,
                                  mb: 0.5,
                                  borderRadius: 0,
                                  backgroundColor: subActive 
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'transparent',
                                  color: subActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                  minHeight: 40,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                  },
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontSize: '0.8125rem',
                                    fontWeight: subActive ? 500 : 400,
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
            }): allMenuItemsAutoEcole.map((item) => {
              const IconComponent = item.icon;
              const isCandidatsItem = item.title === 'Gestion des Candidats';
              const isSettingsItem = item.title === 'Paramètres';
              const isCnepcItem = item.title === 'CNEPC';
              const isWorkflowItem = item.title === 'Workflow';
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
                        }else if (isWorkflowItem && item.hasSubmenu) {
                          setWorkflowOpen(!workflowOpen);
                        } else {
                          handleNavigation(item.path);
                        }
                      }}
                      sx={{
                        mx: 0,
                        px: open ? 1.5 : 1,
                        py: 0.875,
                        mb: 0.5,
                        borderRadius: 0,
                        justifyContent: open ? 'flex-start' : 'center',
                        backgroundColor: isActive(item.path) 
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'transparent',
                        color: isActive(item.path) ? 'white' : 'rgba(255, 255, 255, 0.85)',
                        minHeight: 44,
                        '&:hover': {
                          backgroundColor: isActive(item.path) 
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      title={open ? item.description : item.title}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: open ? 40 : 0,
                          justifyContent: 'center',
                          color: 'inherit',
                          mr: open ? 1.5 : 0,
                        }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: 'inherit' }} />
                      </ListItemIcon>
                      {open && (
                        <>
                          <ListItemText
                            primary={item.title}
                            primaryTypographyProps={{
                              variant: 'body2',
                              fontWeight: isActive(item.path) ? 600 : 500,
                              color: 'inherit',
                              fontSize: '0.875rem',
                            }}
                          />
                          {(isCandidatsItem || isSettingsItem || isCnepcItem || isWorkflowItem) && item.hasSubmenu && (
                            <ChevronDownIcon
                              className="w-5 h-5"
                              style={{
                                transform: (isCandidatsItem ? candidatsOpen : (isSettingsItem ? settingsOpen : (isCnepcItem ? cnepcOpen : workflowOpen))) ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                color: 'rgba(255, 255, 255, 0.7)',
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
                          const SubIconComponent = (subItem as any).icon;
                          return (
                            <ListItem key={subItem.path} disablePadding>
                              <ListItemButton
                                onClick={() => handleNavigation(subItem.path)}
                                sx={{
                                  ml: 4.5,
                                  mr: 1.5,
                                  px: 1.5,
                                  py: 0.75,
                                  mb: 0.5,
                                  borderRadius: 0,
                                  backgroundColor: subActive 
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'transparent',
                                  color: subActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                  minHeight: 40,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                  },
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                {SubIconComponent && (
                                  <ListItemIcon
                                    sx={{
                                      minWidth: 36,
                                      color: 'inherit',
                                    }}
                                  >
                                    <SubIconComponent className="w-5 h-5" style={{ color: 'inherit' }} />
                                  </ListItemIcon>
                                )}
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontSize: '0.8125rem',
                                    fontWeight: subActive ? 500 : 400,
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
                                  ml: 4.5,
                                  mr: 1.5,
                                  px: 1.5,
                                  py: 0.75,
                                  mb: 0.5,
                                  borderRadius: 0,
                                  backgroundColor: subActive 
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'transparent',
                                  color: subActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                  minHeight: 40,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                  },
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontSize: '0.8125rem',
                                    fontWeight: subActive ? 500 : 400,
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
                                  ml: 4.5,
                                  mr: 1.5,
                                  px: 1.5,
                                  py: 0.75,
                                  mb: 0.5,
                                  borderRadius: 0,
                                  backgroundColor: subActive 
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'transparent',
                                  color: subActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                  minHeight: 40,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                  },
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontSize: '0.8125rem',
                                    fontWeight: subActive ? 500 : 400,
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
                  {open && isWorkflowItem && item.hasSubmenu && (
                    <Collapse in={workflowOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.submenu?.map((subItem) => {
                          const subActive = isActive(subItem.path);
                          return (
                            <ListItem key={subItem.path} disablePadding>
                              <ListItemButton
                                onClick={() => handleNavigation(subItem.path)}
                                sx={{
                                  ml: 4.5,
                                  mr: 1.5,
                                  px: 1.5,
                                  py: 0.75,
                                  mb: 0.5,
                                  borderRadius: 0,
                                  backgroundColor: subActive 
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'transparent',
                                  color: subActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                  minHeight: 40,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                  },
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontSize: '0.8125rem',
                                    fontWeight: subActive ? 500 : 400,
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

          {/* Logout Button */}
          <Box
            sx={{
              backgroundColor: '#2A5A9A',
              color: 'white',
              p: open ? 2 : 1.5,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <ListItemButton
              onClick={handleLogout}
              sx={{
                mx: 0,
                px: open ? 1.5 : 1,
                py: 0.875,
                borderRadius: 0,
                color: 'rgba(255, 255, 255, 0.85)',
                justifyContent: open ? 'flex-start' : 'center',
                backgroundColor: 'transparent',
                minHeight: 44,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'white',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              title="Se déconnecter"
            >
              <ListItemIcon sx={{ 
                minWidth: open ? 40 : 0, 
                justifyContent: 'center', 
                mr: open ? 1.5 : 0,
              }}>
                <Avatar
                  sx={{
                    backgroundColor: 'white',
                    width: 32,
                    height: 32,
                    borderRadius: 0,
                  }}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" style={{ color: '#3A75C4' }} />
                </Avatar>
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary="Déconnexion"
                  secondary="Se déconnecter"
                  primaryTypographyProps={{ 
                    variant: 'body2', 
                    fontWeight: 500, 
                    color: 'inherit',
                    fontSize: '0.875rem',
                  }}
                  secondaryTypographyProps={{ 
                    variant: 'caption', 
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontSize: '0.8125rem',
                  }}
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
          left: open ? 256 : 64,
          transform: 'translateY(-50%)',
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 0,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          width: 32,
          height: 32,
          '&:hover': {
            backgroundColor: '#f5f5f5',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
          },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          display: { xs: 'none', sm: 'flex' },
        }}
        title={open ? 'Réduire la sidebar' : 'Étendre la sidebar'}
      >
        {open ? (
          <ChevronLeftIcon 
            className="w-6 h-6"
            style={{ color: '#3A75C4' }}
          />
        ) : (
          <ChevronRightIcon 
            className="w-6 h-6"
            style={{ color: '#3A75C4' }}
          />
        )}
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
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.1)',
            display: { xs: 'block', sm: 'none' },
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-around', 
            py: 1.5,
            px: 1,
          }}>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              return (
                <IconButton
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    flexDirection: 'column',
                    color: active ? 'white' : 'rgba(255, 255, 255, 0.7)',
                    p: 1.5,
                    minWidth: 0,
                    flex: 1,
                    borderRadius: 0,
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: 'white',
                    },
                  }}
                  title={item.title}
                >
                  <IconComponent 
                    className="w-6 h-6 mb-1"
                    style={{
                      filter: active ? 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3))' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.7rem', 
                      color: 'inherit',
                      fontWeight: active ? 600 : 400,
                      letterSpacing: '0.02em',
                    }}
                  >
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

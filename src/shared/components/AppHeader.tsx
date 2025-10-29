import { BellIcon } from '@heroicons/react/24/outline';
import { Close, Lock, Password, People, Person as PersonIcon } from '@mui/icons-material';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, styled } from '@mui/material';
import React from 'react';
import { useAppStore } from '../../store';
import { ROUTES } from '../constants';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  sidebarOpen: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ sidebarOpen }) => {
  const { user } = useAppStore();
  const [showmenu, setShowmenu] = React.useState(false);
  const navigate = useNavigate();
  const handleMenuToggle = (title?: string) => {
    console.log(title);
    if (title === 'Close' || title === '') {
      setShowmenu(prev => !prev);
      return;
    }

  };

  const handleRouter = (route?: string) => {
    console.log(route);
    if (!route) return;
    navigate(route);
  };

  const data = [
    { icon: PersonIcon, label: 'Modifier Vos informations personnelles', path: ROUTES.UPDATE, },
    { icon: Password, label: 'Change mot de passe', path: ROUTES.CPW, },
    // { icon: PermMedia, label: 'Storage' },

  ];

  const FireNav = styled(List)<{ component?: React.ElementType }>({
    '& .MuiListItemButton-root': {
      paddingLeft: 24,
      paddingRight: 24,
    },
    '& .MuiListItemIcon-root': {
      minWidth: 0,
      marginRight: 16,
    },
    '& .MuiSvgIcon-root': {
      fontSize: 20,
    },
  });
  return (
    <header
      className="fixed top-0 right-0 z-40 bg-white shadow-lg border-b border-gray-200 transition-all duration-300"
      style={{
        left: sidebarOpen ? '16rem' : '4rem',
        width: sidebarOpen ? 'calc(100% - 16rem)' : 'calc(100% - 4rem)'
      }}
    >
      {/* Ligne colorée (vert, jaune, bleu) */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-blue-500"></div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-end">
          {/* Notifications et utilisateur */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <BellIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
            </div>

            {/* Informations utilisateur */}
            {!showmenu ? <div>
              <Box
                sx={{
                  position: 'absolute',
                  top: 60,
                  right: 10,
                  bgcolor: '#fdfdfdff',
                  color: 'white',
                  borderRadius: 2,
                  boxShadow: 3,
                  width: 250,
                  zIndex: 100,
                }}
              >
                <List>
                  {data.map((item) => (
                    <ListItemButton key={item.label} onClick={() => handleRouter(item.path)}>
                      <ListItemIcon sx={{ color: 'black' }} >
                        {React.createElement(item.icon)}
                      </ListItemIcon>
                      <ListItemText sx={{ color: 'black' }} primary={item.label} />
                    </ListItemButton>))}

                  {/* <ListItemButton>
                    <ListItemIcon sx={{ color: 'black' }}>
                      <Lock />
                    </ListItemIcon>
                    <ListItemText  sx={{ color: 'black' }} primary="Changer mot de passe" />
                  </ListItemButton> */}

                  <ListItemButton
                    onClick={() => handleMenuToggle('Close')}
                  >
                    <ListItemIcon sx={{ color: 'black' }}>
                      <Close />
                    </ListItemIcon>
                    <ListItemText sx={{ color: 'black' }} primary="Close" />
                  </ListItemButton>
                </List>
              </Box>
            </div> : <div className="flex items-center space-x-3" onClick={() => handleMenuToggle('')}>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  Bonjour, {user?.name || 'Utilisateur'}
                </div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>

            </div>}

          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

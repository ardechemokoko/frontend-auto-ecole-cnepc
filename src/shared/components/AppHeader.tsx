import { BellIcon, UserIcon } from '@heroicons/react/24/outline';
import { Menu, MenuItem, IconButton } from '@mui/material';
import React from 'react';
import { useAppStore } from '../../store';
import { ROUTES } from '../constants';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  sidebarOpen: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ sidebarOpen }) => {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleClose();
    navigate(ROUTES.PROFILE);
  };
  return (
    <header
      className="fixed top-0 right-0 z-40 bg-white shadow-lg border-b border-gray-200 transition-all duration-300"
      style={{
        left: sidebarOpen ? '16rem' : '4rem',
        width: sidebarOpen ? 'calc(100% - 16rem)' : 'calc(100% - 4rem)'
      }}
    >
      {/* Ligne colorée (vert, jaune, bleu) */}
      <div className="h-1 flex">
        <div className="flex-1 bg-green-500"></div>
        <div className="flex-1 bg-yellow-500"></div>
        <div className="flex-1 bg-blue-500"></div>
      </div>

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
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  Bonjour, {user?.name || 'Utilisateur'}
                </div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
              <IconButton
                onClick={handleClick}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#3A75C4',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#2A5A9A',
                  }
                }}
              >
                <span className="text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </IconButton>
            </div>

            {/* Menu Popup */}
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <MenuItem onClick={handleProfileClick}>
                <UserIcon className="w-5 h-5 mr-2" />
                Profil
              </MenuItem>
            </Menu>

          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

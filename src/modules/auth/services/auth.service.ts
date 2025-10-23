// Service d'authentification avec mocks
import { User, LoginRequest, AuthResponse } from './types';

// Mock des auto-écoles validées par le ministère du transport
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@dgtt.com',
    name: 'Administrateur DGTT',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'autoecole.centre@email.com',
    name: 'Auto-École du Centre',
    role: 'instructor',
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    email: 'autoecole.nord@email.com',
    name: 'Auto-École du Nord',
    role: 'instructor',
    createdAt: new Date('2024-01-03'),
  },
  {
    id: '4',
    email: 'autoecole.sud@email.com',
    name: 'Auto-École du Sud',
    role: 'instructor',
    createdAt: new Date('2024-01-04'),
  },
];

// Mock de la fonction de connexion
export async function loginMock(credentials: LoginRequest): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === credentials.email);
      
      if (user && credentials.password === 'password123') {
        resolve({
          user,
          token: `mock-jwt-token-${user.id}`,
          refreshToken: `mock-refresh-token-${user.id}`,
        });
      } else {
        reject(new Error('Identifiants invalides'));
      }
    }, 500);
  });
}

// Mock de la fonction de déconnexion
export async function logoutMock(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Déconnexion mockée');
      resolve();
    }, 200);
  });
}

// Mock de la fonction de rafraîchissement du token
export async function refreshTokenMock(): Promise<{ token: string; refreshToken: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'mock-new-jwt-token',
        refreshToken: 'mock-new-refresh-token',
      });
    }, 300);
  });
}

// Mock de la vérification du statut CNEPC
export async function checkCNEPCStatusMock(): Promise<{ isOnline: boolean; lastCheck: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        isOnline: Math.random() > 0.3, // 70% de chance d'être en ligne
        lastCheck: new Date().toISOString(),
      });
    }, 400);
  });
}

// Version API future (préparée mais commentée)
// export async function login(credentials: LoginRequest): Promise<AuthResponse> {
//   const { data } = await axios.post("/auth/login", credentials);
//   return data;
// }

// export async function logout(): Promise<void> {
//   await axios.post("/auth/logout");
// }

// export async function refreshToken(): Promise<{ token: string; refreshToken: string }> {
//   const { data } = await axios.post("/auth/refresh");
//   return data;
// }

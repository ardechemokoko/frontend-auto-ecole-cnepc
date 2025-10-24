// Service pour la gestion des utilisateurs (opérateurs)
import { Operator, OperatorFormData } from '../types';

// Mock des opérateurs
const mockOperators: Operator[] = [
  {
    id: 'op-001',
    email: 'operator1@dgtt.com',
    name: 'Opérateur 1',
    role: 'operator',
    isActive: true,
    createdAt: new Date('2024-01-02'),
    lastLogin: new Date('2024-01-15'),
    permissions: ['manage_autoecoles', 'manage_autoecole_users', 'view_candidates']
  },
  {
    id: 'op-002',
    email: 'operator2@dgtt.com',
    name: 'Opérateur 2',
    role: 'operator',
    isActive: true,
    createdAt: new Date('2024-01-03'),
    lastLogin: new Date('2024-01-14'),
    permissions: ['manage_autoecoles', 'manage_autoecole_users', 'view_candidates']
  },
  {
    id: 'op-003',
    email: 'operator3@dgtt.com',
    name: 'Opérateur 3',
    role: 'operator',
    isActive: false,
    createdAt: new Date('2024-01-04'),
    permissions: ['manage_autoecoles', 'view_candidates']
  }
];

// Récupérer tous les opérateurs
export async function getOperators(): Promise<Operator[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockOperators);
    }, 500);
  });
}

// Créer un nouvel opérateur
export async function createOperator(data: OperatorFormData): Promise<Operator> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newOperator: Operator = {
        id: `op-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: 'operator',
        isActive: true,
        createdAt: new Date(),
        permissions: data.permissions
      };
      mockOperators.push(newOperator);
      resolve(newOperator);
    }, 500);
  });
}

// Mettre à jour un opérateur
export async function updateOperator(id: string, data: Partial<OperatorFormData>): Promise<Operator> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const operatorIndex = mockOperators.findIndex(op => op.id === id);
      if (operatorIndex === -1) {
        reject(new Error('Opérateur non trouvé'));
        return;
      }
      
      const updatedOperator = {
        ...mockOperators[operatorIndex],
        ...data,
        id // Garder l'ID original
      };
      
      mockOperators[operatorIndex] = updatedOperator;
      resolve(updatedOperator);
    }, 500);
  });
}

// Désactiver/Activer un opérateur
export async function toggleOperatorStatus(id: string): Promise<Operator> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const operatorIndex = mockOperators.findIndex(op => op.id === id);
      if (operatorIndex === -1) {
        reject(new Error('Opérateur non trouvé'));
        return;
      }
      
      mockOperators[operatorIndex].isActive = !mockOperators[operatorIndex].isActive;
      resolve(mockOperators[operatorIndex]);
    }, 500);
  });
}

// Supprimer un opérateur
export async function deleteOperator(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const operatorIndex = mockOperators.findIndex(op => op.id === id);
      if (operatorIndex === -1) {
        reject(new Error('Opérateur non trouvé'));
        return;
      }
      
      mockOperators.splice(operatorIndex, 1);
      resolve();
    }, 500);
  });
}

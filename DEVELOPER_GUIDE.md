# Guide du Développeur - DGTT Frontend Auto-École

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- Git

### Installation
```bash
# Cloner le projet
git clone [repository-url]
cd dgtt-fronted-auto-ecole

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## 🏗️ Architecture du Projet

### Structure des Dossiers
```
src/
├── modules/                 # Modules métier
│   ├── auth/               # Authentification
│   ├── eleves/             # Gestion des candidats
│   ├── autoecole/          # Gestion des auto-écoles
│   └── shared/             # Composants partagés
├── routes/                 # Pages principales
├── store/                  # Gestion d'état global
├── shared/                 # Utilitaires et constantes
│   ├── components/         # Composants réutilisables
│   ├── constants/         # Constantes de l'app
│   └── services/          # Services API
└── assets/                 # Ressources statiques
```

## 🎨 Système de Design

### Palette de Couleurs

#### Sidebar (Bleue Gabonaise)
```css
/* Couleur principale */
--sidebar-primary: #3A75C4;

/* Variations foncées */
--sidebar-header: #2A5A9A;
--sidebar-user: #1A4A8A;
--sidebar-logout: #0A3A7A;
```

#### UI Éléments (Noir et Blanc)
```css
/* Boutons */
--button-bg: #gray-800;
--button-hover: #gray-900;
--button-text: white;

/* Cartes */
--card-bg: #gray-100;
--card-text-primary: #gray-800;
--card-text-secondary: #gray-600;
```

### Composants Principaux

#### AppLayout
```tsx
// Layout principal de l'application
<AppLayout>
  <YourPage />
</AppLayout>
```

#### AppSidebar
```tsx
// Sidebar de navigation
<AppSidebar 
  open={sidebarOpen} 
  onToggle={handleToggle} 
/>
```

#### AppHeader
```tsx
// Header fixe
<AppHeader sidebarOpen={sidebarOpen} />
```

## 🔧 Développement

### Ajouter une Nouvelle Page

1. **Créer le composant**
```tsx
// src/modules/your-module/pages/YourPage.tsx
import React from 'react';

const YourPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1>Votre Page</h1>
    </div>
  );
};

export default YourPage;
```

2. **Ajouter la route**
```tsx
// src/routes/index.ts
import YourPage from '../modules/your-module/pages/YourPage';

// Dans les routes
<Route path="/your-route" element={<YourPage />} />
```

3. **Ajouter au menu**
```tsx
// src/shared/components/AppSidebar.tsx
const menuItems = [
  // ... autres items
  {
    title: 'Votre Page',
    icon: YourIcon,
    path: '/your-route',
    description: 'Description de votre page'
  }
];
```

### Ajouter un Nouveau Module

1. **Créer la structure**
```
src/modules/your-module/
├── types/
│   └── index.ts
├── services/
│   └── yourService.ts
├── pages/
│   └── YourPage.tsx
├── components/
│   └── YourComponent.tsx
└── index.ts
```

2. **Définir les types**
```typescript
// src/modules/your-module/types/index.ts
export interface YourEntity {
  id: string;
  name: string;
  // ... autres propriétés
}

export interface YourApiResponse {
  data: YourEntity[];
  total: number;
}
```

3. **Créer le service**
```typescript
// src/modules/your-module/services/yourService.ts
import { api } from '../../../shared/services/api';
import { YourEntity, YourApiResponse } from '../types';

export const yourService = {
  async getYourEntities(): Promise<YourApiResponse> {
    const response = await api.get('/your-endpoint');
    return response.data;
  },
  
  async createYourEntity(data: Partial<YourEntity>): Promise<YourEntity> {
    const response = await api.post('/your-endpoint', data);
    return response.data;
  }
};
```

### Gestion d'État

#### Store Global
```typescript
// src/store/index.ts
export const useAppStore = () => {
  const { state, dispatch } = useContext(AppContext);
  
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login: (user: User) => dispatch({ type: 'LOGIN', payload: user }),
    logout: () => dispatch({ type: 'LOGOUT' })
  };
};
```

#### État Local
```tsx
// Dans un composant
const [isOpen, setIsOpen] = useState(false);
const [data, setData] = useState<YourType[]>([]);
```

## 🎯 Bonnes Pratiques

### 1. Structure des Composants
```tsx
// Ordre des imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { YourIcon } from '@heroicons/react/24/outline';

// Interface du composant
interface YourComponentProps {
  title: string;
  onAction: () => void;
}

// Composant
const YourComponent: React.FC<YourComponentProps> = ({ title, onAction }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Handlers
  const handleClick = () => {
    onAction();
  };
  
  // Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
};

export default YourComponent;
```

### 2. Gestion des Erreurs
```tsx
// Try-catch dans les services
try {
  const response = await api.get('/endpoint');
  return response.data;
} catch (error) {
  console.error('Erreur API:', error);
  throw error;
}
```

### 3. Responsive Design
```tsx
// Classes Tailwind responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Contenu */}
</div>
```

### 4. Accessibilité
```tsx
// Attributs d'accessibilité
<button
  onClick={handleClick}
  aria-label="Description de l'action"
  title="Tooltip"
>
  <YourIcon className="w-5 h-5" />
</button>
```

## 🧪 Tests

### Tests Unitaires
```typescript
// src/components/__tests__/YourComponent.test.tsx
import { render, screen } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent title="Test" onAction={jest.fn()} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Tests d'Intégration
```typescript
// src/services/__tests__/yourService.test.ts
import { yourService } from '../yourService';

describe('yourService', () => {
  it('should fetch data', async () => {
    const data = await yourService.getYourEntities();
    expect(data).toBeDefined();
  });
});
```

## 🐛 Débogage

### Outils de Développement
- **React DevTools** : Inspection des composants
- **Redux DevTools** : Debug du store
- **Network Tab** : Monitoring des requêtes API

### Logs de Débogage
```typescript
// Logs conditionnels
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

### Erreurs Courantes

#### 1. Erreur d'Import
```bash
# Erreur
Module not found: Can't resolve './Component'

# Solution
# Vérifier le chemin et l'export
export { default as Component } from './Component';
```

#### 2. Problème de Navigation
```typescript
// Vérifier les routes dans constants
export const ROUTES = {
  YOUR_ROUTE: '/your-route'
} as const;
```

#### 3. Style Non Appliqué
```tsx
// Vérifier l'ordre des classes Tailwind
className="bg-gray-800 hover:bg-gray-900 text-white"
```

## 📦 Déploiement

### Build de Production
```bash
# Build
npm run build

# Preview
npm run preview
```

### Variables d'Environnement
```env
# .env
VITE_API_URL=https://your-api-url.com
VITE_APP_NAME=DGTT Auto-École
```

## 🔗 Ressources Utiles

### Documentation
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)

### Outils
- [Heroicons](https://heroicons.com/)
- [Vite](https://vitejs.dev/)
- [Axios](https://axios-http.com/)

### Patterns
- [React Patterns](https://reactpatterns.com/)
- [Clean Code](https://clean-code-developer.com/)

---

**Dernière mise à jour** : [Date actuelle]
**Version** : 1.0.0







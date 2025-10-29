# Services Élèves - Documentation

## Nouveaux Services

### 1. Service Candidats (`candidats.service.ts`)

Service pour la gestion des candidats via l'API `/candidats`.

#### Méthodes disponibles :

- `getAllCandidats(token, page?, perPage?)` : Récupère tous les candidats
- `getCandidatById(id, token)` : Récupère un candidat par son ID

#### Types principaux :

- `CandidatApiItem` : Structure d'un candidat
- `CandidatApiResponse` : Réponse de l'API pour la liste des candidats

#### Exemple d'utilisation :

```typescript
import { candidatsService } from './candidats.service';

// Récupérer tous les candidats
const token = localStorage.getItem('access_token');
const response = await candidatsService.getAllCandidats(token);
console.log('Candidats:', response.data);

// Récupérer un candidat spécifique
const candidat = await candidatsService.getCandidatById('candidat-id', token);
console.log('Candidat:', candidat);
```

### 2. Service Formations (`formations.service.ts`)

Service pour la gestion des formations via l'API `/formations`.

#### Méthodes disponibles :

- `getAllFormations(token, page?, perPage?)` : Récupère toutes les formations
- `getFormationById(id, token)` : Récupère une formation par son ID
- `getFormationsByAutoEcole(autoEcoleId, token)` : Récupère les formations d'une auto-école

#### Types principaux :

- `FormationApiItem` : Structure d'une formation
- `FormationApiResponse` : Réponse de l'API pour une formation
- `FormationListApiResponse` : Réponse de l'API pour la liste des formations

#### Exemple d'utilisation :

```typescript
import { formationsService } from './formations.service';
import { getAutoEcoleId } from '../../../shared/utils/autoEcoleUtils';

// Récupérer les formations de l'auto-école connectée
const token = localStorage.getItem('access_token');
const autoEcoleId = getAutoEcoleId();
const formations = await formationsService.getFormationsByAutoEcole(autoEcoleId, token);
console.log('Formations:', formations);

// Récupérer une formation spécifique
const formation = await formationsService.getFormationById('formation-id', token);
console.log('Formation:', formation.data);
```

## Intégration dans DemandesInscriptionTable

Le composant `DemandesInscriptionTable` utilise maintenant ces services pour :

1. **Charger les candidats** : Récupère tous les candidats via `/candidats`
2. **Charger les formations** : Récupère les formations de l'auto-école connectée via `/formations?auto_ecole_id={id}`
3. **Afficher les vrais noms** : Utilise les données récupérées pour afficher les noms corrects des candidats et formations

### Flux de données :

1. **Connexion** → Informations auto-école sauvegardées dans localStorage
2. **Chargement candidats** → Appel à `/candidats` avec le token
3. **Chargement formations** → Appel à `/formations?auto_ecole_id={id}` avec le token
4. **Affichage** → Les dossiers utilisent les vrais noms des candidats et formations

### Avantages :

- ✅ **Noms corrects** : Affichage des vrais noms des candidats et formations
- ✅ **Données à jour** : Récupération en temps réel depuis l'API
- ✅ **Performance** : Chargement parallèle des données
- ✅ **Gestion d'erreurs** : Gestion robuste des erreurs API
- ✅ **Logs détaillés** : Logs complets pour le débogage

## Composants d'exemple

### DebugInfo (`components/DebugInfo.tsx`)

Composant de débogage qui affiche :
- Informations de l'auto-école connectée
- Liste des candidats chargés
- Liste des formations chargées

### CandidatsFormationsExample (`examples/CandidatsFormationsExample.tsx`)

Exemple complet d'utilisation des services avec :
- Boutons pour charger les données
- Affichage des résultats
- Gestion des erreurs
- Informations de débogage

## Configuration requise

1. **Token d'authentification** : Doit être présent dans localStorage avec la clé `access_token`
2. **Auto-école connectée** : Les informations doivent être dans localStorage avec la clé `auto_ecole_info`
3. **Endpoints API** : Les endpoints `/candidats` et `/formations` doivent être accessibles

## Logs de débogage

Les services incluent des logs détaillés pour faciliter le débogage :

- 🔍 Début des opérations
- ✅ Succès des opérations
- ❌ Erreurs détaillées
- 📋 Informations sur les données récupérées
- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Séparateurs visuels

Consultez la console du navigateur pour voir tous les logs.
import { useState } from 'react';
import { AutoEcole, Formation, TypeDemande, Referentiel, autoEcoleService, typeDemandeService, referentielService } from '../services';

export const useAutoEcoles = () => {
  const [autoEcoles, setAutoEcoles] = useState<AutoEcole[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAutoEcoles = async () => {
    setLoading(true);
    try {
      const response = await autoEcoleService.getAutoEcoles(1, 100);
      setAutoEcoles(response.data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des auto-écoles:', err);
      throw new Error('Impossible de charger les auto-écoles');
    } finally {
      setLoading(false);
    }
  };

  return { autoEcoles, loading, loadAutoEcoles };
};

export const useFormations = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFormations = async (autoEcoleId: string) => {
    setLoading(true);
    try {
      const data = await autoEcoleService.getFormationsByAutoEcole(autoEcoleId);
      setFormations(data.filter(f => f.statut));
    } catch (err: any) {
      console.error('Erreur lors du chargement des formations:', err);
      throw new Error('Impossible de charger les formations');
    } finally {
      setLoading(false);
    }
  };

  return { formations, loading, loadFormations };
};

export const useTypeDemandes = () => {
  const [typeDemandes, setTypeDemandes] = useState<TypeDemande[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTypeDemandes = async () => {
    setLoading(true);
    try {
      const response = await typeDemandeService.getTypeDemandes(1, 100);
      setTypeDemandes(response.data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des types de demande:', err);
    } finally {
      setLoading(false);
    }
  };

  return { typeDemandes, loading, loadTypeDemandes };
};

export const useReferentiels = () => {
  const [referentiels, setReferentiels] = useState<Referentiel[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReferentiels = async () => {
    setLoading(true);
    try {
      const response = await referentielService.getReferentiels(1, 100);
      const referentielsTypePermis = (response.data || []).filter(
        (referentiel) => referentiel.type_ref === 'type_permis'
      );
      setReferentiels(referentielsTypePermis);
    } catch (err: any) {
      console.error('Erreur lors du chargement des référentiels:', err);
    } finally {
      setLoading(false);
    }
  };

  return { referentiels, loading, loadReferentiels };
};


import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
// Heroicons imports
import { EyeIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CurrencyDollarIcon, IdentificationIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DemandeInscription, FiltresDemandes, StatistiquesDemandes } from '../types/inscription';
import { getAutoEcoleInfo, getAutoEcoleId, getAutoEcoleDossiers } from '../../../shared/utils/autoEcoleUtils';
import { autoEcoleService } from '../../cnepc/services/auto-ecole.service';

interface DemandesInscriptionTableProps {
  onCandidatSelect?: (candidat: DemandeInscription) => void;
  refreshTrigger?: number; // Pour forcer le rafraîchissement
  onDelete?: () => void; // Callback après suppression réussie
}

const DemandesInscriptionTable: React.FC<DemandesInscriptionTableProps> = ({ onCandidatSelect, refreshTrigger, onDelete }) => {
  const [demandes, setDemandes] = useState<DemandeInscription[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiquesDemandes | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtres, setFiltres] = useState<FiltresDemandes>({});
  const [recherche, setRecherche] = useState('');
  const [candidatsMap, setCandidatsMap] = useState<Map<string, any>>(new Map());
  const [formationsMap, setFormationsMap] = useState<Map<string, any>>(new Map());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [demandeToDelete, setDemandeToDelete] = useState<DemandeInscription | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    chargerCandidatsEtFormations();
  }, []);

  useEffect(() => {
    chargerDemandes();
    chargerStatistiques();
  }, [filtres, refreshTrigger, candidatsMap, formationsMap]);

  const chargerCandidatsEtFormations = async () => {
    try {
      console.log('📋 Chargement des candidats et formations...');
      
      // Récupérer l'ID de l'auto-école connectée
      const autoEcoleId = getAutoEcoleId();
      
      if (!autoEcoleId) {
        console.warn('⚠️ Aucune auto-école trouvée');
        return;
      }

      // Charger les candidats
      const candidats = await autoEcoleService.getAllCandidats();
      const candidatsMapTemp = new Map<string, any>();
      
      console.log('📋 Candidats bruts reçus:', candidats.length);
      
      // Détecter les IDs dupliqués avant de les stocker
      const candidatsParId = new Map<string, any[]>();
      candidats.forEach((candidat: any) => {
        if (candidat.id) {
          if (!candidatsParId.has(candidat.id)) {
            candidatsParId.set(candidat.id, []);
          }
          candidatsParId.get(candidat.id)!.push(candidat);
        }
      });
      
      // Afficher les alertes pour les IDs dupliqués
      candidatsParId.forEach((candidatsAvecMemeId, candidatId) => {
        if (candidatsAvecMemeId.length > 1) {
          const personnesIds = candidatsAvecMemeId.map(c => c.personne_id).filter(Boolean);
          const emails = candidatsAvecMemeId.map(c => c.personne?.email).filter(Boolean);
          const personnesIdsUniques = new Set(personnesIds);
          const emailsUniques = new Set(emails);
          
          if (personnesIdsUniques.size > 1 || emailsUniques.size > 1) {
            console.warn(`⚠️ ATTENTION: Candidat ID "${candidatId}" dupliqué avec ${candidatsAvecMemeId.length} candidats différents:`);
            candidatsAvecMemeId.forEach((c, idx) => {
              console.warn(`  Candidat ${idx + 1}:`);
              console.warn(`    - Personne ID: ${c.personne_id}`);
              console.warn(`    - Email: ${c.personne?.email || 'N/A'}`);
              console.warn(`    - Nom complet: ${c.personne?.nom_complet || 'N/A'}`);
            });
            console.warn(`  → Le dernier candidat sera utilisé dans le map. Utilisez les données du dossier directement.`);
          }
        }
      });
      
      candidats.forEach((candidat: any) => {
        // Stocker par ID candidat (le dernier écrasera les précédents si dupliqué)
        // C'est OK car on utilise toujours les données du dossier en priorité
        if (candidat.id) {
          candidatsMapTemp.set(candidat.id, candidat);
        }
        // Également stocker par personne_id si disponible (plus fiable pour distinguer)
        if (candidat.personne_id) {
          candidatsMapTemp.set(`personne_${candidat.personne_id}`, candidat);
        }
      });
      
      setCandidatsMap(candidatsMapTemp);
      console.log('✅ Candidats chargés dans le map:', candidatsMapTemp.size);
      console.log('📋 IDs des candidats dans le map:', Array.from(candidatsMapTemp.keys()));
      
      // Afficher les détails des candidats
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👥 CANDIDATS RÉCUPÉRÉS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      candidats.forEach((candidat: any, index: number) => {
        console.log(`\n👤 Candidat ${index + 1}:`);
        console.log('  • ID:', candidat.id);
        console.log('  • Numéro candidat:', candidat.numero_candidat || 'N/A');
        console.log('  • Nom:', candidat.personne?.nom || 'N/A');
        console.log('  • Prénom:', candidat.personne?.prenom || 'N/A');
        console.log('  • Nom complet:', candidat.personne?.nom_complet || 'N/A');
        console.log('  • Email:', candidat.personne?.email || 'N/A');
        console.log('  • Contact:', candidat.personne?.contact || 'N/A');
        console.log('  • Adresse:', candidat.personne?.adresse || 'N/A');
        console.log('  • Date naissance:', candidat.date_naissance || 'N/A');
        console.log('  • Lieu naissance:', candidat.lieu_naissance || 'N/A');
        console.log('  • Nationalité:', candidat.nationalite || 'N/A');
        console.log('  • Genre:', candidat.genre || 'N/A');
        console.log('  • Âge:', candidat.age || 'N/A');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Charger les formations de l'auto-école
      const formations = await autoEcoleService.getFormationsByAutoEcole(autoEcoleId);
      const formationsMapTemp = new Map<string, any>();
      
      console.log('📚 Chargement des détails des formations...');
      
      // Pour chaque formation, récupérer les détails complets
      for (const formation of formations) {
        try {
          const formationDetails = await autoEcoleService.getFormationById(formation.id);
          formationsMapTemp.set(formation.id, formationDetails);
        } catch (error) {
          console.warn(`⚠️ Impossible de récupérer les détails de la formation ${formation.id}:`, error);
          formationsMapTemp.set(formation.id, formation);
        }
      }
      
      setFormationsMap(formationsMapTemp);
      console.log('✅ Formations chargées:', formations.length);
      
      // Afficher les détails des formations
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📚 FORMATIONS RÉCUPÉRÉES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      formations.forEach((formation: any, index: number) => {
        console.log(`\n📖 Formation ${index + 1}:`);
        console.log('  • ID:', formation.id);
        console.log('  • Type permis:', formation.type_permis?.libelle || 'N/A');
        console.log('  • Code:', formation.type_permis?.code || 'N/A');
        console.log('  • Montant:', formation.montant_formate || 'N/A');
        console.log('  • Description:', formation.description || 'N/A');
        console.log('  • Session:', formation.session?.libelle || 'N/A');
        console.log('  • Statut:', formation.statut_libelle || 'N/A');
        console.log('  • Auto-école ID:', formation.auto_ecole_id);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des candidats et formations:', error);
    }
  };

  const chargerDemandes = async () => {
    try {
      setLoading(true);
      console.log('📋 Chargement des dossiers de l\'auto-école connectée...');
      
      // Récupérer les informations de l'auto-école depuis le localStorage
      const autoEcoleInfo = getAutoEcoleInfo();
      const autoEcoleId = getAutoEcoleId();
      
      if (!autoEcoleInfo || !autoEcoleId) {
        console.warn('⚠️ Aucune information d\'auto-école trouvée dans le localStorage');
        setDemandes([]);
        setLoading(false);
        return;
      }

      // Attendre que les candidats et formations soient chargés
      if (candidatsMap.size === 0 || formationsMap.size === 0) {
        console.log('⏳ Attente du chargement des candidats et formations...');
        setLoading(false);
        return;
      }
      
      console.log('🏫 Auto-école connectée:', autoEcoleInfo.nom_auto_ecole, '(ID:', autoEcoleId, ')');
      
      // Récupérer les dossiers depuis les informations d'auto-école
      const dossiersAutoEcole = getAutoEcoleDossiers();
      
      if (dossiersAutoEcole && dossiersAutoEcole.length > 0) {
        console.log('📁 Dossiers trouvés dans les informations auto-école:', dossiersAutoEcole.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 DÉTAILS DES DOSSIERS RÉCUPÉRÉS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Afficher les détails de chaque dossier
        dossiersAutoEcole.forEach((dossier: any, index: number) => {
          console.log(`\n📁 Dossier ${index + 1} (BRUT):`);
          console.log('  • ID:', dossier.id);
          console.log('  • Candidat ID:', dossier.candidat_id);
          console.log('  • Candidat ID (depuis candidat):', dossier.candidat?.id);
          console.log('  • Personne ID:', dossier.candidat?.personne_id);
          console.log('  • Formation ID:', dossier.formation_id);
          console.log('  • Statut:', dossier.statut);
          console.log('  • Date création:', dossier.date_creation || dossier.created_at);
          console.log('  • Commentaires:', dossier.commentaires || 'Aucun');
          
          if (dossier.candidat) {
            console.log('  • Candidat (dans le dossier BRUT):');
            console.log('    - ID complet:', JSON.stringify(dossier.candidat.id));
            console.log('    - Personne ID:', dossier.candidat.personne_id);
            console.log('    - Nom:', dossier.candidat.personne?.nom || 'N/A');
            console.log('    - Prénom:', dossier.candidat.personne?.prenom || 'N/A');
            console.log('    - Email:', dossier.candidat.personne?.email || 'N/A');
            console.log('    - Contact:', dossier.candidat.personne?.contact || 'N/A');
            console.log('    - Nom complet:', dossier.candidat.personne?.nom_complet || 'N/A');
            console.log('    - Adresse:', dossier.candidat.personne?.adresse || 'N/A');
            
            // Comparer avec le dossier précédent pour voir s'ils sont différents
            if (index > 0 && dossiersAutoEcole[index - 1]?.candidat) {
              const prevDossier = dossiersAutoEcole[index - 1];
              const sameCandidat = dossier.candidat.id === prevDossier.candidat?.id;
              const sameEmail = dossier.candidat.personne?.email === prevDossier.candidat?.personne?.email;
              console.log('  • Comparaison avec dossier précédent:');
              console.log(`    - Même candidat ID: ${sameCandidat}`);
              console.log(`    - Même email: ${sameEmail}`);
            }
          } else {
            console.warn('  ⚠️ Aucun objet candidat dans le dossier');
          }
          
          // Vérifier si le candidat existe dans le map
          const candidatIdFromDossier = dossier.candidat_id || dossier.candidat?.id;
          if (candidatIdFromDossier) {
            const candidatInMap = candidatsMap.get(candidatIdFromDossier);
            if (candidatInMap) {
              console.log('  ✅ Candidat trouvé dans le map:', candidatInMap.personne?.nom_complet || 'N/A');
            } else {
              console.warn('  ⚠️ Candidat NON trouvé dans le map pour ID:', candidatIdFromDossier);
            }
          }
          
          if (dossier.formation) {
            console.log('  • Formation:');
            console.log('    - Type permis:', dossier.formation.type_permis?.libelle || 'N/A');
            console.log('    - Montant:', dossier.formation.montant_formate || 'N/A');
            console.log('    - Description:', dossier.formation.description || 'N/A');
          }
          
          if (dossier.etape) {
            console.log('  • Étape:');
            console.log('    - Libellé:', dossier.etape.libelle || 'N/A');
            console.log('    - Ordre:', dossier.etape.ordre || 'N/A');
            console.log('    - Statut système:', dossier.etape.statut_systeme || 'N/A');
          }
          
          if (dossier.documents && dossier.documents.length > 0) {
            console.log('  • Documents:', dossier.documents.length);
            dossier.documents.forEach((doc: any, docIndex: number) => {
              console.log(`    ${docIndex + 1}. ${doc.nom_fichier || doc.nom || 'Document'}`);
              console.log(`       - Type: ${doc.type_document?.libelle || 'N/A'}`);
              console.log(`       - Validé: ${doc.valide ? 'Oui' : 'Non'}`);
              console.log(`       - Taille: ${doc.taille_fichier_formate || 'N/A'}`);
            });
          } else {
            console.log('  • Documents: Aucun');
          }
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Détecter les candidats avec le même ID mais des informations différentes
        const candidatsParId = new Map<string, Array<{dossierId: string, candidat: any}>>();
        const candidatsParPersonneId = new Map<string, Array<{dossierId: string, candidat: any}>>();
        
        dossiersAutoEcole.forEach((dossier: any, index: number) => {
          const candidatId = dossier.candidat_id || dossier.candidat?.id;
          const personneId = dossier.candidat?.personne_id;
          
          if (candidatId && dossier.candidat) {
            if (!candidatsParId.has(candidatId)) {
              candidatsParId.set(candidatId, []);
            }
            candidatsParId.get(candidatId)!.push({
              dossierId: dossier.id,
              candidat: dossier.candidat
            });
          }
          
          // Vérifier si plusieurs dossiers partagent la même référence d'objet candidat
          if (index > 0 && dossier.candidat && dossiersAutoEcole[index - 1]?.candidat) {
            const prevCandidat = dossiersAutoEcole[index - 1].candidat;
            if (dossier.candidat === prevCandidat) {
              console.error(`❌ ERREUR: Dossier ${index + 1} (${dossier.id}) partage la MÊME RÉFÉRENCE d'objet candidat que le dossier ${index} (${dossiersAutoEcole[index - 1].id})`);
              console.error(`   → C'est pourquoi les noms sont identiques !`);
            }
          }
          
          // Grouper par personne_id pour identifier les vrais candidats différents
          if (personneId) {
            if (!candidatsParPersonneId.has(personneId)) {
              candidatsParPersonneId.set(personneId, []);
            }
            candidatsParPersonneId.get(personneId)!.push({
              dossierId: dossier.id,
              candidat: dossier.candidat
            });
          }
        });

        // Afficher les alertes pour les IDs dupliqués avec des informations différentes
        candidatsParId.forEach((dossiers, candidatId) => {
          if (dossiers.length > 1) {
            const emails = dossiers.map(d => d.candidat.personne?.email).filter(Boolean);
            const personnesIds = dossiers.map(d => d.candidat.personne_id).filter(Boolean);
            const noms = dossiers.map(d => d.candidat.personne?.nom_complet).filter(Boolean);
            
            // Vérifier si les emails, personnes_ids ou noms sont différents
            const emailsUniques = new Set(emails);
            const personnesIdsUniques = new Set(personnesIds);
            const nomsUniques = new Set(noms);
            
            console.log(`\n🔍 Analyse candidat_id "${candidatId}" utilisé par ${dossiers.length} dossiers:`);
            console.log(`   • Personnes IDs uniques: ${personnesIdsUniques.size}`);
            console.log(`   • Emails uniques: ${emailsUniques.size}`);
            console.log(`   • Noms uniques: ${nomsUniques.size}`);
            
            if (emailsUniques.size > 1 || personnesIdsUniques.size > 1 || nomsUniques.size > 1) {
              console.warn(`⚠️ ATTENTION: Candidat ID "${candidatId}" utilisé par ${dossiers.length} dossiers différents avec des informations différentes:`);
              dossiers.forEach((d, idx) => {
                console.warn(`  Dossier ${idx + 1} (${d.dossierId}):`);
                console.warn(`    - Personne ID: ${d.candidat.personne_id}`);
                console.warn(`    - Email: ${d.candidat.personne?.email || 'N/A'}`);
                console.warn(`    - Nom complet: ${d.candidat.personne?.nom_complet || 'N/A'}`);
              });
            } else {
              console.warn(`⚠️ ATTENTION: Candidat ID "${candidatId}" utilisé par ${dossiers.length} dossiers avec les MÊMES informations:`);
              console.warn(`   → Cela peut signifier que les objets candidat sont partagés ou que les données sont identiques`);
              dossiers.forEach((d, idx) => {
                console.warn(`  Dossier ${idx + 1} (${d.dossierId}):`);
                console.warn(`    - Personne ID: ${d.candidat.personne_id}`);
                console.warn(`    - Email: ${d.candidat.personne?.email || 'N/A'}`);
                console.warn(`    - Nom complet: ${d.candidat.personne?.nom_complet || 'N/A'}`);
              });
            }
          }
        });

        // Convertir les dossiers en format DemandeInscription
        const demandesData: DemandeInscription[] = dossiersAutoEcole.map((dossier: any, index: number) => {
          // Mapper le statut vers le format attendu
          const mapStatut = (statut: string): 'en_attente' | 'en_cours' | 'validee' | 'rejetee' => {
            switch (statut) {
              case 'en_attente': return 'en_attente';
              case 'en_cours': return 'en_cours';
              case 'valide': return 'validee';
              case 'rejete': return 'rejetee';
              default: return 'en_attente';
            }
          };

          // CRÉER UNE COPIE PROFONDE du candidat pour éviter les références partagées
          // Si plusieurs dossiers partagent le même objet candidat, ils auront tous les mêmes données
          // On crée une copie indépendante pour chaque dossier
          let candidatComplet: any = null;
          let candidatPersonne: any = null;
          
          if (dossier.candidat) {
            // Comparer les données AVANT la copie pour diagnostiquer le problème
            if (index > 0 && dossiersAutoEcole[index - 1]?.candidat) {
              const prevCandidat = dossiersAutoEcole[index - 1].candidat;
              const sameReference = dossier.candidat === prevCandidat;
              const samePersonneId = dossier.candidat.personne_id === prevCandidat.personne_id;
              const sameEmail = dossier.candidat.personne?.email === prevCandidat.personne?.email;
              const sameNom = dossier.candidat.personne?.nom === prevCandidat.personne?.nom;
              const samePrenom = dossier.candidat.personne?.prenom === prevCandidat.personne?.prenom;
              
              if (sameReference) {
                console.error(`❌ ERREUR: Dossier ${index + 1} partage la MÊME RÉFÉRENCE d'objet candidat que le dossier ${index}`);
                console.error(`   → C'est pourquoi les noms sont identiques !`);
              } else if (samePersonneId && sameEmail && sameNom && samePrenom) {
                console.warn(`⚠️ Dossier ${index + 1} a les MÊMES DONNÉES candidat que le dossier ${index} (mais objets différents)`);
                console.warn(`   → Personne ID: ${dossier.candidat.personne_id}`);
                console.warn(`   → Email: ${dossier.candidat.personne?.email}`);
                console.warn(`   → Nom: ${dossier.candidat.personne?.nom} ${dossier.candidat.personne?.prenom}`);
              } else if (samePersonneId && (!sameEmail || !sameNom || !samePrenom)) {
                console.error(`❌ ERREUR: Dossier ${index + 1} et ${index} ont le MÊME personne_id mais des DONNÉES DIFFÉRENTES:`);
                console.error(`   → Personne ID: ${dossier.candidat.personne_id}`);
                console.error(`   → Email dossier ${index}: ${prevCandidat.personne?.email}`);
                console.error(`   → Email dossier ${index + 1}: ${dossier.candidat.personne?.email}`);
                console.error(`   → Nom dossier ${index}: ${prevCandidat.personne?.nom} ${prevCandidat.personne?.prenom}`);
                console.error(`   → Nom dossier ${index + 1}: ${dossier.candidat.personne?.nom} ${dossier.candidat.personne?.prenom}`);
              }
            }
            
            // Copie profonde de l'objet candidat et de sa personne
            // Créer une nouvelle copie pour chaque dossier pour éviter les références partagées
            candidatComplet = JSON.parse(JSON.stringify(dossier.candidat)); // Deep clone garanti
            candidatPersonne = candidatComplet.personne;
            
            // Vérifier après la copie que c'est bien une nouvelle référence
            if (candidatComplet === dossier.candidat) {
              console.error(`❌ ERREUR: La copie n'a pas créé une nouvelle référence !`);
            }
          }

          // Récupérer les informations complètes du candidat depuis le map
          const candidatId = dossier.candidat_id || candidatComplet?.id;
          
          console.log(`\n🔄 Transformation dossier ${index + 1} (${dossier.id}):`);
          console.log(`  • Candidat ID:`, candidatId);
          console.log(`  • Candidat présent:`, !!dossier.candidat);
          console.log(`  • Candidat copié (nouvelle référence):`, candidatComplet !== dossier.candidat);
          
          // Vérifier que le candidat est bien différent pour chaque dossier
          console.log(`  • Candidat ID du dossier:`, dossier.candidat?.id);
          console.log(`  • Personne ID du candidat:`, dossier.candidat?.personne_id);
          console.log(`  • Email du candidat dans le dossier:`, candidatPersonne?.email);
          console.log(`  • Nom complet du candidat:`, candidatPersonne?.nom_complet);
          console.log(`  • Nom:`, candidatPersonne?.nom);
          console.log(`  • Prénom:`, candidatPersonne?.prenom);
          
          // Si pas de candidat dans le dossier, chercher dans le map
          // ATTENTION: Le map peut contenir des données incorrectes si plusieurs candidats
          // partagent le même ID, donc on privilégie personne_id si disponible
          if (!candidatComplet && candidatId) {
            // Essayer d'abord par personne_id si disponible (plus fiable)
            const personneIdDuDossier = dossier.candidat?.personne_id;
            if (personneIdDuDossier) {
              const candidatParPersonneId = candidatsMap.get(`personne_${personneIdDuDossier}`);
              if (candidatParPersonneId) {
                candidatComplet = candidatParPersonneId;
                candidatPersonne = candidatComplet?.personne || null;
                console.log(`  • Candidat trouvé dans le map par personne_id (${personneIdDuDossier})`);
              }
            }
            
            // Sinon, essayer par candidat_id (mais avec vérification)
            if (!candidatComplet) {
              const candidatDuMap = candidatsMap.get(candidatId);
              if (candidatDuMap) {
                // Vérifier si le candidat du map correspond au dossier
                const personneIdDuMap = candidatDuMap.personne_id;
                
                // Si les personne_id correspondent ou si on n'a pas de personne_id dans le dossier
                if (!personneIdDuDossier || personneIdDuDossier === personneIdDuMap) {
                  candidatComplet = candidatDuMap;
                  candidatPersonne = candidatComplet?.personne || null;
                  console.log(`  • Candidat trouvé dans le map par candidat_id (personne_id: ${personneIdDuMap})`);
                } else {
                  console.warn(`  ⚠️ Le candidat du map a un personne_id différent (${personneIdDuMap} vs ${personneIdDuDossier}), utilisation des données du dossier uniquement`);
                }
              }
            }
          }
          
          if (!candidatPersonne) {
            console.error(`  ❌ ERREUR: Aucune information de personne trouvée pour le dossier ${dossier.id}`);
            console.error(`     - Candidat ID: ${candidatId}`);
            console.error(`     - Candidat présent dans dossier: ${!!dossier.candidat}`);
            console.error(`     - Candidat présent dans map: ${!!candidatsMap.get(candidatId)}`);
          }

          // Récupérer les informations complètes de la formation depuis le map
          const formationComplet = formationsMap.get(dossier.formation_id) || dossier.formation;
          const formationNom = formationComplet?.type_permis?.libelle || 
                                dossier.formation?.type_permis?.libelle || 
                                'Formation';
          const formationMontant = formationComplet?.montant_formate || 
                                    dossier.formation?.montant_formate || 
                                    'N/A';

          return {
            id: dossier.id,
            numero: `DOS-${dossier.id.substring(0, 8).toUpperCase()}`,
            candidat_id: candidatId, // ID candidat (peut être dupliqué)
            personne_id: candidatComplet?.personne_id || null, // ID personne (plus fiable pour distinguer)
            eleve: {
              // IMPORTANT: Utiliser UNIQUEMENT la copie profonde (candidatComplet/candidatPersonne)
              // pour éviter toute référence partagée qui causerait des noms identiques
              firstName: candidatPersonne?.prenom || '',
              lastName: candidatPersonne?.nom || '',
              email: candidatPersonne?.email || '',
              phone: candidatPersonne?.contact || '',
              address: candidatPersonne?.adresse || '',
              birthDate: candidatComplet?.date_naissance || '',
              nationality: candidatComplet?.nationalite || '',
              lieuNaissance: candidatComplet?.lieu_naissance || '',
              nationaliteEtrangere: undefined
            },
            autoEcole: {
              id: autoEcoleId,
              name: autoEcoleInfo.nom_auto_ecole,
              email: autoEcoleInfo.email
            },
            dateDemande: dossier.date_creation || dossier.created_at,
            statut: mapStatut(dossier.statut),
            documents: dossier.documents || [],
            commentaires: dossier.commentaires || '',
            // Informations supplémentaires du dossier
            formation: {
              id: dossier.formation_id,
              nom: formationNom,
              montant: formationMontant,
              description: formationComplet?.description || dossier.formation?.description || ''
            },
            etape: dossier.etape ? {
              id: dossier.etape.id,
              libelle: dossier.etape.libelle,
              ordre: dossier.etape.ordre,
              statut: dossier.etape.statut_systeme
            } : undefined
          };
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 DONNÉES TRANSFORMÉES POUR L\'AFFICHAGE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Nombre de demandes transformées:', demandesData.length);
        
        // Afficher les données transformées
        demandesData.forEach((demande: DemandeInscription, index: number) => {
          console.log(`\n📋 Demande ${index + 1}:`);
          console.log('  • ID:', demande.id);
          console.log('  • Numéro:', demande.numero);
          console.log('  • Candidat ID:', (demande as any).candidat_id);
          console.log('  • Personne ID:', (demande as any).personne_id || 'N/A');
          console.log('  • Élève:', `${demande.eleve.firstName} ${demande.eleve.lastName}`);
          console.log('  • Email:', demande.eleve.email);
          console.log('  • Téléphone:', demande.eleve.phone);
          console.log('  • Formation:', (demande as any).formation?.nom || 'N/A');
          console.log('  • Montant:', (demande as any).formation?.montant || 'N/A');
          console.log('  • Étape:', (demande as any).etape?.libelle || 'N/A');
          console.log('  • Statut:', demande.statut);
          console.log('  • Date demande:', demande.dateDemande);
          console.log('  • Documents:', demande.documents?.length || 0);
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Appliquer les filtres
        let demandesFiltrees = demandesData;
        
        console.log('🔍 Application des filtres...');
        console.log('  • Filtre statut:', filtres.statut || 'Aucun');
        console.log('  • Recherche:', filtres.recherche || 'Aucune');
        
        if (filtres.statut) {
          const avantFiltre = demandesFiltrees.length;
          demandesFiltrees = demandesFiltrees.filter(d => d.statut === filtres.statut);
          console.log(`  • Filtre statut appliqué: ${avantFiltre} → ${demandesFiltrees.length}`);
        }
        
        if (filtres.recherche) {
          const avantRecherche = demandesFiltrees.length;
          const recherche = filtres.recherche.toLowerCase();
          demandesFiltrees = demandesFiltrees.filter(d => 
            d.eleve.firstName.toLowerCase().includes(recherche) ||
            d.eleve.lastName.toLowerCase().includes(recherche) ||
            d.eleve.email.toLowerCase().includes(recherche) ||
            d.numero.toLowerCase().includes(recherche)
          );
          console.log(`  • Recherche appliquée: ${avantRecherche} → ${demandesFiltrees.length}`);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ RÉSULTAT FINAL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Nombre total de demandes affichées:', demandesFiltrees.length);
        console.log('📋 Demandes finales:', demandesFiltrees.map(d => ({
          id: d.id,
          numero: d.numero,
          candidat_id: (d as any).candidat_id,
          personne_id: (d as any).personne_id || null,
          eleve: {
            firstName: d.eleve.firstName,
            lastName: d.eleve.lastName,
            nom_complet: `${d.eleve.firstName} ${d.eleve.lastName}`,
            email: d.eleve.email,
            phone: d.eleve.phone
          },
          statut: d.statut,
          formation: (d as any).formation?.nom || 'N/A'
        })));
        
        // Log détaillé pour chaque demande
        demandesFiltrees.forEach((d, idx) => {
          console.log(`\n📋 Demande finale ${idx + 1}:`);
          console.log(`  • ID: ${d.id}`);
          console.log(`  • Numéro: ${d.numero}`);
          console.log(`  • Candidat ID: ${(d as any).candidat_id}`);
          console.log(`  • Personne ID: ${(d as any).personne_id || 'N/A'}`);
          console.log(`  • Élève: ${d.eleve.firstName} ${d.eleve.lastName}`);
          console.log(`  • Email: ${d.eleve.email}`);
          console.log(`  • Téléphone: ${d.eleve.phone}`);
          console.log(`  • Formation: ${(d as any).formation?.nom || 'N/A'}`);
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        setDemandes(demandesFiltrees);
      } else {
        console.log('⚠️ Aucun dossier trouvé dans les informations auto-école');
        setDemandes([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des dossiers:', error);
      setDemandes([]);
      
      // Afficher un message d'erreur spécifique
      if (error.response?.status === 404) {
        console.warn('⚠️ Aucun dossier trouvé pour cette auto-école');
      } else if (error.message?.includes('auto-école')) {
        console.warn('⚠️ Problème de récupération de l\'auto-école associée');
      }
    } finally {
      setLoading(false);
    }
  };

  const chargerStatistiques = async () => {
    try {
      // Récupérer les dossiers depuis les informations d'auto-école
      const dossiersAutoEcole = getAutoEcoleDossiers();
      
      if (dossiersAutoEcole && dossiersAutoEcole.length > 0) {
        const stats: StatistiquesDemandes = {
          total: dossiersAutoEcole.length,
          enAttente: dossiersAutoEcole.filter((d: any) => d.statut === 'en_attente').length,
          enCours: dossiersAutoEcole.filter((d: any) => d.statut === 'en_cours').length,
          validees: dossiersAutoEcole.filter((d: any) => d.statut === 'valide' || d.statut === 'validee').length,
          rejetees: dossiersAutoEcole.filter((d: any) => d.statut === 'rejete' || d.statut === 'rejetee').length,
          parAutoEcole: {}
        };
        
        setStatistiques(stats);
        console.log('📊 Statistiques chargées depuis les dossiers auto-école:', stats);
      } else {
        // Statistiques par défaut si pas de données
        setStatistiques({
          total: 0,
          enAttente: 0,
          enCours: 0,
          validees: 0,
          rejetees: 0,
          parAutoEcole: {}
        });
        console.log('📊 Aucun dossier trouvé pour les statistiques');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      // Les statistiques par défaut (vides) seront utilisées
      setStatistiques({
        total: 0,
        enAttente: 0,
        enCours: 0,
        validees: 0,
        rejetees: 0,
        parAutoEcole: {}
      });
    }
  };

  const handleRecherche = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecherche(event.target.value);
    setFiltres(prev => ({ ...prev, recherche: event.target.value }));
  };

  const handleFiltreStatut = (statut: string) => {
    setFiltres(prev => ({ ...prev, statut: statut || undefined }));
  };

  const handleDeleteClick = (demande: DemandeInscription) => {
    setDemandeToDelete(demande);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!demandeToDelete) return;

    setDeleteLoading(true);
    try {
      await autoEcoleService.deleteDossier(demandeToDelete.id);
      
      // Afficher un message de succès
      setSnackbar({
        open: true,
        message: `La demande d'inscription de ${demandeToDelete.eleve.firstName} ${demandeToDelete.eleve.lastName} a été supprimée avec succès`,
        severity: 'success'
      });

      // Fermer le dialogue
      setDeleteDialogOpen(false);
      setDemandeToDelete(null);

      // Rafraîchir la liste
      await chargerDemandes();
      await chargerStatistiques();

      // Appeler le callback si fourni
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erreur lors de la suppression de la demande',
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDemandeToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'warning';
      case 'en_cours': return 'info';
      case 'valide':
      case 'validee': return 'success';
      case 'eleve_inscrit': return 'success';
      case 'rejete':
      case 'rejetee': return 'error';
      default: return 'default';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'valide':
      case 'validee': return 'Validé';
      case 'eleve_inscrit': return 'Élève inscrit';
      case 'rejete':
      case 'rejetee': return 'Rejeté';
      default: return statut;
    }
  };

  const handleVoirDetails = (demande: DemandeInscription) => {
    console.log('📋 Détails du dossier sélectionné:', demande);
    
    // Afficher les détails dans la console pour le moment
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📁 DÉTAILS DU DOSSIER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Informations générales:');
    console.log('  • Numéro:', demande.numero);
    console.log('  • ID:', demande.id);
    console.log('  • Date demande:', demande.dateDemande);
    console.log('  • Statut:', demande.statut);
    console.log('  • Commentaires:', demande.commentaires);
    
    // Récupérer les informations complètes depuis les maps
    // Utiliser personne_id en priorité si disponible (plus fiable pour distinguer)
    let candidatComplet = null;
    const personneId = (demande as any).personne_id;
    if (personneId) {
      candidatComplet = candidatsMap.get(`personne_${personneId}`) || null;
    }
    // Sinon, essayer par candidat_id
    if (!candidatComplet && (demande as any).candidat_id) {
      candidatComplet = candidatsMap.get((demande as any).candidat_id) || null;
    }
    const formationComplet = formationsMap.get((demande as any).formation?.id) || (demande as any).formation;
    
    console.log('\n👤 Informations élève:');
    console.log('  • Candidat ID:', (demande as any).candidat_id || 'N/A');
    console.log('  • Personne ID:', personneId || 'N/A');
    console.log('  • Nom complet:', demande.eleve.firstName, demande.eleve.lastName);
    if (candidatComplet?.personne?.nom_complet) {
      console.log('  • Nom complet (API):', candidatComplet.personne.nom_complet);
    }
    console.log('  • Email:', demande.eleve.email);
    console.log('  • Téléphone:', demande.eleve.phone);
    console.log('  • Adresse:', demande.eleve.address);
    console.log('  • Date naissance:', demande.eleve.birthDate);
    console.log('  • Lieu naissance:', demande.eleve.lieuNaissance);
    console.log('  • Nationalité:', demande.eleve.nationality);
    if (candidatComplet?.numero_candidat) {
      console.log('  • Numéro candidat:', candidatComplet.numero_candidat);
    }
    
    console.log('\n🏫 Informations auto-école:');
    console.log('  • Nom:', demande.autoEcole.name);
    console.log('  • ID:', demande.autoEcole.id);
    console.log('  • Email:', demande.autoEcole.email);
    
    if ((demande as any).formation || formationComplet) {
      console.log('\n📚 Informations formation:');
      console.log('  • Nom:', (demande as any).formation?.nom || formationComplet?.type_permis?.libelle || 'N/A');
      console.log('  • Montant:', (demande as any).formation?.montant || formationComplet?.montant_formate || 'N/A');
      console.log('  • Description:', (demande as any).formation?.description || formationComplet?.description || 'N/A');
      if (formationComplet?.type_permis) {
        console.log('  • Type permis:', formationComplet.type_permis.libelle);
        console.log('  • Code:', formationComplet.type_permis.code);
      }
      if (formationComplet?.session) {
        console.log('  • Session:', formationComplet.session.libelle);
      }
    }
    
    if ((demande as any).etape) {
      console.log('\n🔄 Informations étape:');
      console.log('  • Libellé:', (demande as any).etape.libelle);
      console.log('  • Ordre:', (demande as any).etape.ordre);
      console.log('  • Statut:', (demande as any).etape.statut);
    }
    
    console.log('\n📄 Documents:');
    if (demande.documents && demande.documents.length > 0) {
      demande.documents.forEach((doc: any, index: number) => {
        console.log(`  ${index + 1}. ${doc.nom_fichier || doc.nom || 'Document'}`);
        console.log(`     • Type: ${doc.type_document?.libelle || 'N/A'}`);
        console.log(`     • Validé: ${doc.valide ? 'Oui' : 'Non'}`);
        console.log(`     • Taille: ${doc.taille_fichier_formate || 'N/A'}`);
        console.log(`     • Commentaires: ${doc.commentaires || 'Aucun'}`);
      });
    } else {
      console.log('  Aucun document');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (onCandidatSelect) {
      onCandidatSelect(demande);
    }
  };


  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Chargement des demandes d'inscription...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Informations sur l'auto-école connectée */}
      {(() => {
        const autoEcoleInfo = getAutoEcoleInfo();
        return autoEcoleInfo ? (
          <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏫 {autoEcoleInfo.nom_auto_ecole}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📧 {autoEcoleInfo.email} | 📞 {autoEcoleInfo.contact} | 📍 {autoEcoleInfo.adresse}
              </Typography>
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Statistiques */}
      {statistiques && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total
                </Typography>
                <Typography variant="h4">
                  {statistiques.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  En attente
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {statistiques.enAttente}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Validées
                </Typography>
                <Typography variant="h4" color="success.main">
                  {statistiques.validees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Rejetées
                </Typography>
                <Typography variant="h4" color="error.main">
                  {statistiques.rejetees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtres et actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Rechercher..."
          value={recherche}
          onChange={handleRecherche}
          InputProps={{
            startAdornment: <MagnifyingGlassIcon className="w-5 h-5 mr-1 text-gray-400" />
          }}
          sx={{ minWidth: 200 }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={filtres.statut || ''}
            onChange={(e) => handleFiltreStatut(e.target.value)}
            label="Statut"
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="en_attente">En attente</MenuItem>
            <MenuItem value="en_cours">En cours</MenuItem>
            <MenuItem value="validee">Validée</MenuItem>
            <MenuItem value="rejetee">Rejetée</MenuItem>
          </Select>
        </FormControl>

        
      </Box>

      {/* Tableau des demandes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Nom & Prenom</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>Étape</TableCell>
              <TableCell>Date demande</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Documents</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {demandes.map((demande) => (
              <TableRow key={demande.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {demande.numero}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {demande.eleve.firstName} {demande.eleve.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {demande.eleve.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {demande.eleve.phone}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <IdentificationIcon className="w-4 h-4" /> {demande.numero}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {(demande as any).formation?.nom || 'Formation'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <CurrencyDollarIcon className="w-4 h-4" /> {(demande as any).formation?.montant || 'N/A'}
                    </Typography>
                    {(demande as any).formation?.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        📝 {(demande as any).formation.description.substring(0, 30)}...
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    { (demande as any).etape?.libelle ? (
                      <>
                    <Typography variant="body2">
                          {(demande as any).etape?.libelle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                          Ordre: {(demande as any).etape?.ordre || '-'}
                    </Typography>
                      </>
                    ) : (
                      <Chip 
                        icon={<ExclamationTriangleIcon className="w-4 h-4" />} 
                        label="Étape: Demande d'inscription" 
                        color="warning" 
                        size="small"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(demande.dateDemande).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatutLabel(demande.statut)}
                    color={getStatutColor(demande.statut) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {demande.documents.length} document(s)
                    </Typography>
                    {demande.documents.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {demande.documents.filter((doc: any) => doc.valide).length} validé(s)
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleVoirDetails(demande)}
                    color="primary"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </IconButton>
                  <IconButton size="small" color="secondary">
                    <PencilIcon className="w-4 h-4" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteClick(demande)}
                    title="Supprimer la demande"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Êtes-vous sûr de vouloir supprimer la demande d'inscription de{' '}
            <strong>
              {demandeToDelete?.eleve.firstName} {demandeToDelete?.eleve.lastName}
            </strong>
            {' '}?
            <br />
            <br />
            Cette action est irréversible et supprimera définitivement la demande et tous ses documents associés.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les messages de succès/erreur */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default DemandesInscriptionTable;

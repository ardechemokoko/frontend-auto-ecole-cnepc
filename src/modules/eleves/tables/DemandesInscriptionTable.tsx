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
  CardContent
} from '@mui/material';
// Heroicons imports
import { EyeIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { DemandeInscription, FiltresDemandes, StatistiquesDemandes } from '../types/inscription';
import { getAutoEcoleInfo, getAutoEcoleId, getAutoEcoleDossiers } from '../../../shared/utils/autoEcoleUtils';
import { candidatsService, CandidatApiItem } from '../services/candidats.service';
import { formationsService, FormationApiItem } from '../services/formations.service';

interface DemandesInscriptionTableProps {
  onCandidatSelect?: (candidat: DemandeInscription) => void;
  refreshTrigger?: number; // Pour forcer le rafraîchissement
}

const DemandesInscriptionTable: React.FC<DemandesInscriptionTableProps> = ({ onCandidatSelect, refreshTrigger }) => {
  const [demandes, setDemandes] = useState<DemandeInscription[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiquesDemandes | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtres, setFiltres] = useState<FiltresDemandes>({});
  const [recherche, setRecherche] = useState('');
  const [candidats, setCandidats] = useState<CandidatApiItem[]>([]);
  const [formations, setFormations] = useState<FormationApiItem[]>([]);
  const [candidatsLoading, setCandidatsLoading] = useState(false);
  const [formationsLoading, setFormationsLoading] = useState(false);

  useEffect(() => {
    chargerCandidats();
    chargerFormations();
    chargerDemandes();
    chargerStatistiques();
  }, [filtres, refreshTrigger]);

  const chargerCandidats = async () => {
    try {
      setCandidatsLoading(true);
      console.log('👥 Chargement des candidats...');
      
      // Récupérer le token depuis le localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ Aucun token trouvé pour récupérer les candidats');
        return;
      }
      
      const response = await candidatsService.getAllCandidats(token);
      setCandidats(response.data);
      console.log('✅ Candidats chargés:', response.data.length);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des candidats:', error);
      setCandidats([]);
    } finally {
      setCandidatsLoading(false);
    }
  };

  const chargerFormations = async () => {
    try {
      setFormationsLoading(true);
      console.log('📚 Chargement des formations...');
      
      // Récupérer le token depuis le localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ Aucun token trouvé pour récupérer les formations');
        return;
      }
      
      // Récupérer l'ID de l'auto-école connectée
      const autoEcoleId = getAutoEcoleId();
      if (!autoEcoleId) {
        console.warn('⚠️ Aucune auto-école trouvée pour récupérer les formations');
        return;
      }
      
      const formationsData = await formationsService.getFormationsByAutoEcole(autoEcoleId, token);
      setFormations(formationsData);
      console.log('✅ Formations chargées:', formationsData.length);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des formations:', error);
      setFormations([]);
    } finally {
      setFormationsLoading(false);
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
        return;
      }
      
      console.log('🏫 Auto-école connectée:', autoEcoleInfo.nom_auto_ecole, '(ID:', autoEcoleId, ')');
      
      // Récupérer les dossiers depuis les informations d'auto-école
      const dossiersAutoEcole = getAutoEcoleDossiers();
      
      if (dossiersAutoEcole && dossiersAutoEcole.length > 0) {
        console.log('📁 Dossiers trouvés dans les informations auto-école:', dossiersAutoEcole.length);
        
        // Convertir les dossiers en format DemandeInscription
        const demandesData: DemandeInscription[] = dossiersAutoEcole.map((dossier: any) => {
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

          // Trouver le candidat correspondant
          const candidat = candidats.find(c => c.id === dossier.candidat_id);
          
          // Trouver la formation correspondante
          const formation = formations.find(f => f.id === dossier.formation_id);

          return {
            id: dossier.id,
            numero: `DOS-${dossier.id.substring(0, 8).toUpperCase()}`,
            eleve: {
              firstName: candidat?.personne?.prenom || dossier.candidat?.personne?.prenom || '',
              lastName: candidat?.personne?.nom || dossier.candidat?.personne?.nom || '',
              email: candidat?.personne?.email || dossier.candidat?.personne?.email || '',
              phone: candidat?.personne?.contact || dossier.candidat?.personne?.contact || '',
              address: candidat?.personne?.adresse || dossier.candidat?.personne?.adresse || '',
              birthDate: candidat?.date_naissance || dossier.candidat?.date_naissance || '',
              nationality: candidat?.nationalite || dossier.candidat?.nationalite || '',
              lieuNaissance: candidat?.lieu_naissance || dossier.candidat?.lieu_naissance || '',
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
            // Informations supplémentaires du dossier avec les vrais noms
            formation: formation ? {
              id: formation.id,
              nom: formation.type_permis?.libelle || 'Formation',
              montant: formation.montant_formate || 'N/A',
              description: formation.description || ''
            } : (dossier.formation ? {
              id: dossier.formation.id,
              nom: dossier.formation.type_permis?.libelle || 'Formation',
              montant: dossier.formation.montant_formate || 'N/A',
              description: dossier.formation.description || ''
            } : undefined),
            etape: dossier.etape ? {
              id: dossier.etape.id,
              libelle: dossier.etape.libelle,
              ordre: dossier.etape.ordre,
              statut: dossier.etape.statut_systeme
            } : undefined
          };
        });
        
        // Appliquer les filtres
        let demandesFiltrees = demandesData;
        
        if (filtres.statut) {
          demandesFiltrees = demandesFiltrees.filter(d => d.statut === filtres.statut);
        }
        
        if (filtres.recherche) {
          const recherche = filtres.recherche.toLowerCase();
          demandesFiltrees = demandesFiltrees.filter(d => 
            d.eleve.firstName.toLowerCase().includes(recherche) ||
            d.eleve.lastName.toLowerCase().includes(recherche) ||
            d.eleve.email.toLowerCase().includes(recherche) ||
            d.numero.toLowerCase().includes(recherche)
          );
        }
        
        setDemandes(demandesFiltrees);
        console.log('✅ Dossiers chargés:', demandesFiltrees.length, 'sur', demandesData.length, 'total');
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

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'warning';
      case 'en_cours': return 'info';
      case 'valide':
      case 'validee': return 'success';
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
    
    console.log('\n👤 Informations élève:');
    console.log('  • Nom complet:', demande.eleve.firstName, demande.eleve.lastName);
    console.log('  • Email:', demande.eleve.email);
    console.log('  • Téléphone:', demande.eleve.phone);
    console.log('  • Adresse:', demande.eleve.address);
    console.log('  • Date naissance:', demande.eleve.birthDate);
    console.log('  • Lieu naissance:', demande.eleve.lieuNaissance);
    console.log('  • Nationalité:', demande.eleve.nationality);
    
    console.log('\n🏫 Informations auto-école:');
    console.log('  • Nom:', demande.autoEcole.name);
    console.log('  • ID:', demande.autoEcole.id);
    console.log('  • Email:', demande.autoEcole.email);
    
    if ((demande as any).formation) {
      console.log('\n📚 Informations formation:');
      console.log('  • Nom:', (demande as any).formation.nom);
      console.log('  • Montant:', (demande as any).formation.montant);
      console.log('  • Description:', (demande as any).formation.description);
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


  if (loading || candidatsLoading || formationsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>
          {loading && 'Chargement des demandes d\'inscription...'}
          {candidatsLoading && 'Chargement des candidats...'}
          {formationsLoading && 'Chargement des formations...'}
        </Typography>
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                👥 Candidats chargés: {candidats.length} | 📚 Formations chargées: {formations.length}
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
              <TableCell>Élève</TableCell>
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
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {(demande as any).formation?.nom || 'Formation'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(demande as any).formation?.montant || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {(demande as any).etape?.libelle || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ordre: {(demande as any).etape?.ordre || 'N/A'}
                    </Typography>
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
                  <IconButton size="small" color="error">
                    <TrashIcon className="w-4 h-4" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
};

export default DemandesInscriptionTable;

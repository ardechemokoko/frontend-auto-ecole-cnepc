import React from 'react';
import { ReceptionDossier } from '../../../types';
import { circuitSuiviService, CircuitSuivi } from '../../../services/circuit-suivi.service';
import { typeDemandeService } from '../../../../cnepc/services';
import { DossierSuivi } from '../types';

export function useDossierSuivi(
  dossiers: ReceptionDossier[],
  typeDemandeName: string,
  typeDemandeId?: string,
  circuitProp?: CircuitSuivi | null
) {
  const [suiviMap, setSuiviMap] = React.useState<Map<string, DossierSuivi>>(new Map());
  const [loadingSuivi, setLoadingSuivi] = React.useState(false);

  React.useEffect(() => {
    const loadSuivi = async () => {
      if (dossiers.length === 0) {
        setSuiviMap(new Map());
        return;
      }

      setLoadingSuivi(true);
      const newSuiviMap = new Map<string, DossierSuivi>();

      try {
        // Étape 1: Charger le circuit UNE SEULE FOIS pour tous les dossiers
        let circuit: CircuitSuivi | null = null;
        
        console.log('🔍 ReceptionDossierTypeTable - Paramètres reçus:', {
          typeDemandeName,
          typeDemandeId,
          circuitProp: circuitProp ? 'présent' : 'absent',
          nombreDossiers: dossiers.length
        });
        
        if (dossiers.length > 0) {
          console.log('📄 JSON complet du premier dossier:', JSON.stringify(dossiers[0], null, 2));
        }
        
        // Si le circuit est déjà passé en prop, l'utiliser directement
        if (circuitProp) {
          circuit = circuitProp;
          if (circuit.id && (!circuit.etapes || circuit.etapes.length === 0)) {
            try {
              console.log(`📋 Chargement des étapes pour le circuit ${circuit.id}...`);
              const etapes = await circuitSuiviService.getEtapesByCircuitId(circuit.id);
              if (etapes.length > 0) {
                circuit.etapes = etapes;
                console.log(`✅ ${etapes.length} étapes chargées pour le circuit ${circuit.libelle}`);
              }
            } catch (err: any) {
              console.warn(`⚠️ Impossible de charger les étapes pour le circuit ${circuit.id}:`, err.message);
            }
          }
          console.log('✅ Circuit utilisé depuis la prop:', JSON.stringify(circuit, null, 2));
        } else {
          // Sinon, charger le circuit
          if (typeDemandeName) {
            try {
              circuit = await circuitSuiviService.getCircuitByNomEntite(typeDemandeName);
              if (circuit && circuit.id && (!circuit.etapes || circuit.etapes.length === 0)) {
                try {
                  console.log(`📋 Chargement des étapes pour le circuit ${circuit.id}...`);
                  const etapes = await circuitSuiviService.getEtapesByCircuitId(circuit.id);
                  if (etapes.length > 0) {
                    circuit.etapes = etapes;
                    console.log(`✅ ${etapes.length} étapes chargées pour le circuit ${circuit.libelle}`);
                  }
                } catch (err) {
                  console.warn(`⚠️ Impossible de charger les étapes pour le circuit ${circuit.id}:`, err);
                }
              }
              console.log('✅ Circuit chargé avec typeDemandeName:', JSON.stringify(circuit, null, 2));
            } catch (err) {
              console.warn('⚠️ Impossible de charger le circuit avec typeDemandeName:', err);
            }
          }
          
          if (!circuit && typeDemandeId && typeDemandeId !== 'non_specifie' && typeDemandeId !== 'null' && typeDemandeId !== 'undefined') {
            try {
              const typeDemande = await typeDemandeService.getTypeDemandeById(typeDemandeId);
              console.log('📋 Type de demande chargé:', JSON.stringify(typeDemande, null, 2));
              if (typeDemande?.name) {
                circuit = await circuitSuiviService.getCircuitByNomEntite(typeDemande.name);
                if (circuit && circuit.id && (!circuit.etapes || circuit.etapes.length === 0)) {
                  try {
                    console.log(`📋 Chargement des étapes pour le circuit ${circuit.id}...`);
                    const etapes = await circuitSuiviService.getEtapesByCircuitId(circuit.id);
                    if (etapes.length > 0) {
                      circuit.etapes = etapes;
                      console.log(`✅ ${etapes.length} étapes chargées pour le circuit ${circuit.libelle}`);
                    }
                  } catch (err) {
                    console.warn(`⚠️ Impossible de charger les étapes pour le circuit ${circuit.id}:`, err);
                  }
                }
                console.log('✅ Circuit chargé avec typeDemandeId:', JSON.stringify(circuit, null, 2));
              }
            } catch (err) {
              if (err && typeof err === 'object' && 'response' in err && (err as any).response?.status !== 404) {
                console.warn('⚠️ Impossible de charger le circuit avec typeDemandeId:', err);
              }
            }
          }
        }
        
        if (circuit) {
          console.log('🎯 Circuit final utilisé:', JSON.stringify(circuit, null, 2));
        } else {
          console.warn('⚠️ Aucun circuit trouvé pour les paramètres:', { typeDemandeName, typeDemandeId });
        }

        // Étape 2: Charger les documents de manière asynchrone et progressive (par batch)
        const BATCH_SIZE = 5;
        const dossiersArray = Array.from(dossiers);
        
        for (let i = 0; i < dossiersArray.length; i += BATCH_SIZE) {
          const batch = dossiersArray.slice(i, i + BATCH_SIZE);
          
          await Promise.all(
            batch.map(async (dossier) => {
              try {
                console.log(`📄 JSON complet du dossier ${dossier.id}:`, JSON.stringify(dossier, null, 2));
                
                const documents = await circuitSuiviService.getDocumentsByDossier(dossier.id);
                
                const documentsForDossier = documents.filter((doc: any) => {
                  return !doc.documentable_id || doc.documentable_id === dossier.id;
                });
                
                const documentsValides = documentsForDossier.filter((d: any) => d.valide).length;

                // Calculer la progression
                let progress = 0;
                let currentEtape = null;
                let status: 'pending' | 'in_progress' | 'completed' | 'blocked' = 'pending';

                if (circuit && circuit.etapes && circuit.etapes.length > 0) {
                  const totalEtapes = circuit.etapes.length;
                  
                  const etapesCompletes = circuit.etapes.filter(etape => {
                    if (!etape.pieces || etape.pieces.length === 0) {
                      return true;
                    }
                    
                    return etape.pieces.every(piece => {
                      const docsForPiece = documentsForDossier.filter((doc: any) => 
                        doc.piece_justification_id === piece.type_document
                      );
                      
                      if (docsForPiece.length === 0) {
                        const docsByType = documentsForDossier.filter((doc: any) => 
                          doc.type_document_id === piece.type_document
                        );
                        return docsByType.length > 0 && docsByType.some((doc: any) => doc.valide);
                      }
                      
                      return docsForPiece.some((doc: any) => doc.valide === true);
                    });
                  }).length;

                  progress = totalEtapes > 0 ? Math.round((etapesCompletes / totalEtapes) * 100) : 0;
                  
                  const etapeActuelle = circuit.etapes.find(etape => {
                    if (!etape.pieces || etape.pieces.length === 0) {
                      return false;
                    }
                    
                    return !etape.pieces.every(piece => {
                      const docsForPiece = documentsForDossier.filter((doc: any) => 
                        doc.piece_justification_id === piece.type_document
                      );
                      
                      if (docsForPiece.length === 0) {
                        const docsByType = documentsForDossier.filter((doc: any) => 
                          doc.type_document_id === piece.type_document
                        );
                        return docsByType.length > 0 && docsByType.some((doc: any) => doc.valide);
                      }
                      
                      return docsForPiece.some((doc: any) => doc.valide === true);
                    });
                  });

                  currentEtape = etapeActuelle?.libelle || null;
                  
                  if (progress === 100) {
                    status = 'completed';
                  } else if (progress > 0) {
                    status = 'in_progress';
                  } else {
                    status = 'pending';
                  }
                }

                newSuiviMap.set(dossier.id, {
                  dossierId: dossier.id,
                  circuit,
                  currentEtape,
                  progress,
                  documentsCount: documentsForDossier.length,
                  documentsValides,
                  status
                });
                
                console.log(`✅ Suivi calculé pour dossier ${dossier.id}:`, {
                  totalDocuments: documents.length,
                  documentsForDossier: documentsForDossier.length,
                  documentsValides,
                  progress,
                  currentEtape,
                  status
                });
              } catch (err: any) {
                console.error(`❌ Erreur lors du chargement du suivi pour dossier ${dossier.id}:`, err);
                newSuiviMap.set(dossier.id, {
                  dossierId: dossier.id,
                  circuit,
                  currentEtape: null,
                  progress: 0,
                  documentsCount: 0,
                  documentsValides: 0,
                  status: 'pending'
                });
              }
            })
          );
          
          setSuiviMap(new Map(newSuiviMap));
          
          if (i + BATCH_SIZE < dossiersArray.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement du circuit:', err);
      } finally {
        setLoadingSuivi(false);
      }
    };

    loadSuivi();
  }, [dossiers, typeDemandeName, typeDemandeId, circuitProp]);

  return { suiviMap, loadingSuivi };
}


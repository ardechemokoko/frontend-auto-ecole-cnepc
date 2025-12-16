import { useState, useRef } from 'react';
import axiosClient from '../../../shared/environment/envdev';
import { PieceEtape, EtapeCircuit } from '../services/circuit-suivi.service';

export const useDocumentUploadForPiece = (
  dossierId?: string,
  onDocumentUploaded?: () => void
) => {
  const [uploadingForPiece, setUploadingForPiece] = useState<string | null>(null);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const handleUploadForPiece = (piece: PieceEtape, etape: EtapeCircuit) => {
    const pieceId = `${etape.id}-${piece.type_document}`;
    const input = fileInputRefs.current.get(pieceId);
    if (input) {
      input.click();
    }
  };

  const handleFileSelectForPiece = async (
    event: React.ChangeEvent<HTMLInputElement>,
    piece: PieceEtape,
    etape: EtapeCircuit
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !dossierId) return;

    const file = files[0];
    const pieceId = `${etape.id}-${piece.type_document}`;
    setUploadingForPiece(pieceId);

    try {
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSize) {
        alert('Le fichier ne doit pas dépasser 5 MB');
        setUploadingForPiece(null);
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Format non autorisé. Utilisez PDF, JPG ou PNG');
        setUploadingForPiece(null);
        return;
      }

      const cleanFileName = file.name.trim();
      const formData = new FormData();
      formData.append('documentable_id', dossierId);
      formData.append('documentable_type', 'App\\Models\\Dossier');
      formData.append('piece_justification_id', piece.type_document);
      formData.append('valide', '0');
      formData.append('commentaires', '');
      formData.append('fichier', file, cleanFileName);

      console.log('📤 Upload document pour pièce justificative:', {
        dossierId,
        pieceJustificationId: piece.type_document,
        pieceLibelle: piece.libelle,
        fileName: cleanFileName
      });

      const response = await axiosClient.post('/documents', formData, {
        timeout: 300000,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success && response.data.data) {
        const uploadedDocument = response.data.data;
        console.log('✅ Document uploadé avec succès:', {
          documentId: uploadedDocument.id,
          documentableId: uploadedDocument.documentable_id
        });
        
        if (uploadedDocument.documentable_id !== dossierId) {
          console.error('⚠️ ATTENTION: Le document uploadé n\'est pas associé au bon dossier!');
        }
        
        if (onDocumentUploaded) {
          onDocumentUploaded();
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload du document:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'upload';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setUploadingForPiece(null);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return {
    uploadingForPiece,
    fileInputRefs,
    handleUploadForPiece,
    handleFileSelectForPiece
  };
};


// Service des documents avec mocks
import { Document } from '../types/student';
import { UploadDocumentResponse } from './types';
import { uploadDocumentMock, getStudentDocumentsMock } from './eleve.service';

class DocumentService {
  async uploadDocument(
    studentId: string, 
    file: File, 
    type: string
  ): Promise<UploadDocumentResponse> {
    try {
      // Utilisation du mock pour le développement
      const document = await uploadDocumentMock(studentId, file, type);
      return {
        id: document.id,
        type: document.type,
        name: document.name,
        url: document.url,
        size: document.size,
        uploadedAt: document.uploadedAt,
        status: document.status
      };
    } catch (error: any) {
      throw new Error(`Erreur lors de l'upload: ${error.message}`);
    }
  }

  async getStudentDocuments(studentId: string): Promise<Document[]> {
    try {
      // Utilisation du mock pour le développement
      return await getStudentDocumentsMock(studentId);
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des documents: ${error.message}`);
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Utilisation du mock pour le développement
      console.log(`Document supprimé (mock)`);
    } catch (error: any) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      // Utilisation du mock pour le développement
      return new Blob(['Mock document content'], { type: 'application/pdf' });
    } catch (error: any) {
      throw new Error(`Erreur lors du téléchargement: ${error.message}`);
    }
  }

  async validateDocument(documentId: string): Promise<Document> {
    try {
      // Utilisation du mock pour le développement
      const documents = await getStudentDocumentsMock('1'); // Mock student ID
      const document = documents.find(d => d.id === documentId);
      if (!document) {
        throw new Error('Document non trouvé');
      }
      document.status = 'uploaded';
      return document;
    } catch (error: any) {
      throw new Error(`Erreur lors de la validation: ${error.message}`);
    }
  }

  async getDocumentPreview(documentId: string): Promise<string> {
    try {
      // Utilisation du mock pour le développement
      return `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=`;
    } catch (error: any) {
      throw new Error(`Erreur lors de la prévisualisation: ${error.message}`);
    }
  }

  validateFile(file: File): { isValid: boolean; error?: string } {
    // Validation des fichiers
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'Fichier trop volumineux (max 10MB)' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Type de fichier non autorisé' };
    }
    
    return { isValid: true };
  }
}

export default new DocumentService();

// Version API future (préparée mais commentée)
// import { AxiosResponse } from 'axios';
// import apiClient from '../../../shared/utils/axiosConfig';

// class DocumentService {
//   async uploadDocument(studentId: string, file: File, type: string): Promise<UploadDocumentResponse> {
//     try {
//       const formData = new FormData();
//       formData.append('file', file);
//       formData.append('type', type);
//       formData.append('studentId', studentId);
//       const response: AxiosResponse<UploadDocumentResponse> = await apiClient.post('/documents/upload', formData);
//       return response.data;
//     } catch (error: any) {
//       throw new Error(`Erreur lors de l'upload: ${error.message}`);
//     }
//   }
//   // ... autres méthodes API
// }
import axiosAuthentifcation from '../../../shared/environment/envauth'
import { TypeDocument } from '../types/type-document'

interface ApiResponse<T> {
  data: T[]
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    last_page: number
    total: number
  }
}

/**
 * Service pour gérer les référentiels
 */
export class TypeDocumentService {
  private url = '/referentiels'

  /**
   * Récupère les référentiels dont type_ref = "TYPE_DOCUMENT"
   */
  async getTypeDocuments(): Promise<TypeDocument[]> {
    try {
      const res = await axiosAuthentifcation.get<ApiResponse<TypeDocument>>(this.url, {
        params: { type_ref: 'TYPE_DOCUMENT' },
      })

      // Formattage simplifié : on renvoie uniquement les "data"
      return res.data.data.map((doc) => ({
        id: doc.id,
        libelle: doc.libelle,
        code: doc.code,
        type_ref: doc.type_ref,
        description: doc.description,
        statut: doc.statut,
        statut_libelle: doc.statut_libelle,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      }))
    } catch (error: any) {
      console.error('Erreur lors de la récupération des référentiels TYPE_DOCUMENT:', error)
      throw new Error(error.response?.data?.message ?? 'Erreur de connexion au serveur')
    }
  }
}

// === Export par défaut ===
export const typeDocumentService = new TypeDocumentService()

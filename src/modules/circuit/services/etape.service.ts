import axiosAuthentifcation from '../../../shared/environment/envauth'
import { Etape } from '../types/etape'

export class EtapeService {
  private url = '/workflow/etapes'

  async getByCircuitId(circuitId: string): Promise<Etape[]> {
    const res = await axiosAuthentifcation.get(`${this.url}?circuit_id=${circuitId}`)
    return res.data
  }

  async create(payload: Partial<Etape>): Promise<Etape> {
    const res = await axiosAuthentifcation.post(this.url, payload)
    return res.data
  }

  async remove(id: string): Promise<void> {
    await axiosAuthentifcation.delete(`${this.url}/${id}`)
  }
}

export const etapeService = new EtapeService()
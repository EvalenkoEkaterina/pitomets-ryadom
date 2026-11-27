import type { Pet } from '../types/pet'
import { fetchApi } from './fetchApi'

const API_URL = import.meta.env.VITE_API_URL

async function apiError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null)
  if (typeof body?.detail === 'string' && body.detail.trim()) {
    return new Error(body.detail)
  }
  if (Array.isArray(body?.detail) && body.detail.length > 0) {
    const details = body.detail.map((item: { loc?: string[]; msg?: string } | null) => {
      const field = Array.isArray(item?.loc)
        ? item.loc.filter((part) => part !== 'body').join('.')
        : ''
      return `${field || 'Поле'}: ${item?.msg || 'неверное значение'}`
    })
    return new Error(details.join('; '))
  }
  return new Error(`Не удалось выполнить запрос (HTTP ${response.status}). Попробуйте ещё раз.`)
}

export async function getPets(
  reportType: string | null,
  species: string | null
): Promise<Pet[]> {
  const params = new URLSearchParams()

  if (reportType === 'found' || reportType === 'lost') {
    params.set('report_type', reportType)
  }
  if (species === 'cat' || species === 'dog') {
    params.set('species', species)
  }
  const query = params.toString()
  const url = `${API_URL}/api/pets${query ? `?${query}` : ''}`

  const response = await fetchApi(url)

  if (!response.ok) {
    throw await apiError(response)
  }

  const pets: Pet[] = await response.json()

  return pets
}
export async function getPet(id: string): Promise<Pet | null> {
  const response = await fetchApi(
    `${API_URL}/api/pets/${encodeURIComponent(id)}`
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw await apiError(response)
  }

  const pet: Pet = await response.json()

  return pet
}
export type NewPet = {
  name: string | null
  species: string
  street: string
  report_type: 'lost' | 'found'
  comment: string
  contact_email: string
}

export async function createPet(pet: NewPet): Promise<void> {
  const response = await fetchApi(`${API_URL}/api/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pet),
  })

  if (!response.ok) {
    throw await apiError(response)
  }
}


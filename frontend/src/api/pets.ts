import type { Pet } from '../types/pet'

const API_URL = import.meta.env.VITE_API_URL

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

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Не удалось загрузить объявления')
  }

  const pets: Pet[] = await response.json()

  return pets
}
export async function getPet(id: string): Promise<Pet | null> {
  const response = await fetch(
    `${API_URL}/api/pets/${encodeURIComponent(id)}`
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Не удалось загрузить объявление')
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
  const response = await fetch(`${API_URL}/api/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pet),
  })

  if (!response.ok) {
    throw new Error(
      'Не удалось опубликовать объявление. Проверьте данные и попробуйте снова.'
    )
  }
}


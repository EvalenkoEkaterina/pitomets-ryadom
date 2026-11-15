import type { Pet } from '../types/pet'

const API_URL = 'https://fur-project-s56k.onrender.com'

export async function getPets(): Promise<Pet[]> {
  const response = await fetch(`${API_URL}/api/pets`)

  if (!response.ok) {
    throw new Error('Не удалось загрузить объявления')
  }

  const pets: Pet[] = await response.json()

  return pets
}
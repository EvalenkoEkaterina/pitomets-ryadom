export type Pet = {
  id: number
  name: string | null
  species: string
  street: string
  photo_url: string | null
  status: 'active' | 'found'
}
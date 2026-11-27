export type Pet = {
  id: number
  name: string | null
  species: string
  street: string
  report_type: 'lost' | 'found' | null
  comment: string | null
  contact_email: string | null
  photo_url: string | null
  status: 'active' | 'found'
}
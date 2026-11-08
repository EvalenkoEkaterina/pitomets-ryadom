export type Pet = {
  id: number
  name: string
  city: string
  status: string
  description: string
}

type PetCardProps = {
  pet: Pet
}

function PetCard({ pet }: PetCardProps) {
  return (
    <article className="pet-card">
      <div className="pet-card-image">
        <span>Фото питомца</span>
      </div>

      <div className="pet-card-info">
        <h3>{pet.name}</h3>
        <p><strong>Город:</strong> {pet.city}</p>
        <p><strong>Статус:</strong> {pet.status}</p>
        <p>{pet.description}</p>
      </div>
    </article>
  )
}

export default PetCard
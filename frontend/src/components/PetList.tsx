import PetCard, { type Pet } from './PetCard'

type PetListProps = {
  pets: Pet[]
  isLoading: boolean
  error: string | null
}

function PetList({ pets, isLoading, error }: PetListProps) {
  if (isLoading) {
    return <p>Загружаем список питомцев...</p>
  }

  if (error) {
    return <p className="pets-message">{error}</p>
  }

  if (pets.length === 0) {
    return <p className="pets-message">Пока питомцев нет.</p>
  }

  return (
    <div className="pets-list">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </div>
  )
}

export default PetList
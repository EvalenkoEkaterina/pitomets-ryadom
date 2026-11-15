import { useState } from 'react'
import type { Pet } from '../types/pet'

type PetCardProps = {
  pet: Pet
}

function PetCard({ pet }: PetCardProps) {
  const [photoError, setPhotoError] = useState(false)

  const name = pet.name || 'Кличка неизвестна'

  const status =
    pet.status === 'active' ? 'Ищут' : 'Поиск завершён'

  return (
    <article className="pet-card">
      <div className="pet-card-image">
        {pet.photo_url && !photoError ? (
          <img
            src={pet.photo_url}
            alt={name}
            onError={() => setPhotoError(true)}
          />
        ) : (
          <span>Фото недоступно</span>
        )}
      </div>

      <div className="pet-card-info">
        <h3>{name}</h3>
        <p><strong>Вид:</strong> {pet.species}</p>
        <p><strong>Улица:</strong> {pet.street}</p>
        <p><strong>Статус:</strong> {status}</p>
      </div>
    </article>
  )
}

export default PetCard
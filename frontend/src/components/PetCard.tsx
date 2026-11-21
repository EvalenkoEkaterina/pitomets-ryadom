import { useState } from 'react'
import type { Pet } from '../types/pet'
import { Link, useSearchParams } from 'react-router-dom'

type PetCardProps = {
  pet: Pet
}

function PetCard({ pet }: PetCardProps) {
  const [searchParams] = useSearchParams()

  const query = searchParams.toString()

  let petUrl = `/pets/${pet.id}`

  if (query) {
    petUrl = `${petUrl}?${query}`
  }
  const [photoError, setPhotoError] = useState(false)

  const name = pet.name || 'Кличка неизвестна'

  let status = 'Неизвестен'

  if (pet.status === 'active') {
    status = 'Поиск продолжается'
  } else if (pet.status === 'found') {
    status = 'Поиск завершён'
  }

  let speciesLabel = 'Другой вид животного'

  if (pet.species === 'cat') {
    speciesLabel = 'Кошка'
  } else if (pet.species === 'dog') {
    speciesLabel = 'Собака'
  }

  let reportLabel = 'Не указан'

  if (pet.report_type === 'lost') {
    reportLabel = 'Потерян питомец'
  } else if (pet.report_type === 'found') {
    reportLabel = 'Найден питомец'
  }
  return (
    <article className="pet-card">
      <Link className="pet-card-link" to={petUrl}>
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
          <p><strong>Тип объявления:</strong> {reportLabel}</p>
          <p><strong>Вид:</strong> {speciesLabel}</p>
          <p><strong>Место:</strong> {pet.street || 'Не указано'}</p>
          <p><strong>Статус поиска:</strong> {status}</p>
        </div>
      </Link>
    </article>
  )
}

export default PetCard
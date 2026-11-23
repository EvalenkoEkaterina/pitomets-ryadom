import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getPet } from '../api/pets'
import type { Pet } from '../types/pet'

function PetContent() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const [pet, setPet] = useState<Pet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null)

  const query = searchParams.toString()
  const catalogUrl = query ? `/pets?${query}` : '/pets'

  useEffect(() => {
    let ignore = false

    if (!id) {
      return
    }

    getPet(id)
      .then((data) => {
        if (!ignore) {
          setPet(data)
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setError(error instanceof Error ? error.message : 'Не удалось загрузить объявление. Попробуйте ещё раз.')
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [id, attempt])

  function retry() {
    setError(null)
    setIsLoading(true)
    setAttempt(attempt + 1)
  }

  if (isLoading) {
    return (
      <main className="catalog-page">
        <Link className="catalog-link" to={catalogUrl}>
          ← В каталог
        </Link>
        <p role="status">Загружаем объявление...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="catalog-page">
        <Link className="catalog-link" to={catalogUrl}>
          ← В каталог
        </Link>
        <p role="alert">{error}</p>
        <button onClick={retry}>Попробовать снова</button>
      </main>
    )
  }

  if (!pet) {
    return (
      <main className="catalog-page">
        <Link className="catalog-link" to={catalogUrl}>
          ← В каталог
        </Link>
        <h1>Объявление не найдено или удалено</h1>
      </main>
    )
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

  let statusLabel = 'Неизвестен'

  if (pet.status === 'active') {
    statusLabel = 'Поиск продолжается'
  } else if (pet.status === 'found') {
    statusLabel = 'Поиск завершён'
  }

  const name = pet.name || 'Кличка неизвестна'

  return (
    <main className="catalog-page">
      <Link className="catalog-link" to={catalogUrl}>
        ← В каталог
      </Link>

      <h1>{name}</h1>

      <article className="pet-details">
        <div className="pet-details-image">
          {pet.photo_url && pet.photo_url !== failedPhoto ? (
            <img
              src={pet.photo_url}
              alt={name}
              onError={() => setFailedPhoto(pet.photo_url)}
            />
          ) : (
            <span>Фото недоступно</span>
          )}
        </div>

        <div className="pet-details-info">
          <p><strong>Тип объявления:</strong> {reportLabel}</p>
          <p><strong>Вид:</strong> {speciesLabel}</p>
          <p><strong>Место:</strong> {pet.street || 'Не указано'}</p>
          <p><strong>Статус поиска:</strong> {statusLabel}</p>

          <h2>Описание</h2>
          <p className="pet-description">
            {pet.comment || 'Описание не добавлено.'}
          </p>

          <h2>Связаться</h2>
          {pet.contact_email ? (
            <a href={`mailto:${pet.contact_email}`}>
              {pet.contact_email}
            </a>
          ) : (
            <p>Контакт не указан.</p>
          )}
        </div>
      </article>
    </main>
  )
}

export default function PetPage() {
  const { id } = useParams()
  return <PetContent key={id} />
}

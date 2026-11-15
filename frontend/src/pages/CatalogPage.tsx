import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPets } from '../api/pets'
import PetList from '../components/PetList'
import type { Pet } from '../types/pet'

function CatalogPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    getPets()
      .then((data) => {
        if (!ignore) {
          setPets(data)
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('Не удалось загрузить объявления. Попробуйте ещё раз.')
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
  }, [attempt])

  function retry() {
    setError(null)
    setIsLoading(true)
    setAttempt(attempt + 1)
  }

  return (
    <main className="catalog-page">
      <Link className="catalog-link" to="/">
        ← На главную
      </Link>
      <h1>Объявления о питомцах</h1>

      <PetList
        pets={pets}
        isLoading={isLoading}
        error={error}
      />

      {error && (
        <button onClick={retry}>
          Попробовать снова
        </button>
      )}
    </main>
  )
}

export default CatalogPage
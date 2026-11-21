import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPets } from '../api/pets'
import PetList from '../components/PetList'
import type { Pet } from '../types/pet'

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const reportType = searchParams.get('report_type')
  const speciesParam = searchParams.get('species')

  let species = ''

  if (speciesParam === 'cat' || speciesParam === 'dog') {
    species = speciesParam
  }
  let title

  if (reportType === 'found') {
   title = 'Найденные питомцы'
  } else if (reportType === 'lost') {
    title = 'Потерянные питомцы'
  } else {
    title = 'Все объявления о питомцах'
  }
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    getPets(reportType, species)
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
  }, [attempt, reportType, species])

  function retry() {
    setError(null)
    setIsLoading(true)
    setAttempt(attempt + 1)
  }
  function changeSpecies(value: string) {
    const nextParams = new URLSearchParams(searchParams)

    if (value) {
      nextParams.set('species', value)
    } else {
      nextParams.delete('species')
    }

    setError(null)
    setIsLoading(true)
    setSearchParams(nextParams)
  }
  return (
    <main className="catalog-page">
      <Link className="catalog-link" to="/">
        ← На главную
      </Link>
      <h1>{title}</h1>
      <div className="publish-links">
        <Link className="button_1" to="/publish/lost">
          Сообщить о потере
        </Link>

        <Link className="button_2" to="/publish/found">
          Сообщить о находке
        </Link>
      </div>
      <label>
        Вид животного:{' '}
        <select
          value={species}
          onChange={(event) => changeSpecies(event.target.value)}
        >
          <option value="">Все</option>
          <option value="cat">Кошки</option>
          <option value="dog">Собаки</option>
        </select>
      </label>

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
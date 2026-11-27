import { Link } from 'react-router-dom'
import PetForm from '../components/PetForm'

type PublishPageProps = {
  reportType: 'lost' | 'found'
}

function PublishPage({ reportType }: PublishPageProps) {
  let title = 'Сообщить о потерянном питомце'

  if (reportType === 'found') {
    title = 'Сообщить о найденном питомце'
  }

  return (
    <main className="catalog-page">
      <Link className="catalog-link" to="/pets">
        ← В каталог
      </Link>

      <h1>{title}</h1>

      <PetForm key={reportType} reportType={reportType} />
    </main>
  )
}

export default PublishPage
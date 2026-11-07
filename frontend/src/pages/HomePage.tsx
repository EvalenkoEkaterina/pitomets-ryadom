import catDogImage from '../assets/cat_dog.jpg'
import PetList from '../components/PetList'
import type { Pet } from '../components/PetCard'
import '../styles/style.css'

const pets: Pet[] = [
  {
    id: 1,
    name: 'Рыжик',
    city: 'Москва',
    status: 'Потерялся',
    description: 'Рыжий кот, пропал возле парка.',
  },
  {
    id: 2,
    name: 'Бим',
    city: 'Казань',
    status: 'Найден',
    description: 'Найден добрый пёс, ищем хозяев.',
  },
  {
    id: 3,
    name: 'Муся',
    city: 'Самара',
    status: 'Потерялась',
    description: 'Серая кошка с белыми лапками.',
  },
]

function HomePage() {
  return (
    <main className="home-page">
      <h1>Питомец рядом</h1>

      <img
        className="home-image"
        src={catDogImage}
        alt="Фотография кошки и собаки"
      />

      <p className="home-description">
        Помогаем найти дорогу домой потерявшимся питомцам.
      </p>

      <div className="buttons">
        <button className="button_1">Потерял питомца</button>
        <button className="button_2">Нашел питомца</button>
      </div>

      <section className="pets-section">
        <h2>Питомцы рядом</h2>

        <PetList
          pets={pets}
          isLoading={false}
          error={null}
        />
      </section>
    </main>
  )
}

export default HomePage
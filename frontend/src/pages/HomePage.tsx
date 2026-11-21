import { Link } from 'react-router-dom'
import catDogImage from '../assets/cat_dog.jpg'

function HomePage() {
  return (
    <main className="home-page">
      <nav className="auth-links" aria-label="Аккаунт">
        <Link className="catalog-link" to="/login">
          Войти
        </Link>

        <Link className="catalog-link" to="/register">
          Регистрация
        </Link>
      </nav>
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
        <Link className="button_1" to="/pets?report_type=found">
          Потерял питомца
        </Link>

        <Link className="button_2" to="/pets?report_type=lost">
          Нашёл питомца
        </Link>
      </div>

      <p>
        <Link className="catalog-link" to="/pets">
          Все объявления →
        </Link>
      </p>
    </main>
  )
}

export default HomePage
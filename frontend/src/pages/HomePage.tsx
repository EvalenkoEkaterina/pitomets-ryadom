import { Link } from 'react-router-dom'
import catDogImage from '../assets/cat_dog.jpg'

function Paw() {
  return <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><ellipse cx="11" cy="15" rx="5" ry="7" transform="rotate(-25 11 15)"/><ellipse cx="22" cy="9" rx="5" ry="7"/><ellipse cx="34" cy="12" rx="5" ry="7" transform="rotate(20 34 12)"/><ellipse cx="41" cy="23" rx="5" ry="6" transform="rotate(30 41 23)"/><path d="M12 34c0-6 6-15 13-15s13 9 13 15c0 8-9 4-13 4s-13 4-13-4Z"/></svg>
}

const steps = [
  { icon: 'search', title: 'Посмотрите объявления', text: 'Возможно, питомца уже нашли. Проверьте объявления поблизости.' },
  { icon: 'pin', title: 'Расскажите о пропаже или находке', text: 'Добавьте приметы животного, описание и место.' },
  { icon: 'bell', title: 'Подключите помощь соседей', text: 'Получайте уведомления и помогайте искать животных рядом.' },
]

function StepIcon({ name }: { name: string }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    {name === 'search' && <><circle cx="20" cy="20" r="14"/><path d="m30 30 12 12"/></>}
    {name === 'pin' && <><path d="M39 19c0 12-15 25-15 25S9 31 9 19a15 15 0 0 1 30 0Z"/><circle cx="24" cy="19" r="5"/></>}
    {name === 'bell' && <><path d="M8 35h32l-5-8V19a11 11 0 0 0-22 0v8Zm11 4a5 5 0 0 0 10 0M24 4v4"/></>}
  </svg>
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView()
}

function HomePage() {
  return <div className="landing">
    <header className="site-header"><div className="landing-container header-inner">
      <Link className="brand" to="/" aria-label="Питомец рядом — главная"><Paw/><span>Питомец рядом</span></Link>
      <nav aria-label="Основная навигация">
        <Link to="/pets">Объявления</Link>
        <a href="#how-it-works" onClick={(event) => { event.preventDefault(); scrollToSection('how-it-works') }}>Как это работает</a>
        <a href="#about" onClick={(event) => { event.preventDefault(); scrollToSection('about') }}>О проекте</a>
        <Link className="button_2 header-login" to="/login">Войти</Link>
      </nav>
    </div></header>
    <main>
      <section className="hero"><div className="landing-container hero-inner">
        <div className="hero-copy"><h1>Поможем питомцам вернуться домой</h1>
          <p>Ищите потерянных животных, сообщайте о находках и помогайте тем, кто рядом.</p>
          <div className="buttons"><Link className="button_1" to="/pets?report_type=found">Потерял питомца</Link><Link className="button_2" to="/pets?report_type=lost">Нашёл питомца</Link></div>
          <Link className="all-reports" to="/pets">Все объявления</Link>
        </div>
        <img className="hero-photo" src={catDogImage} alt="Котёнок и щенок рядом" />
      </div></section>
      <section className="how-section" id="how-it-works"><div className="landing-container">
        <h2>Как это работает</h2><div className="steps-grid">{steps.map((step) => <article className="step-card" key={step.icon}>
          <div className="step-heading"><StepIcon name={step.icon}/><h3>{step.title}</h3></div><p>{step.text}</p>
        </article>)}</div>
      </div></section>
      <section className="notification-section"><div className="landing-container notification-inner">
        <div><h2>Вы можете помочь, даже если ваш питомец дома</h2><p>Выберите место и получайте уведомления о животных поблизости.</p>
          <Link className="button-light" to="/notifications">Настроить уведомления</Link><p className="feature-note">Выбор места доступен. Подключение уведомлений ожидается.</p>
        </div>
        <div className="decorative-map" aria-hidden="true"><div className="map-roads"/><div className="map-radius"/><span className="decorative-pin"><Paw/></span></div>
      </div></section>
      <section className="faq-section"><div className="landing-container"><h2>Частые вопросы</h2>
        <details><summary>Нужна ли регистрация?</summary><p>Просматривать объявления можно без регистрации. Для публикации планируется вход в аккаунт. Пользовательская авторизация и подписка на уведомления пока не подключены.</p></details>
        <details><summary>Как выбирается место для уведомлений?</summary><p>Можно определить местоположение через браузер или выбрать точку на карте вручную. Сохранение подписки на сервере пока не подключено.</p></details>
        <details><summary>Можно ли отключить уведомления?</summary><p>Возможность отказа от подписки будет доступна после подключения уведомлений. Сейчас сайт не оформляет подписку.</p></details>
        <details><summary>Что делать, когда питомец нашёлся?</summary><p>Нужно завершить поиск в объявлении. Самостоятельное изменение статуса будет доступно после подключения личного аккаунта.</p></details>
      </div></section>
      <section className="about-section" id="about"><div className="landing-container"><h2>О проекте</h2><p>Помогаем искать потерянных животных и сообщать о находках.</p><blockquote>Иногда дорога домой начинается с внимательного соседа.</blockquote></div></section>
    </main>
    <footer className="site-footer"><div className="landing-container"><div className="footer-inner">
      <div><Link className="brand" to="/"><Paw/><span>Питомец рядом</span></Link><p>Помогаем питомцам вернуться домой</p></div>
      <Link to="/pets">Объявления</Link><a href="#about" onClick={(event) => { event.preventDefault(); scrollToSection('about') }}>О проекте</a>
      <span>Сообщить об ошибке<small>Контакт команды скоро появится</small></span><span>Связаться с командой<small>Контакт уточняется</small></span>
    </div><p className="copyright">Учебный проект · 2026</p></div></footer>
  </div>
}

export default HomePage

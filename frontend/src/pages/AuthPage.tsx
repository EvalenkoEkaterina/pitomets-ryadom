import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const isRegister = mode === 'register'
  const title = isRegister ? 'Регистрация' : 'Вход'

  function submit() {
    if (!login.trim() || !password.trim()) { setError('Укажите логин и пароль. Одних пробелов недостаточно.'); return }
    if (login.length > 100 || password.length > 128) { setError('Слишком длинный логин или пароль.'); return }
    if (isRegister && repeat !== password) { setError('Пароли не совпадают.'); return }
    setError('Пользовательская авторизация пока не подключена. Данные не отправлены, вход не выполнен.')
  }

  return <main className="catalog-page"><Link className="catalog-link" to="/">← На главную</Link><h1>{title}</h1>
    <form className="pet-form" noValidate onSubmit={(event) => { event.preventDefault(); submit() }}>
      <p className="integration-note">Форма подготовлена. Ожидается подключение пользовательской авторизации.</p>
      <label>Логин<input required autoComplete="username" maxLength={100} value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Ваш логин"/></label>
      <label>Пароль<input required type="password" maxLength={128} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)}/></label>
      {isRegister && <label>Повторите пароль<input required type="password" maxLength={128} autoComplete="new-password" value={repeat} onChange={(event) => setRepeat(event.target.value)}/></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit">{isRegister ? 'Зарегистрироваться' : 'Войти'}</button>
      <Link className="catalog-link" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}</Link>
    </form>
  </main>
}
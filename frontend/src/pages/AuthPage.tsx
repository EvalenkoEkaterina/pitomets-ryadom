import { useState } from 'react'
import { Link } from 'react-router-dom'

type AuthPageProps = {
  mode: 'login' | 'register'
}

function AuthPage({ mode }: AuthPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isRegister = mode === 'register'

  let title = 'Вход'

  if (isRegister) {
    title = 'Регистрация'
  }

  function submit() {
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError('Укажите почту и пароль.')
      return
    }

    if (isRegister && password !== passwordRepeat) {
      setError('Пароли не совпадают.')
      return
    }

    setError(
      'Подключение к серверу пока не готово. Вход и регистрация недоступны.'
    )
  }

  return (
    <main className="catalog-page">
      <Link className="catalog-link" to="/">
        ← На главную
      </Link>

      <h1>{title}</h1>

      <form
        className="pet-form"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        onInvalid={(event) => {
          const input = event.target

          if (!(input instanceof HTMLInputElement)) {
            return
          }

          if (input.validity.valueMissing) {
            input.setCustomValidity('Заполните это поле.')
          } else if (input.validity.typeMismatch) {
            input.setCustomValidity('Введите корректный адрес почты.')
          }
        }}
        onInput={(event) => {
          const input = event.target

          if (input instanceof HTMLInputElement) {
            input.setCustomValidity('')
          }
        }}
      >
        <p>Форма подготовлена. Подключение авторизации ожидается.</p>

        <label>
          Почта
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </label>

        <label>
          Пароль
          <input
            required
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {isRegister && (
          <label>
            Повторите пароль
            <input
              required
              type="password"
              autoComplete="new-password"
              value={passwordRepeat}
              onChange={(event) => setPasswordRepeat(event.target.value)}
            />
          </label>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit">{title}</button>

        {isRegister ? (
          <Link className="catalog-link" to="/login">
            Уже есть аккаунт? Войти
          </Link>
        ) : (
          <Link className="catalog-link" to="/register">
            Нет аккаунта? Зарегистрироваться
          </Link>
        )}
      </form>
    </main>
  )
}

export default AuthPage
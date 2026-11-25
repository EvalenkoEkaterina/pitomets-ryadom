import { useEffect, useState } from 'react'
import LocationPicker from './LocationPicker'
import type { MapPoint } from './LocationPicker'

type Props = { reportType: 'lost' | 'found' }

const limits = { name: 100, street: 100, comment: 2000, contact: 100 }

export default function PetForm({ reportType }: Props) {
  const [species, setSpecies] = useState('cat')
  const [name, setName] = useState('')
  const [street, setStreet] = useState('')
  const [comment, setComment] = useState('')
  const [contactType, setContactType] = useState('phone')
  const [contact, setContact] = useState('')
  const [point, setPoint] = useState<MapPoint | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }, [photoPreview])

  function submit() {
    setError('')
    if (!street.trim() || !comment.trim() || !contact.trim()) {
      setError('Заполните место, описание и контакт. Значения из одних пробелов не подходят.')
      return
    }
    if (name.length > limits.name || street.length > limits.street || comment.length > limits.comment || contact.length > limits.contact) {
      setError('Превышена допустимая длина одного из полей.')
      return
    }
    const phone = contact.trim().replace(/[\s()-]/g, '')
    const telegram = contact.trim().replace(/^https:\/\/t\.me\//i, '').replace(/^@/, '')
    if (contactType === 'phone' && !/^\+?[1-9]\d{9,14}$/.test(phone)) {
      setError('Введите телефон: от 10 до 15 цифр, например +7 999 123-45-67.')
      return
    }
    if (contactType === 'telegram' && !/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(telegram)) {
      setError('Укажите Telegram: @username или https://t.me/username. От 5 до 32 латинских букв, цифр или подчёркиваний, начало — буква.')
      return
    }
    if (!point) {
      setError('Выберите точку пропажи или находки на карте.')
      return
    }
    setError('Объявление не отправлено: ожидается API для телефона/Telegram и координат. Введённые данные сохранены в форме.')
  }

  return <form className="pet-form" noValidate onSubmit={(event) => { event.preventDefault(); submit() }}>
    <p className="integration-note">Форма обновлена. Публикация временно недоступна: согласуем с бэкендом новые контакты, координаты и вход в аккаунт.</p>
    <fieldset>
      <label>Вид животного<select value={species} onChange={(event) => setSpecies(event.target.value)}><option value="cat">Кошка</option><option value="dog">Собака</option></select></label>
      <label>Кличка — необязательно<input value={name} maxLength={limits.name} onChange={(event) => setName(event.target.value)} placeholder="Если известна"/><small>До {limits.name} символов</small></label>
      <label>Описание — обязательно<textarea required value={comment} maxLength={limits.comment} rows={5} onChange={(event) => setComment(event.target.value)} placeholder="Приметы животного и обстоятельства"/><small>{comment.length} / {limits.comment}</small></label>
      <label>Место — обязательно<input required value={street} maxLength={limits.street} onChange={(event) => setStreet(event.target.value)} placeholder="Улица, дом или ориентир"/><small>До {limits.street} символов</small></label>
      <section className="form-location"><h2>{reportType === 'lost' ? 'Где пропал питомец?' : 'Где найден питомец?'}</h2><p>Выберите именно место события. Ваше текущее местоположение может отличаться.</p><LocationPicker value={point} onChange={setPoint}/></section>
      <label>Способ связи<select value={contactType} onChange={(event) => { setContactType(event.target.value); setContact(''); setError('') }}><option value="phone">Телефон</option><option value="telegram">Telegram</option></select></label>
      <label>{contactType === 'phone' ? 'Телефон — обязательно' : 'Telegram — обязательно'}<input required type={contactType === 'phone' ? 'tel' : 'text'} maxLength={limits.contact} value={contact} onChange={(event) => setContact(event.target.value)} placeholder={contactType === 'phone' ? '+7 999 123-45-67' : '@username'}/></label>
      <label className="photo-picker"><span>Фотография — необязательно</span><span className="photo-picker-button">Выбрать фотографию</span><input className="photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
        const file = event.target.files?.[0]
        setPhotoError('')
        if (!file) return
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
          setPhotoError('Выберите JPEG, PNG или WebP до 5 МБ. Предыдущее фото, если было, сохранено.')
          event.target.value = ''
          return
        }
        setPhotoPreview(URL.createObjectURL(file))
        setPhotoName(file.name)
      }}/><span className="photo-picker-status">{photoName || 'Фотография не выбрана'}</span></label>
      {photoError && <p className="form-error" role="alert">{photoError}</p>}
      {photoPreview && <><img className="photo-preview" src={photoPreview} alt="Предпросмотр выбранной фотографии"/><button type="button" className="button_2" onClick={() => { setPhotoPreview(''); setPhotoName('') }}>Убрать фотографию</button></>}
      <p>Фотография доступна только для предпросмотра и пока не отправляется на сервер.</p>
      <button type="submit">Проверить объявление</button>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
  </form>
}

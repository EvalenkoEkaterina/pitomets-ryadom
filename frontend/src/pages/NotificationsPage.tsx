import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LocationPicker from '../components/LocationPicker'
import type { MapPoint } from '../components/LocationPicker'
import { disableNotifications, enableNotifications, getNotificationState,
  pushSupported, saveNotificationPoint } from '../api/notifications'
import './notifications.css'

export default function NotificationsPage() {
  const [point, setPoint] = useState<MapPoint | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('Проверяем подписку…')

  useEffect(() => {
    let active = true
    getNotificationState().then(state => {
      if (!active) return
      setEnabled(state.is_active)
      if (state.latitude !== null && state.longitude !== null) {
        setPoint({ latitude: state.latitude, longitude: state.longitude })
      }
      if (state.is_active && state.latitude === null) {
        setMessage('Подписка есть. Выберите и сохраните точку, чтобы получать объявления рядом.')
      } else {
        setMessage(state.is_active ? 'Уведомления включены.' : 'Уведомления выключены. Выберите точку и нажмите кнопку включения.')
      }
    }).catch(() => {
      if (active) setMessage('Не удалось проверить подписку. Проверьте соединение и попробуйте снова.')
    }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])

  async function save() {
    if (!point) return
    setBusy(true)
    try {
      if (enabled) await saveNotificationPoint(point)
      else await enableNotifications(point)
      setEnabled(true)
      setMessage('Уведомления включены. Выбранная точка сохранена.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось включить уведомления.')
    } finally { setBusy(false) }
  }

  async function disable() {
    setBusy(true)
    try {
      await disableNotifications()
      setEnabled(false)
      setMessage('Уведомления выключены.')
    } catch { setMessage('Не удалось отключить подписку. Повторите попытку.') }
    finally { setBusy(false) }
  }
  return <main className="catalog-page notifications-page">
    <Link to="/" className="catalog-link">← На главную</Link>
    <h1>Место для уведомлений</h1>
    <section className="pet-form"><p>Выберите место, рядом с которым хотите помогать искать питомцев. Оно не связано с точкой отдельного объявления.</p>
      <LocationPicker value={point} disabled={busy} onChange={value => {
        setPoint(value)
        setMessage('Точка изменена на странице. Нажмите кнопку, чтобы сохранить её.')
      }}/>
      <div className="notification-actions">
      <button className="button_1" disabled={busy || !point || !pushSupported()} onClick={save}>
        {busy ? 'Подождите…' : enabled ? 'Сохранить точку' : 'Включить уведомления'}
      </button>
      {enabled && <button className="button_2" disabled={busy} onClick={disable}>Выключить уведомления</button>}
      </div>
      {!pushSupported() && <p>Этот браузер не поддерживает Web Push или сайт открыт без HTTPS.</p>}
      <p className="integration-note" role="status">{message}</p>
    </section>
  </main>
}

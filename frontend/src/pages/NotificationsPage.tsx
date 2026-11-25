import { useState } from 'react'
import { Link } from 'react-router-dom'
import LocationPicker from '../components/LocationPicker'
import type { MapPoint } from '../components/LocationPicker'

export default function NotificationsPage() {
  const [point, setPoint] = useState<MapPoint | null>(null)
  return <main className="catalog-page">
    <Link to="/" className="catalog-link">← На главную</Link>
    <h1>Место для уведомлений</h1>
    <section className="pet-form"><p>Выберите место, рядом с которым хотите помогать искать питомцев. Оно не связано с точкой отдельного объявления.</p>
      <LocationPicker value={point} onChange={setPoint}/>
      <p className="integration-note" role="status">Настройка подписки пока не подключена. Точка выбрана только на этой странице и не сохранена на сервере. Уведомления не включены.</p>
    </section>
  </main>
}

import type { MapPoint } from '../components/LocationPicker'
import { fetchApi } from './fetchApi'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export type NotificationState = {
  is_active: boolean
  latitude: number | null
  longitude: number | null
}

async function request(path: string, method: string, body?: object) {
  const response = await fetchApi(`${API_URL}/api/push/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new Error(`Не удалось сохранить настройки (HTTP ${response.status}). Попробуйте снова.`)
  return response.json()
}

export function pushSupported() {
  return window.isSecureContext && 'serviceWorker' in navigator &&
    'PushManager' in window && 'Notification' in window
}

async function getWorker() {
  // Один общий worker для всего React-приложения. Второй PWA-worker не регистрируем.
  await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  return navigator.serviceWorker.ready
}

function applicationKey(key: string) {
  const padded = key + '='.repeat((4 - key.length % 4) % 4)
  return Uint8Array.from(atob(padded.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
}

export async function getNotificationState(): Promise<NotificationState> {
  const empty = { is_active: false, latitude: null, longitude: null }
  if (!pushSupported()) return empty
  const subscription = await (await getWorker()).pushManager.getSubscription()
  if (!subscription) return empty
  const state = await request('subscriptions/state', 'POST', { endpoint: subscription.endpoint })
  return { ...state, is_active: state.is_active && Notification.permission === 'granted' }
}

export async function enableNotifications(point: MapPoint) {
  if (!pushSupported()) throw new Error('Web Push недоступен. Нужен поддерживаемый браузер и HTTPS.')
  // Этот вызов должен быть первым после нажатия кнопки (в том числе для Safari).
  const permission = await Notification.requestPermission()
  if (permission === 'denied') throw new Error('Уведомления запрещены. Разрешите их в настройках сайта браузера.')
  if (permission !== 'granted') throw new Error('Разрешение не получено. Можно попробовать ещё раз.')
  const worker = await getWorker()
  const { publicKey } = await request('vapid-public-key', 'GET')
  let subscription = await worker.pushManager.getSubscription()
  if (!subscription) {
    subscription = await worker.pushManager.subscribe({
      userVisibleOnly: true, applicationServerKey: applicationKey(publicKey),
    })
  }
  // При ошибке сервера не показываем успешное включение.
  await request('subscriptions', 'POST', { ...subscription.toJSON(), ...point })
}

export async function saveNotificationPoint(point: MapPoint) {
  const subscription = await (await getWorker()).pushManager.getSubscription()
  if (!subscription) throw new Error('Сначала включите уведомления.')
  await request('subscriptions/location', 'PATCH', { endpoint: subscription.endpoint, ...point })
}

export async function disableNotifications() {
  const subscription = await (await getWorker()).pushManager.getSubscription()
  if (!subscription) return
  // Сначала отключаем доставку на сервере. При ошибке можно безопасно повторить.
  await request('subscriptions', 'DELETE', { endpoint: subscription.endpoint })
  await subscription.unsubscribe()
}

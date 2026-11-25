// Общий Service Worker React-приложения. Обработчики PWA добавляются сюда же.
// Кэширование API пока не включаем, чтобы не показывать устаревшие объявления.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  let data = { title: 'Питомец рядом', body: 'Новое объявление рядом', url: '/#/pets' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    if (event.data) data.body = event.data.text()
  }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, data: { url: data.url },
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/#/pets', self.location.origin)
  if (target.origin !== self.location.origin) return
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (new URL(client.url).origin === target.origin) {
        await client.navigate(target.href)
        return client.focus()
      }
    }
    return self.clients.openWindow(target.href)
  })())
})

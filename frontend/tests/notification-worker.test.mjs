import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

test('worker показывает объявление и открывает его React-адрес по клику', async () => {
  const handlers = {}
  const calls = []
  let notification
  const worker = {
    location: { origin: 'https://pets.example' },
    addEventListener: (name, handler) => { handlers[name] = handler },
    registration: { showNotification: async (title, options) => { notification = { title, ...options } } },
    clients: {
      matchAll: async () => [{
        url: 'https://pets.example/#/notifications',
        navigate: async url => calls.push(url),
        focus: async () => calls.push('focus'),
      }],
      openWindow: async () => { throw Error('Должна использоваться существующая вкладка') },
    },
  }
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self: worker, URL })
  let finished
  handlers.push({
    data: { json: () => ({ title: 'Пропал кот', body: 'Рядом', url: 'https://pets.example/#/pets/123' }) },
    waitUntil: promise => { finished = promise },
  })
  await finished
  assert.equal(notification.title, 'Пропал кот')
  handlers.notificationclick({
    notification: { ...notification, close: () => {} },
    waitUntil: promise => { finished = promise },
  })
  await finished
  assert.deepEqual(calls, ['https://pets.example/#/pets/123', 'focus'])
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Проверяем браузерные функции без настоящей подписки и без отправки в интернет.
const source = readFileSync(new URL('../src/api/notifications.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source.replaceAll('import.meta.env', 'globalThis.testEnv'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText
globalThis.testEnv = { VITE_API_URL: 'http://test', BASE_URL: '/' }
const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

function browser(permission = 'granted') {
  const calls = []
  const subscription = {
    endpoint: 'https://fcm.googleapis.com/test',
    toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/test', keys: { p256dh: 'test', auth: 'test' } }),
    unsubscribe: async () => { calls.push('browser-unsubscribe'); return true },
  }
  const worker = { pushManager: { getSubscription: async () => subscription } }
  globalThis.window = { isSecureContext: true, PushManager: {}, Notification: {} }
  globalThis.Notification = { permission, requestPermission: async () => { calls.push('permission'); return permission } }
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    serviceWorker: { register: async () => { calls.push('register'); return worker }, ready: Promise.resolve(worker) },
  } })
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => ({ publicKey: 'dGVzdA' }) }
  }
  return calls
}

test('отказ в разрешении не создаёт подписку и не вызывает API', async () => {
  const calls = browser('denied')
  await assert.rejects(api.enableNotifications({ latitude: 55, longitude: 37 }), /запрещены/)
  assert.deepEqual(calls, ['permission'])
})

test('разрешение идёт первым, подписка передаётся вместе с точкой', async () => {
  const calls = browser()
  await api.enableNotifications({ latitude: 55, longitude: 37 })
  assert.equal(calls[0], 'permission')
  const saved = calls.find(call => call.url === 'http://test/api/push/subscriptions')
  assert.equal(JSON.parse(saved.options.body).latitude, 55)
  assert.equal(JSON.parse(saved.options.body).longitude, 37)
})

test('ошибка сохранения не возвращает успех', async () => {
  browser()
  globalThis.fetch = async url => url.endsWith('vapid-public-key')
    ? { ok: true, json: async () => ({ publicKey: 'dGVzdA' }) }
    : { ok: false, status: 503 }
  await assert.rejects(api.enableNotifications({ latitude: 55, longitude: 37 }), /503/)
})

test('при ошибке отписки на сервере браузерная подписка остаётся для повтора', async () => {
  const calls = browser()
  globalThis.fetch = async () => ({ ok: false, status: 503 })
  await assert.rejects(api.disableNotifications(), /503/)
  assert.ok(!calls.includes('browser-unsubscribe'))
})

test('успешная отписка отключает подписку в браузере', async () => {
  const calls = browser()
  await api.disableNotifications()
  assert.ok(calls.includes('browser-unsubscribe'))
})

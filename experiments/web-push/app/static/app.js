const subscribeBtn = document.getElementById("subscribeButton");
const sendBtn = document.getElementById("sendButton");
const unsubscribeBtn = document.getElementById("unsubscribeButton");
const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");
const logList = document.getElementById("log");
const banner = document.getElementById("banner");

const BADGE_LABELS = {
  idle: "Не подписан",
  ok: "Подписан",
  warn: "Нужно действие",
  error: "Ошибка",
  busy: "Подождите…",
};

function log(message) {
  const item = document.createElement("li");
  item.textContent = `${new Date().toLocaleTimeString("ru-RU")} — ${message}`;
  logList.prepend(item);
}

function setStatus(kind, text) {
  statusBadge.className = `badge badge--${kind}`;
  statusBadge.textContent = BADGE_LABELS[kind];
  statusText.textContent = text;
}

function setButtons({ subscribe, send, unsubscribe }) {
  subscribeBtn.disabled = !subscribe;
  sendBtn.disabled = !send;
  unsubscribeBtn.disabled = !unsubscribe;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Ошибка сервера (${response.status})`);
  }
  return data;
}

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function getRegistration() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

// Определяем, в каком состоянии находится страница, и обновляем интерфейс
async function refreshState() {
  if (!isSupported()) {
    setStatus("error", "Этот браузер не поддерживает Web Push. Попробуйте Chrome или обновите Safari.");
    setButtons({ subscribe: false, send: false, unsubscribe: false });
    return;
  }

  if (Notification.permission === "denied") {
    setStatus(
      "error",
      "Уведомления запрещены. Разрешите их для этого сайта в настройках браузера и обновите страницу."
    );
    setButtons({ subscribe: false, send: false, unsubscribe: false });
    return;
  }

  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    // пересохраняем на сервере (на случай, если файл подписок был удалён)
    await postJson("/api/subscribe", subscription.toJSON());
    setStatus("ok", "Вы подписаны. Можно отправлять тестовое уведомление.");
    setButtons({ subscribe: false, send: true, unsubscribe: true });
    return;
  }

  if (Notification.permission === "default") {
    setStatus("warn", "Разрешение на уведомления ещё не выдано. Нажмите «Подписаться».");
  } else {
    setStatus("idle", "Разрешение есть, но подписки нет. Нажмите «Подписаться».");
  }
  setButtons({ subscribe: true, send: false, unsubscribe: false });
}

subscribeBtn.addEventListener("click", async () => {
  try {
    setStatus("busy", "Запрашиваем разрешение…");
    setButtons({ subscribe: false, send: false, unsubscribe: false });

    // запрос разрешения должен идти сразу по клику (требование Safari)
    const permission = await Notification.requestPermission();
    log(`Разрешение: ${permission}`);

    if (permission === "denied") {
      setStatus("error", "Вы запретили уведомления. Разрешите их в настройках браузера для этого сайта.");
      return;
    }
    if (permission !== "granted") {
      setStatus("warn", "Окно с разрешением закрыто без выбора. Нажмите «Подписаться» ещё раз.");
      setButtons({ subscribe: true, send: false, unsubscribe: false });
      return;
    }

    const registration = await getRegistration();
    log("Service Worker активен");

    const keyResponse = await fetch("/api/vapid-public-key");
    if (!keyResponse.ok) throw new Error("Не удалось получить публичный VAPID-ключ");
    const { publicKey } = await keyResponse.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    log("Получена PushSubscription");

    await postJson("/api/subscribe", subscription.toJSON());
    log("Подписка сохранена на сервере");

    await refreshState();
  } catch (error) {
    console.error(error);
    log(`Ошибка: ${error.message}`);
    setStatus("error", `Ошибка подписки: ${error.message}`);
    setButtons({ subscribe: true, send: false, unsubscribe: false });
  }
});

sendBtn.addEventListener("click", async () => {
  try {
    sendBtn.disabled = true;
    setStatus("busy", "Сервер отправляет push…");

    const data = await postJson("/api/send-test");
    log(`Сервер отправил: ${data.sent}, удалено устаревших: ${data.removed}`);
    setStatus("ok", "Push отправлен с сервера. Сейчас должно появиться уведомление.");
  } catch (error) {
    console.error(error);
    log(`Ошибка отправки: ${error.message}`);
    setStatus("error", `Ошибка отправки: ${error.message}`);
  } finally {
    sendBtn.disabled = false;
  }
});

unsubscribeBtn.addEventListener("click", async () => {
  try {
    const registration = await getRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await postJson("/api/unsubscribe", { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
      log("Подписка удалена");
    }
    await refreshState();
  } catch (error) {
    console.error(error);
    setStatus("error", `Ошибка отписки: ${error.message}`);
  }
});

// Клик по уведомлению ведёт на /?from=notification
if (new URLSearchParams(location.search).get("from") === "notification") {
  banner.hidden = false;
  log("Страница открыта из уведомления");
}

refreshState().catch((error) => {
  console.error(error);
  setStatus("error", `Ошибка инициализации: ${error.message}`);
});
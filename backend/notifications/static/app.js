const subscribeButton = document.querySelector("#subscribeButton");
const sendButton = document.querySelector("#sendButton");
const unsubscribeButton = document.querySelector("#unsubscribeButton");
const statusBadge = document.querySelector("#statusBadge");
const statusText = document.querySelector("#statusText");
const logList = document.querySelector("#log");

function log(message) {
  const item = document.createElement("li");
  item.textContent = `${new Date().toLocaleTimeString("ru-RU")} — ${message}`;
  logList.prepend(item);
}

function setState(label, text, buttons = {}) {
  statusBadge.textContent = label;
  statusText.textContent = text;
  subscribeButton.disabled = !buttons.subscribe;
  sendButton.disabled = !buttons.send;
  unsubscribeButton.disabled = !buttons.unsubscribe;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail));
  }
  return data;
}

function toApplicationServerKey(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function getRegistration() {
  await navigator.serviceWorker.register("/web-push/sw.js");
  return navigator.serviceWorker.ready;
}

async function save(subscription) {
  await requestJson("/api/push/subscriptions", {
    method: "POST",
    body: JSON.stringify(subscription.toJSON()),
  });
}

async function refresh() {
  if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) {
    setState("Недоступно", "Этот браузер не поддерживает Web Push.");
    return;
  }
  if (Notification.permission === "denied") {
    setState("Запрещено", "Разрешите уведомления в настройках браузера.");
    return;
  }

  const subscription = await (await getRegistration()).pushManager.getSubscription();
  if (subscription) {
    setState("Подписан", "Подписка браузера активна. Можно проверить отправку с сервера.", {
      send: true, unsubscribe: true,
    });
  } else {
    setState("Не подписан", "Нажмите «Подписаться».", { subscribe: true });
  }
}

subscribeButton.addEventListener("click", async () => {
  try {
    setState("Ожидание", "Запрашиваем разрешение…");
    const permission = await Notification.requestPermission();
    log(`Разрешение: ${permission}`);
    if (permission !== "granted") {
      await refresh();
      return;
    }
    const { publicKey } = await requestJson("/api/push/vapid-public-key");
    const subscription = await (await getRegistration()).pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toApplicationServerKey(publicKey),
    });
    await save(subscription);
    log("Подписка сохранена на сервере");
    await refresh();
  } catch (error) {
    setState("Ошибка", error.message, { subscribe: true });
    log(error.message);
  }
});

sendButton.addEventListener("click", async () => {
  try {
    setState("Отправка", "Сервер отправляет push…");
    const result = await requestJson("/api/push/send-test", {
      method: "POST",
      headers: { "X-Push-Test-Token": document.querySelector("#testToken").value },
    });
    log(`Отправлено: ${result.sent}; устарело: ${result.removed}`);
    await refresh();
  } catch (error) {
    setState("Ошибка", error.message, { send: true, unsubscribe: true });
    log(error.message);
  }
});

unsubscribeButton.addEventListener("click", async () => {
  try {
    const subscription = await (await getRegistration()).pushManager.getSubscription();
    if (subscription) {
      await requestJson("/api/push/subscriptions", {
        method: "DELETE",
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
      log("Доставка отключена");
    }
    await refresh();
  } catch (error) {
    setState("Ошибка", error.message, { unsubscribe: true });
  }
});

if (new URLSearchParams(location.search).get("from") === "notification") {
  document.querySelector("#openedFromPush").hidden = false;
}

refresh().catch((error) => setState("Ошибка", error.message));

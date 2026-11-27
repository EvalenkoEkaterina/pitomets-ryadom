self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {
    title: "Питомец рядом",
    body: "У вас новое уведомление!",
    url: "/?from=notification",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: "pitomets-test",
      data: { url: data.url },
    })
  );
});

// Клик по уведомлению: открываем (или фокусируем) страницу
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          if (new URL(client.url).origin === self.location.origin) {
            await client.focus();
            try {
              return await client.navigate(targetUrl);
            } catch (error) {
              return client;
            }
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
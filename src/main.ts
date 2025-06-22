import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

async function enableMocking() {
  // Viteの環境変数を利用して、モックを有効にします
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

const app = createApp(App);

app.use(createPinia());
app.use(router);

enableMocking().then(() => {
  app.mount('#app');
});

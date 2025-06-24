import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

// CSS imports - 読み込み順序を最適化
import 'katex/dist/katex.min.css';
import './assets/style.css';
import './assets/markdown.css';
import './assets/codimd-extensions.css';
import './assets/advanced-rendering.css';

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

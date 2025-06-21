import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

// MSWを有効化する関数
async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return;
  }
}

const app = createApp(App);

app.use(createPinia());
app.use(router);

// アプリをマウントする前にMSWを有効化します。
enableMocking().then(() => {
  app.mount('#app');
});

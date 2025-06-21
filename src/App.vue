<script setup lang="ts">
import 'ress';
import { RouterView } from 'vue-router';
import Header from './components/common/Header.vue';
</script>

<template>
  <div class="app">
    <Header />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow: auto;
}
</style>

<!-- 次のクラスは、#app に適用させるため scoped にしない -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap');

html,
body {
  height: 100%;
  font-family: 'Noto Sans JP', sans-serif;
}

#app {
  height: 100dvh;
  font-family: 'Noto Sans JP', sans-serif;
}

* {
  font-family: 'Noto Sans JP', sans-serif;
}
</style>

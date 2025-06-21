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
html,
body {
  height: 100%;
}

#app {
  height: 100dvh;
}
</style>

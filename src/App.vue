<script setup lang="ts">
import 'ress';
import { RouterView } from 'vue-router';
import Header from './components/common/Header.vue';
</script>

<template>
  <Header />
  <main class="container">
    <RouterView />
  </main>
</template>

<style scoped></style>

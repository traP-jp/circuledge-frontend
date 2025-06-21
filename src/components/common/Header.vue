<script setup lang="ts">
defineOptions({
  name: 'AppHeader',
});
</script>

<template>
  <header class="header">
    <div class="logo">
      <router-link to="/">NoteApp</router-link>
    </div>
    <nav>
      <router-link to="/settings">Settings</router-link>
    </nav>
  </header>
</template>

<style scoped>
</style>

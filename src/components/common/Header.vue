<script setup lang="ts">
defineOptions({
  name: 'AppHeader',
});
</script>

<template>
  <header class="header">
    <div class="logo">
      <router-link to="/" class="logo-link">Circuledge</router-link>
    </div>
    <router-link to="/settings" class="user-section">
      <div class="user-avatar"></div>
      <span class="user-name">user name</span>
      <img src="/src/assets/settings_icon.svg" alt="Settings" class="settings-icon" />
    </router-link>
  </header>
</template>

<style scoped>
.header {
  background: #abd9ae;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-bottom: solid 5px #3f8d44;
  flex-shrink: 0;
  min-height: 60px;
}

.logo-link {
  font-size: 28px;
  font-weight: bold;
  color: #1c5253;
  text-decoration: none;
  letter-spacing: -0.5px;
}

.logo-link:hover {
  color: #1a2e19;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.user-section:hover {
  background-color: rgba(255, 255, 255, 0.318);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.user-name {
  color: #1c5253;
  font-size: 16px;
  font-weight: 500;
}

.settings-icon {
  width: 20px;
  height: 20px;
  color: #1c5253;
  cursor: pointer;
}
</style>

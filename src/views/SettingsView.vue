<template>
  <div class="settings-container">
    <h1>設定</h1>
    <div class="setting-channel">
      <p>デフォルトのチャンネル：{{ user.defaultChannel }}</p>
      <div class="serch-inout-wrapper">
        <input type="text" id="channel" placeholder="チャンネルを検索" class="channel-search-box" />
        <button class="search-button">
          <img src="../assets/search-icon-image.png" width="25px" line-height="25px" />
        </button>
      </div>
    </div>
    <div class="setting-theme">
      <p>テーマ：</p>
    </div>
    <button @click="gotoHome" class="action-button">保存</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UserSettings } from '@/types/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const gotoHome = () => {
  router.push({ name: 'home' });
};

const user = ref<UserSettings>({
  defaultChannel: '',
});
</script>

<style>
h1 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.settings-container {
  max-width: 800px;
  padding: 2rem;
  margin: 0 auto;
}

.setting-channel {
  margin-bottom: 20px;
  display: flex;
}

.serch-inout-wrapper {
  position: relative;
  display: flex;
  flex-direction: row;
  width: 300px;
}

.channel-search-box {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #bdbdbd;
  border-radius: 4px;
  margin-bottom: 12px;
  outline: none;
  transition: border-color 0.2s;
  padding-right: 36px;
  position: relative;
}

.channel-search-box:focus {
  border-color: #58b582;
  background-color: #f6fff9;
}

.search-button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.search-icon {
  width: 12px;
  height: 12px;
  object-fit: contain;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.search-icon-button:hover .search-icon {
  opacity: 1;
}

p {
  font-size: 14px;
  margin-bottom: 10px;
}

.action-button {
  font-size: 0.9rem;
  padding: 0.6rem 1.5rem;
  background-color: #58b5828a;
  border: 2px solid #6edfa115;
  border-radius: 3px;
}

.action-button:hover {
  background-color: #58b582;
  color: white;
  cursor: pointer;
}

/* --- レスポンシブ対応 --- */
/* 画面幅が768px以下の場合に適用 */
@media (max-width: 768px) {
  .settings-container {
    padding: 1rem;
  }

  .setting-channel,
  .setting-theme {
    flex-direction: column;
    align-items: flex-start;
  }

  .serch-inout-wrapper {
    width: 100%;
  }

  .action-button {
    width: 50%;
    margin-top: 10px;
  }
}
</style>

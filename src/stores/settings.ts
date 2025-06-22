import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { UserSettings } from '@/types/api';
import { getUserSettings, updateUserSettings as apiUpdateUserSettings } from '@/api/client';

export const useSettingsStore = defineStore('settings', () => {
  const userSettings = ref<UserSettings | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * ユーザー設定を取得する
   */
  async function fetchUserSettings() {
    loading.value = true;
    error.value = null;
    try {
      userSettings.value = await getUserSettings();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch user settings';
    } finally {
      loading.value = false;
    }
  }

  /**
   * ユーザー設定を更新する
   * @param settings - 更新する設定
   */
  async function updateUserSettings(settings: UserSettings) {
    loading.value = true;
    error.value = null;
    try {
      await apiUpdateUserSettings(settings);
      userSettings.value = settings;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update user settings';
    } finally {
      loading.value = false;
    }
  }

  /**
   * ストアの状態をリセットする
   */
  function $reset() {
    userSettings.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    userSettings,
    loading,
    error,
    fetchUserSettings,
    updateUserSettings,
    $reset,
  };
});

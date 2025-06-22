import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { getChannels } from '@/api/client';
import type { Channel, UUID } from '@/types/api';

export const useChannelsStore = defineStore('channels', () => {
  const channels = ref<Channel[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * APIからチャンネル一覧を取得します。
   */
  async function fetchChannels() {
    loading.value = true;
    error.value = null;
    try {
      channels.value = await getChannels();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred';
    } finally {
      loading.value = false;
    }
  }

  /**
   * チャンネルIDをキー、チャンネルパスを値とするマップを返します。
   * IDからパスへの変換を高速に行うために使用します。
   */
  const channelPathMap = computed(() => {
    return new Map(channels.value.map((c) => [c.id, c.path]));
  });

  /**
   * 指定されたIDに対応するチャンネルパスを取得します。
   * @param id - チャンネルID
   * @returns チャンネルパス。見つからない場合は 'unknown'。
   */
  const getChannelPathById = (id: UUID): string => {
    return channelPathMap.value.get(id) ?? 'unknown';
  };

  return {
    channels,
    loading,
    error,
    fetchChannels,
    getChannelPathById,
  };
});

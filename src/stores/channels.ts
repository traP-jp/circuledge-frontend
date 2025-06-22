import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Channel, UUID } from '@/types/api';
import { getChannels } from '@/api/client';

export const useChannelsStore = defineStore('channels', () => {
  const channels = ref<Channel[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * チャンネル一覧を取得する
   */
  async function fetchChannels() {
    loading.value = true;
    error.value = null;
    try {
      const channelsResponse = await getChannels();
      channels.value = channelsResponse.sort((a, b) => a.path.localeCompare(b.path));
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch channels';
    } finally {
      loading.value = false;
    }
  }

  /**
   * チャンネルIDからチャンネル情報を取得する
   * @param channelId - チャンネルのUUID
   */
  function getChannelById(channelId: UUID): Channel | undefined {
    return channels.value.find((channel) => channel.id === channelId);
  }

  /**
   * チャンネルIDからチャンネルパスを取得する
   * @param channelId - チャンネルのUUID
   */
  function getChannelPathById(channelId: UUID): string {
    const channel = channels.value.find((channel) => channel.id === channelId);
    return channel?.path || '';
  }

  /**
   * チャンネルパスでチャンネルを検索する
   * @param path - 検索するパス
   */
  function getChannelByPath(path: string): Channel | undefined {
    return channels.value.find((channel) => channel.path === path);
  }

  /**
   * チャンネルをパスで検索（部分一致）
   * @param query - 検索クエリ
   * @param limit - 結果の最大数（デフォルト: 10）
   */
  function searchChannels(query: string, limit: number = 10): Channel[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return channels.value
      .filter((channel) => channel.path.toLowerCase().includes(lowerQuery))
      .slice(0, limit);
  }

  /**
   * チャンネルをパス階層でソートした一覧を取得
   */
  const sortedChannels = computed(() => {
    return [...channels.value].sort((a, b) => a.path.localeCompare(b.path));
  });

  /**
   * ルートチャンネル（トップレベル）一覧を取得
   */
  const rootChannels = computed(() => {
    return channels.value.filter((channel) => !channel.path.includes('/'));
  });

  /**
   * 指定したパスの子チャンネル一覧を取得
   * @param parentPath - 親チャンネルのパス
   */
  function getChildChannels(parentPath: string): Channel[] {
    const searchPath = parentPath.endsWith('/') ? parentPath : `${parentPath}/`;
    return channels.value.filter(
      (channel) =>
        channel.path.startsWith(searchPath) &&
        channel.path !== parentPath &&
        !channel.path.substring(searchPath.length).includes('/')
    );
  }

  /**
   * チャンネル階層ツリーを取得
   */
  const channelTree = computed(() => {
    const tree: { [key: string]: Channel[] } = {};

    channels.value.forEach((channel) => {
      const pathParts = channel.path.split('/');
      if (pathParts.length === 1) {
        // ルートチャンネル
        if (!tree['']) tree[''] = [];
        tree[''].push(channel);
      } else {
        // 子チャンネル
        const parentPath = pathParts.slice(0, -1).join('/');
        if (!tree[parentPath]) tree[parentPath] = [];
        tree[parentPath].push(channel);
      }
    });

    return tree;
  });

  /**
   * ストアの状態をリセットする
   */
  function $reset() {
    channels.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    channels,
    loading,
    error,
    sortedChannels,
    rootChannels,
    channelTree,
    fetchChannels,
    getChannelById,
    getChannelPathById,
    getChannelByPath,
    searchChannels,
    getChildChannels,
    $reset,
  };
});

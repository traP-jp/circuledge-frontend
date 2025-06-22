<template>
  <div class="note-list-view">
    <!-- 検索や新規作成ボタンのエリア -->
    <div class="controls-bar">
      <div class="search-group">
        <!-- チャンネル検索 -->
        <div class="channel-search-box">
          <label for="channel-input">チャンネル:</label>
          <div class="channel-input-container">
            <div class="channel-dropdown-container">
              <input
                type="text"
                id="channel-input"
                v-model="searchChannelName"
                placeholder="例: event, /// (深さ3), event/// (深さ4でevent/*/*/*)"
                class="channel-input"
                @focus="showChannelDropdown = true"
                @blur="hideChannelDropdown"
              />
              <div
                v-if="showChannelDropdown && filteredChannels.length > 0"
                class="channel-dropdown"
              >
                <div class="dropdown-header">
                  <small
                    >{{
                      filteredChannels.length === 8 ? '8+' : filteredChannels.length
                    }}
                    件のチャンネル</small
                  >
                </div>
                <div
                  v-for="channel in filteredChannels"
                  :key="channel.id"
                  class="channel-option"
                  :class="{ selected: channel.path === searchChannelName }"
                  @mousedown="selectChannel(channel.path)"
                >
                  <span class="channel-path">{{ channel.path }}</span>
                  <span class="channel-depth">深さ{{ channel.path.split('/').length }}</span>
                </div>
              </div>
            </div>
            <div class="search-options">
              <input type="checkbox" id="childchannel" v-model="includeChildChannels" />
              <label for="childchannel" class="checkbox-label">子チャンネルを含む</label>
            </div>
          </div>
        </div>
        <!-- キーワード検索 -->
        <div class="keyword-search-box">
          <label for="keywords">キーワード:</label>
          <div class="keyword-input-container">
            <input
              type="search"
              id="keywords"
              v-model="searchKeywords"
              @keyup.enter="onSearch"
              placeholder="タイトルで検索..."
            />
            <button @click="onSearch" aria-label="検索実行" class="search-button">
              <img src="../assets/icons/SearchIcon.png" class="loupe" alt="検索" />
            </button>
          </div>
        </div>
      </div>
      <div class="actions-group">
        <button @click="handleCreateNewNote()" class="btn-primary" :disabled="loading">
          {{ loading ? '作成中...' : '新規ノートを追加' }}
        </button>
      </div>
    </div>

    <!-- ソートボタンのエリア -->
    <div class="sort-bar">
      <button @click="toggleSort('date')" :class="{ active: sortKey === 'date' }">
        日時順でソート
        <span v-if="sortKey === 'date'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
      </button>
      <button @click="toggleSort('title')" :class="{ active: sortKey === 'title' }">
        タイトル順でソート
        <span v-if="sortKey === 'title'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
      </button>
    </div>

    <!-- ローディング・エラー表示 -->
    <div v-if="loading" class="loading-indicator">ノートを読み込み中...</div>
    <div v-if="error" class="error-message">エラーが発生しました: {{ error }}</div>

    <!-- ノート一覧のグリッドエリア -->
    <div v-if="!loading && !error" class="note-grid">
      <div v-if="sortedNotes.length === 0" class="no-notes-found">ノートが見つかりません。</div>
      <div v-else class="notes-info">
        <small>{{ sortedNotes.length }} 件のノートを表示中</small>
      </div>
      <!-- NoteCardコンポーネントを使用 -->
      <NoteCard
        v-for="note in sortedNotes"
        :key="note.id"
        :title="note.title || '無題'"
        :abstract="note.summary || '概要なし'"
        :channel="channelsStore.getChannelPathById(note.channel)"
        :date="formatDate(note.updatedAt)"
        @click="goToNoteDetail(note.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { useChannelsStore } from '@/stores/channels';
import { storeToRefs } from 'pinia';
import type { UUID } from '@/types/api';
import NoteCard from '@/components/features/notes/NoteCard.vue'; // NoteCardをインポート

// --- StoresとRouterのセットアップ ---
const router = useRouter();
const notesStore = useNotesStore();
const channelsStore = useChannelsStore();
const { notes, loading, error } = storeToRefs(notesStore);
const { channels } = storeToRefs(channelsStore);

// --- 検索・フィルタリング条件 ---
const searchChannelName = ref('');
const debouncedSearchChannelName = ref('');
const selectedChannelId = ref<UUID | undefined>(undefined);
const includeChildChannels = ref(true);
const searchKeywords = ref('');
const showChannelDropdown = ref(false);
const searchDebounceTimer = ref<number | null>(null);

// --- ソート条件 ---
type SortKey = 'date' | 'title';
type SortOrder = 'asc' | 'desc';
const sortKey = ref<SortKey>('date');
const sortOrder = ref<SortOrder>('desc');

// --- Computed Properties ---

// チャンネル入力の候補リストをフィルタリング
const filteredChannels = computed(() => {
  // channels.valueが配列でない場合の安全チェック
  if (!channels.value || !Array.isArray(channels.value)) {
    return [];
  }

  const query = debouncedSearchChannelName.value;

  if (!query) {
    // 検索がない場合は、よく使われそうなトップレベルのチャンネルのみ表示
    return channels.value
      .filter((c) => !c.path.includes('/')) // 深さ1のみ
      .slice(0, 10); // 最大10件に制限
  }

  const lowerQuery = query.toLowerCase();
  let results = [];

  // 新しいフィルタリングロジック: `/` の数で深さを指定
  if (lowerQuery.includes('/')) {
    // `/` を含む場合: 深さとパスパターンによる検索
    const parts = lowerQuery.split('/');
    const expectedDepth = parts.length;

    results = channels.value.filter((c) => {
      const path = c.path.toLowerCase();
      const pathParts = path.split('/');

      // 深さが一致しない場合は除外
      if (pathParts.length !== expectedDepth) {
        return false;
      }

      // 各パートが正しい位置にあるかチェック
      for (let i = 0; i < parts.length; i++) {
        const queryPart = parts[i];
        const pathPart = pathParts[i];

        // 空文字列でない場合は部分一致チェック
        if (queryPart !== '' && !pathPart.includes(queryPart)) {
          return false;
        }
      }

      return true;
    });
  } else {
    // `/` がない場合：深さ1のチャンネルのみで部分一致検索
    results = channels.value.filter((c) => {
      const path = c.path.toLowerCase();
      // 深さ1のチャンネルのみ（パスに '/' が含まれない）
      return !c.path.includes('/') && path.includes(lowerQuery);
    });
  }

  // 結果を制限し、関連度順にソート
  return results
    .sort((a, b) => {
      const aPath = a.path.toLowerCase();
      const bPath = b.path.toLowerCase();

      // 完全一致が最優先
      if (aPath === lowerQuery) return -1;
      if (bPath === lowerQuery) return 1;

      // 先頭一致が次に優先
      if (aPath.startsWith(lowerQuery) && !bPath.startsWith(lowerQuery)) return -1;
      if (!aPath.startsWith(lowerQuery) && bPath.startsWith(lowerQuery)) return 1;

      // 短いパスを優先（より具体的でない）
      return aPath.length - bPath.length;
    })
    .slice(0, 8); // さらに制限を減らして8件に
});

// クライアントサイドでソートされたノートリスト (APIソートが効かない場合のフォールバック)
const sortedNotes = computed(() => {
  // notes.valueが配列でない場合の安全チェック
  if (!notes.value || !Array.isArray(notes.value)) {
    return [];
  }

  // APIから既にソートされたデータが来る想定だが、念のためクライアントサイドでも軽くソート
  return [...notes.value].sort((a, b) => {
    // undefinedチェックを追加
    if (!a.title || !b.title) return 0;

    if (sortKey.value === 'title') {
      const result = (a.title || '').localeCompare(b.title || '');
      return sortOrder.value === 'asc' ? result : -result;
    }
    // デフォルトは日付順 (updatedAt)
    const result = (b.updatedAt || 0) - (a.updatedAt || 0); // 降順がデフォルト
    return sortOrder.value === 'asc' ? -result : result;
  });
});

// --- Watchers ---

// チャンネル検索のdebounce処理
watch(searchChannelName, (newValue) => {
  // 既存のタイマーをクリア
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }

  // 新しいタイマーを設定（200ms後に実行）
  searchDebounceTimer.value = setTimeout(() => {
    debouncedSearchChannelName.value = newValue;
  }, 200) as unknown as number;
});

// チャンネル名が入力されたら、対応するIDを解決する
watch(debouncedSearchChannelName, (newName) => {
  if (!channels.value || !Array.isArray(channels.value)) {
    selectedChannelId.value = undefined;
    return;
  }

  const foundChannel = channels.value.find((c) => c.path === newName);
  selectedChannelId.value = foundChannel?.id;
});

// --- Methods ---

// 検索を実行する
const executeSearch = () => {
  notesStore.fetchNotes({
    channel: selectedChannelId.value,
    'include-child': selectedChannelId.value ? includeChildChannels.value : undefined,
    // API仕様ではtitleとbodyのOR検索がないため、titleでフィルタリング
    title: searchKeywords.value || undefined,
    sortkey: sortKey.value, // ソートキーをAPIに渡す
  });
};

// 検索ボタンクリック時のハンドラ
const onSearch = () => {
  executeSearch();
};

// 新規ノート作成ボタンのハンドラ
const handleCreateNewNote = () => {
  notesStore.createNoteAndNavigate(router);
};

// ノート詳細ページへ遷移
const goToNoteDetail = (noteId: UUID) => {
  router.push(`/notes/${noteId}/view`);
};

// ソートキーと順序を切り替える
const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = key === 'date' ? 'desc' : 'asc';
  }
  // ソート変更時に再検索を実行
  executeSearch();
};

// 日付を YYYY/MM/DD 形式にフォーマット
const formatDate = (timestamp: number) => {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
};

// チャンネルドロップダウン関連メソッド
const selectChannel = (channelPath: string) => {
  searchChannelName.value = channelPath;
  debouncedSearchChannelName.value = channelPath; // 即座に反映
  showChannelDropdown.value = false;

  // タイマーをクリア（即座に選択されたため）
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
    searchDebounceTimer.value = null;
  }

  // 選択後に検索を実行
  if (channels.value && Array.isArray(channels.value)) {
    const foundChannel = channels.value.find((c) => c.path === channelPath);
    selectedChannelId.value = foundChannel?.id;
  } else {
    selectedChannelId.value = undefined;
  }
};

const hideChannelDropdown = () => {
  // 少し遅延させてクリックイベントを処理できるようにする
  setTimeout(() => {
    showChannelDropdown.value = false;
  }, 150);
};

// --- Lifecycle Hooks ---
onMounted(() => {
  // コンポーネントマウント時にチャンネルリストとノートリストを初期取得
  channelsStore.fetchChannels();
  executeSearch();
});

onUnmounted(() => {
  // タイマーをクリーンアップ
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
  // コンポーネントアンマウント時にストアの状態をリセット
  notesStore.$reset();
});
</script>

<style scoped>
/* --- 全体レイアウト --- */
.note-list-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  color: #333;
}

/* --- 上部コントロールバー --- */
.controls-bar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.actions-group {
  display: flex;
  justify-content: flex-end;
}

.channel-search-box,
.keyword-search-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.channel-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.channel-dropdown-container {
  position: relative;
}

.channel-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #3f8d44;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-header {
  padding: 0.5rem 1rem;
  background-color: #f0f8f1;
  border-bottom: 1px solid #abd9ae;
  border-radius: 0;
}

.dropdown-header small {
  color: #6c757d;
  font-weight: 500;
}

.channel-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s;
}

.channel-option:hover {
  background-color: #f8f9fa;
}

.channel-option.selected {
  background-color: #abd9ae;
  color: #1c5253;
}

.channel-option.selected .channel-path {
  color: #1c5253;
  font-weight: 600;
}

.channel-option.selected .channel-depth {
  background-color: #3f8d44;
  color: white;
}

.channel-option:last-child {
  border-bottom: none;
  border-radius: 0 0 8px 8px;
}

.channel-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: #1c5253;
  font-weight: 500;
}

.channel-depth {
  font-size: 0.8rem;
  color: #888;
  background-color: #e9ecef;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}

.keyword-input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}

.checkbox-label {
  font-size: 0.85rem !important;
  color: #666 !important;
  font-weight: 400 !important;
  cursor: pointer;
}

/* --- ボタンと入力欄の共通スタイル --- */
label {
  font-size: 0.9rem;
  color: #1c5253;
  font-weight: 500;
}

input[type='search'],
input[type='text'] {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  width: 100%;
}

.channel-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.95rem;
}

.channel-input:focus {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.channel-dropdown-container:focus-within .channel-input {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.keyword-input-container input[type='search'] {
  flex-grow: 1;
}

.search-button {
  padding: 0.75rem;
  background-color: #abd9ae;
  border: 1px solid #3f8d44;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
}

.search-button:hover {
  background-color: #9dd0a1;
}

input[type='search']:focus,
input[type='text']:focus {
  outline: none;
  border-color: #3f8d44;
  box-shadow: 0 0 0 3px rgba(63, 141, 68, 0.2);
}

input[type='checkbox'] {
  width: 1.2em;
  height: 1.2em;
  accent-color: #3f8d44;
}

.loupe {
  width: 20px;
  height: 20px;
  vertical-align: middle;
  fill: #1c5253;
}

.sort-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s,
    transform 0.1s;
  font-family: inherit;
}

button:hover:not(:disabled) {
  background-color: #e9ecef;
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #abd9ae;
  border-color: #3f8d44;
  color: #1c5253;
  font-weight: 700;
}

.btn-primary:hover:not(:disabled) {
  background-color: #9dd0a1;
  border-color: #2f6d33;
}

.sort-bar button {
  background-color: transparent;
  border: 1px solid #ccc;
  color: #555;
}

.sort-bar button.active {
  background-color: #abd9ae;
  border-color: #3f8d44;
  color: #1c5253;
}

.sort-bar button:hover:not(.active) {
  background-color: #f0f8f1;
  border-color: #abd9ae;
}

/* --- ノートグリッド --- */
.note-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notes-info {
  grid-column: 1 / -1;
  text-align: center;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.notes-info small {
  color: #6c757d;
  font-weight: 500;
}

/* --- 状態表示 --- */
.loading-indicator,
.error-message,
.no-notes-found {
  width: 100%;
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
  font-size: 1.1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-message {
  color: #d32f2f;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
}

.loading-indicator {
  color: #1c5253;
  background-color: #f0f8f1;
  border: 1px solid #abd9ae;
}

/* --- レスポンシブ対応 --- */
@media (max-width: 768px) {
  .note-list-view {
    padding: 1rem;
  }

  .search-group {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .actions-group {
    justify-content: stretch;
  }

  .btn-primary {
    width: 100%;
  }

  input[type='search'],
  input[type='text'] {
    font-size: 16px; /* iOS zoom防止 */
  }

  .channel-dropdown {
    max-height: 200px;
  }

  .channel-option {
    padding: 0.6rem 0.8rem;
  }

  .channel-path {
    font-size: 0.85rem;
  }

  .note-grid {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }

  .sort-bar {
    flex-wrap: wrap;
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .note-list-view {
    padding: 0.5rem;
  }

  .controls-bar {
    padding: 1rem;
    gap: 1rem;
  }

  .search-group {
    gap: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>

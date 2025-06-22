<template>
  <div class="note-list-view">
    <!-- 検索や新規作成ボタンのエリア -->
    <div class="controls-bar">
      <div class="search-group">
        <!-- チャンネル検索 -->
        <div class="search-box">
          <label for="channel-input">チャンネル:</label>
          <input
            type="text"
            id="channel-input"
            v-model="searchChannelName"
            list="channel-list"
            placeholder="チャンネルパスを入力..."
          />
          <datalist id="channel-list">
            <option v-for="channel in filteredChannels" :key="channel.id" :value="channel.path" />
          </datalist>
        </div>
        <div class="search-options">
          <input type="checkbox" id="childchannel" v-model="includeChildChannels" />
          <label for="childchannel">子チャンネルを含む</label>
        </div>
        <!-- キーワード検索 -->
        <div class="search-box">
          <label for="keywords">キーワード:</label>
          <input type="search" id="keywords" v-model="searchKeywords" @keyup.enter="onSearch" />
          <button @click="onSearch" aria-label="検索実行">
            <img src="../assets/icons/SearchIcon.png" class="loupe" alt="検索" />
          </button>
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
      <!-- NoteCardコンポーネントを使用 -->
      <NoteCard
        v-for="note in sortedNotes"
        :key="note.id"
        :title="note.title"
        :abstract="note.summary"
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
const selectedChannelId = ref<UUID | undefined>(undefined);
const includeChildChannels = ref(true);
const searchKeywords = ref('');

// --- ソート条件 ---
type SortKey = 'date' | 'title';
type SortOrder = 'asc' | 'desc';
const sortKey = ref<SortKey>('date');
const sortOrder = ref<SortOrder>('desc');

// --- Computed Properties ---

// チャンネル入力の候補リストをフィルタリング
const filteredChannels = computed(() => {
  if (!searchChannelName.value) {
    return channels.value;
  }
  return channels.value.filter((c) =>
    c.path.toLowerCase().includes(searchChannelName.value.toLowerCase())
  );
});

// クライアントサイドでソートされたノートリスト
const sortedNotes = computed(() => {
  return [...notes.value].sort((a, b) => {
    if (sortKey.value === 'title') {
      const result = a.title.localeCompare(b.title);
      return sortOrder.value === 'asc' ? result : -result;
    }
    // デフォルトは日付順 (updatedAt)
    const result = b.updatedAt - a.updatedAt; // 降順がデフォルト
    return sortOrder.value === 'asc' ? -result : result;
  });
});

// --- Watchers ---

// チャンネル名が入力されたら、対応するIDを解決する
watch(searchChannelName, (newName) => {
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
};

// 日付を YYYY/MM/DD 形式にフォーマット
const formatDate = (timestamp: number) => {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
};

// --- Lifecycle Hooks ---
onMounted(() => {
  // コンポーネントマウント時にチャンネルリストとノートリストを初期取得
  channelsStore.fetchChannels();
  executeSearch();
});

onUnmounted(() => {
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
  font-family: sans-serif;
  color: #333;
}

/* --- 上部コントロールバー --- */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* 画面が狭い時に折り返す */
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.search-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* --- ボタンと入力欄の共通スタイル --- */
label {
  font-size: 0.9rem;
  color: #333;
}

input[type='search'],
input[type='text'] {
  padding: 0.5rem 0.8rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

input[type='search']:focus,
input[type='text']:focus {
  outline: none;
  border-color: #3F8D44;
  box-shadow: 0 0 0 3px rgba(37, 138, 93, 0.2);
}

input[type='checkbox'] {
  width: 1.2em;
  height: 1.2em;
}

.loupe {
  width: 20px;
  height: 20px;
  vertical-align: middle;
  fill: #888;
}

.sort-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem; /* note-gridとの間にマージンを追加 */
}

button {
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #e9e9e9;
}

.btn-primary {
  background-color: #ABD9AE;
  border-color: #3F8D44;
}
.btn-primary:hover:not(:disabled) {
  background-color: #58b582;
}

.sort-bar button {
  background-color: transparent;
  border: 1px solid #ccc;
  color: #555;
}
.sort-bar button.active {
  background-color: #ABD9AE;
  border-color: #ABD9AE;
}

/* --- ノートグリッド --- */
.note-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

/* --- 状態表示 --- */
.loading-indicator,
.error-message,
.no-notes-found {
  width: 100%;
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
}

/* --- レスポンシブ対応 --- */
@media (max-width: 768px) {
  .note-list-view {
    padding: 1rem;
  }
  .controls-bar,
  .search-group {
    flex-direction: column;
    align-items: stretch;
  }
  .note-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="note-list-view">
    <header class="header">
      <h1 class="title">ノート一覧</h1>
      <div class="user-menu">
        <div class="user-icon"></div>
      </div>
    </header>

    <main class="main-content">
      <div class="toolbar">
        <div class="search-filters">
          <div class="form-group">
            <label for="search">検索:</label>
            <input
              type="text"
              id="search"
              v-model="searchQuery"
              placeholder="タイトルや内容で検索..."
            />
          </div>
        </div>
        <div class="action-buttons">
          <button @click="onNewNoteClick" class="add-note-button">新しいノート</button>
          <button class="setting-button">設定</button>
        </div>
      </div>

      <!-- ノート作成時のエラーメッセージ表示 -->
      <div v-if="creationError" class="error-message">
        {{ creationError }}
      </div>

      <div class="sort-buttons">
        <button @click="sortOrder = 'desc'" :class="{ active: sortOrder === 'desc' }">
          更新順
        </button>
        <button @click="sortOrder = 'asc'" :class="{ active: sortOrder === 'asc' }">作成順</button>
      </div>

      <div v-if="notesStore.loading" class="loading-indicator">読み込み中...</div>
      <div v-else-if="notesStore.error" class="error-message">エラー: {{ notesStore.error }}</div>
      <div v-else class="note-grid">
        <div
          class="note-card"
          v-for="note in filteredAndSortedNotes"
          :key="note.id"
          @click="goToNote(note.id)"
          tabindex="0"
          role="button"
          aria-label="ノートを開く"
        >
          <div class="note-card-header">
            <h2>{{ note.title }}</h2>
          </div>
          <div class="note-card-body">
            <p>{{ note.summary }}</p>
            <div v-if="note.tag && note.tag.length > 0" class="note-tag">
              #{{ note.tag.split(',').join(' #') }}
            </div>
          </div>
          <div class="note-card-footer">
            更新日: {{ new Date(note.updatedAt).toLocaleDateString() }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { createNote } from '@/api/client';
import type { NoteSummary } from '@/types/api';

const notesStore = useNotesStore();
const router = useRouter();

const searchQuery = ref('');
const sortOrder = ref<'desc' | 'asc'>('desc');
const creationError = ref<string | null>(null);

const filteredAndSortedNotes = computed(() => {
  let notes: NoteSummary[] = [...notesStore.notes];

  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    notes = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowerCaseQuery) ||
        (note.summary && note.summary.toLowerCase().includes(lowerCaseQuery))
    );
  }

  notes.sort((a, b) => {
    const dateA = new Date(sortOrder.value === 'desc' ? a.updatedAt : a.createdAt).getTime();
    const dateB = new Date(sortOrder.value === 'desc' ? b.updatedAt : b.createdAt).getTime();
    return dateB - dateA;
  });

  return notes;
});

/**
 * 新規ノート作成ボタンがクリックされたときの処理です。
 * 空のノートを作成し、編集画面に遷移します。
 */
async function onNewNoteClick() {
  creationError.value = null;
  try {
    // APIを呼び出して空のノートを作成します。
    const newNote = await createNote();

    // ノート作成後、すぐに編集画面に遷移します。
    // ノートリストの再取得は、ユーザーがリストビューに戻ってきた際の
    // onMountedフックで行われるため、ここでは不要です。
    // これにより、不要なAPI呼び出しを削減し、UXを向上させます。
    router.push({ name: 'note-edit', params: { noteId: newNote.id } });
  } catch (err) {
    console.error('ノートの作成に失敗しました:', err);
    creationError.value =
      'ノートの作成に失敗しました。ネットワーク状況を確認し、再度お試しください。';
  }
}

/**
 * ノート詳細画面へ遷移します。
 * @param noteId 対象のノートID
 */
function goToNote(noteId: string) {
  router.push({ name: 'note-view', params: { noteId } });
}

onMounted(() => {
  notesStore.fetchNotes();
});
</script>

<style scoped>
.note-list-view {
  font-family: sans-serif;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
}
.title {
  font-size: 1.5rem;
  color: #4caf50;
}
.user-menu {
  display: flex;
  align-items: center;
}
.user-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #ccc;
  margin-left: 0.5rem;
}
.main-content {
  padding: 1rem;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.search-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.form-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.action-buttons {
  display: flex;
  gap: 1rem;
}
.add-note-button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
}
.setting-button {
  background-color: #fff;
  color: #333;
  border: 1px solid #ccc;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
}
.sort-buttons {
  margin-bottom: 1rem;
}
.sort-buttons button {
  border: 1px solid #ccc;
  background-color: #fff;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
.sort-buttons button:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}
.sort-buttons button:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-left: none;
}
.sort-buttons button.active {
  background-color: #e0e0e0;
}
.loading-indicator,
.error-message {
  padding: 1rem;
  text-align: center;
  border-radius: 4px;
}
.error-message {
  color: #d32f2f;
  background-color: #ffcdd2;
  border: 1px solid #d32f2f;
}
.note-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
.note-card {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.note-card:hover,
.note-card:focus {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.note-card-header h2 {
  margin: 0;
  font-size: 1.2rem;
}
.note-card-body {
  margin: 1rem 0;
  flex-grow: 1;
}
.note-tag {
  color: #007bff;
  font-size: 0.9em;
}
.note-card-footer {
  text-align: right;
  color: #888;
  font-size: 0.9em;
}
</style>

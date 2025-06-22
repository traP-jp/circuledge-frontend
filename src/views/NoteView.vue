<template>
  <div class="note-view">
    <div v-if="loading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">エラー: {{ error }}</div>
    <div v-else-if="note" class="note-content">
      <div class="header-controls">
        <div class="note-info">
          <div class="note-channel">channel: {{ note.channel }}</div>
          <div class="note-permission">permission: {{ note.permission }}</div>
        </div>
        <div class="note-actions">
          <button class="note-action-button" @click="goHome">ホームへ戻る</button>
          <button class="note-action-button" @click="editNote">編集</button>
        </div>
      </div>
      <div class="note-body" v-html="renderedMarkdown"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoteRevision } from '@/types/api';
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getNote } from '@/api/client';

const route = useRoute();
const router = useRouter();
const note = ref<NoteRevision | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const renderedMarkdown = computed(() => {
  if (!note.value?.body) {
    return '';
  }
  // markedでMarkdownをHTMLに変換し、DOMPurifyでサニタイズする
  const rawHtml = marked(note.value.body) as string;
  return DOMPurify.sanitize(rawHtml);
});

const fetchNote = async () => {
  try {
    loading.value = true;
    error.value = null;
    const noteId = route.params.noteId as string;
    const noteData = await getNote(noteId);
    note.value = noteData;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'ノートの取得に失敗しました';
    console.error('Failed to fetch note:', err);
  } finally {
    loading.value = false;
  }
};

const goHome = () => {
  router.push('/notes');
};

const editNote = () => {
  const noteId = route.params.noteId as string;
  router.push(`/notes/${noteId}/edit`);
};

onMounted(() => {
  fetchNote();
});
</script>

<style scoped>
.note-view {
  max-width: 1200px;
  margin: auto;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.error {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #d32f2f;
  background-color: #ffebee;
  border: 1px solid #f8bbd9;
  border-radius: 4px;
  margin: 20px 0;
}

.header-controls {
  display: flex;
  /* Flexboxコンテナにする */
  justify-content: space-between;
  /* 左右の要素を両端に配置 */
  align-items: center;
  /* 垂直方向の中央に揃える */
  margin-bottom: 20px;
  /* タイトルとの間に少し余白 */
}

.note-info {
  display: flex;
  /* channelとpermissionもFlexboxで横並びにする */
  align-items: center;
  /* 垂直方向の中央に揃える */
  gap: 20px;
  /* channelとpermissionの間のスペース */
}

.note-channel {
  font-size: 16px;
}

.note-permission {
  font-size: 16px;
}

.note-actions {
  display: flex;
  gap: 10px;
}

.note-action-button {
  font-size: 13px;
  width: 130px;
  height: 32px;
  margin-top: 20px;
  background-color: #58b5828a;
  border: 2px solid #6edfa115;
  border-color: #6edfa115;
  border-radius: 3px;
  cursor: pointer;
}

.note-action-button:hover {
  background-color: #5f8570;
  border-color: #6edfa1;
}

.note-body {
  margin-top: 20px;
  line-height: 1.6;
}
</style>

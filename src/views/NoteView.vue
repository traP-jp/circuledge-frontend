<template>
  <div class="note-view">
    <div v-if="note">
      <div class="header-controls">
        <div class="note-info">
          <div class="note-channel">
            <span>channel: </span>
            <span class="note-channel">{{ note.channel }}</span>
          </div>
        </div>
        <div class="note-actions">
          <button @click="goToHome" class="note-action-button">ホームへ戻る</button>
          <button @click="gotoNoteEdit" class="note-action-button">編集</button>
        </div>
      </div>
      <h1 class="note-title">{{ displayedTitle }}</h1>
      <div class="note-body" v-html="renderedMarkdown"></div>
    </div>
    <div v-else>
      <p>読み込み中またはエラー</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';

const router = useRouter();
const route = useRoute();

const goToHome = () => {
  router.push({ name: 'home' });
};

const currentNoteId = Array.isArray(route.params.noteId) ? route.params.noteId[0] : route.params.noteId;
const gotoNoteEdit = () => {
  if (currentNoteId) {
    router.push({ name: 'note-edit', params: { noteId: currentNoteId } });
  }
};

const notesStore = useNotesStore();
const note = computed(() => notesStore.currentNote)

const renderedMarkdown = computed(() => {
  if (!note.value || !note.value.body) {
    return '';
  }
  // markedでMarkdownをHTMLに変換し、DOMPurifyでサニタイズする
  const rawHtml = marked(note.value.body) as string;
  return DOMPurify.sanitize(rawHtml);
});

//本分の一行目をタイトルとする
const displayedTitle = computed(() => {
  if (note.value && typeof note.value.body === 'string' && note.value.body.length > 0) {
    const lines = note.value.body.split(/\r?\n/);
    return lines[0]; // 最初の行をタイトルとする
  }
  return '無題のノート'; //デフォルトタイトル
});

onMounted(() => {
  if (currentNoteId) {
    notesStore.fetchNoteById(currentNoteId);
  }
})
</script>

<style scoped>
.note-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: #333;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 2rem;
}

.note-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.note-channel,
.note-tag {
  font-size: 16px;
}

.note-actions {
  display: flex;
  gap: 10px;
}

.note-action-button {
  font-size: 0.9rem;
  padding: 0.6rem 1.5rem;
  background-color: #58b5828a;
  border: 2px solid #6edfa115;
  border-color: #6edfa115;
  border-radius: 3px;
}

.note-action-button:hover {
  background-color: #58b582;
  color: white;
  cursor: pointer;
}

.note-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.note-body {
  line-height: 1.7;
  font-size: 1.1rem;
}

.note-body :deep(pre) {
  background-color: #f6f8fa;
  padding: 1em;
  border-radius: 6px;
  border: 1px solid #dfe4ed;
  overflow-x: auto;
}

.note-body :deep(code) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: 0.9em;
  background-color: #f6f8fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

.note-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

.note-body :deep(ul),
.note-body :deep(ol) {
  padding-left: 2rem;
}

/* --- レスポンシブ対応 --- */
/* 画面幅が768px以下の場合に適用 */
@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .note-actions {
    width: 100%;
    margin-top: 1rem;
  }

  .note-action-button {
    flex-grow: 1;
    text-align: center;
  }

  .note-title {
    font-size: 2rem;
  }

  .note-body {
    font-size: 1rem;
  }
}
</style>

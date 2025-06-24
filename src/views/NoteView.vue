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
      <div
        ref="markdownContainer"
        class="note-body prose prose-lg markdown-content markdown-body"
        v-html="renderedMarkdown"
      ></div>
    </div>
    <div v-else>
      <p>読み込み中またはエラー</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { AdvancedMarkdownRenderer } from '@/utils/advancedMarkdown';
import { extractTitle } from '@/utils/textExtraction';

const router = useRouter();
const route = useRoute();
const markdownContainer = ref<HTMLElement>();

const goToHome = () => {
  router.push({ name: 'home' });
};

const currentNoteId = Array.isArray(route.params.noteId)
  ? route.params.noteId[0]
  : route.params.noteId;
const gotoNoteEdit = () => {
  if (currentNoteId) {
    router.push({ name: 'note-edit', params: { noteId: currentNoteId } });
  }
};

const notesStore = useNotesStore();
const note = computed(() => notesStore.currentNote);

// 高度なMarkdownレンダラーのインスタンス
const markdownRenderer = new AdvancedMarkdownRenderer();

const renderedMarkdown = ref('');

// Markdownをレンダリングする関数
const renderMarkdown = async () => {
  if (!note.value || !note.value.body) {
    renderedMarkdown.value = '';
    return;
  }

  try {
    // 基本的なレンダリング
    const html = markdownRenderer.renderFull(note.value.body);
    renderedMarkdown.value = html;

    // DOM更新後にMermaid図表をレンダリング
    await nextTick();
    if (markdownContainer.value) {
      await markdownRenderer.renderMermaidDiagrams(markdownContainer.value);
    }
  } catch (error) {
    console.error('Markdown rendering error:', error);
    renderedMarkdown.value = '<p>Markdown rendering error</p>';
  }
};

//本分の一行目をタイトルとする
const displayedTitle = computed(() => {
  if (note.value && typeof note.value.body === 'string' && note.value.body.length > 0) {
    // textExtraction.tsのextractTitle関数を使用してMarkdown記号を適切に削除
    return extractTitle(note.value.body);
  }
  return '無題のノート'; //デフォルトタイトル
});

// ノートの内容が変更されたときにレンダリング
watch(
  note,
  () => {
    renderMarkdown();
  },
  { immediate: true }
);

onMounted(async () => {
  if (currentNoteId) {
    await notesStore.fetchNoteById(currentNoteId);
    await renderMarkdown();
  }
});
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

/* Markdown コンテンツの基本設定のみ */
.markdown-content {
  font-size: 1.1rem;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  margin: 1rem 0;
  border: 1px solid #ddd;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(table th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

.markdown-content :deep(table tr:nth-child(even)) {
  background-color: #f8f9fa;
}

.markdown-content :deep(table tr:hover) {
  background-color: #e9ecef;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .markdown-content {
    font-size: 1rem;
  }
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

<template>
  <div class="note-view">
    <div class="header-controls">
      <div class="note-info">
        <div class="note-channel">
          <span>channel: </span>
          <span class="note-channel">{{ note.channel }}</span>
        </div>
        <div class="note-tag">
          <span>tag: </span>
          <span class="note-tag">{{ note.tag }}</span>
        </div>
      </div>
      <div class="note-actions">
        <button @click="goToHome" class="note-action-button">ホームへ戻る</button>
        <button @click="gotoNoteEdit" class="note-action-button">編集</button>
      </div>
    </div>
    <h1 class="note-title">{{ note.title }}</h1>
    <div class="note-body" v-html="renderedMarkdown"></div>
  </div>
</template>

<script setup lang="ts">
import type { NoteSummary } from '@/types/api';
import { ref, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useRouter } from 'vue-router';

const router = useRouter();
const goToHome = () => {
  router.push({ name: 'home' });
};
const gotoNoteEdit = () => {
  router.push({ name: 'note-edit', params: { noteId: note.value.id } });
};

const renderedMarkdown = computed(() => {
  if (!note.value.summary) {
    return '';
  }
  // markedでMarkdownをHTMLに変換し、DOMPurifyでサニタイズする
  const rawHtml = marked(note.value.summary) as string;
  return DOMPurify.sanitize(rawHtml);
});

const note = ref<NoteSummary>({
  id: '0197882d-208b-7c5a-bf60-89eafb904109',
  permission: 'limited',
  channel: 'channel-1',
  tag: 'markdown, development',
  title: 'Markdownの使い方',
  summary:
    'Markdown は色々な事が出来ます。例えば、**太字**や*斜体*、[リンク](https://example.com)など。\nまた、コードブロックも使えます。\n```javascript\nconsole.log("Hello, World!");\n```\nさらに、リストも作成できます。\n- アイテム1\n- アイテム2\n- アイテム3',
  createdAt: 1750494000,
  updatedAt: 1750494000,
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

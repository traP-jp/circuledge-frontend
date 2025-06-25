<template>
  <div class="note-edit-view">
    <div class="menu">
      <div class="note-info-container">
        <div class="note-info">
          <label for="channel">channel</label>
          <input
            type="text"
            name="channel"
            id="channel"
            placeholder="#event/hackathon/25spring/16"
            v-model="editingNote.channel"
            :disabled="notesStore.loading"
          />
        </div>
        <!-- 必要かどうか、後で検討する -->
        <!-- <div class="note-info">
          <label for="tags">tags</label>
          <input
            type="text"
            name="tags"
            id="tags"
            placeholder="tag1,tag2,tag3,tagtag"
            v-model="noteTags"
            :disabled="notesStore.loading"
          />
        </div> -->
      </div>
      <div class="button-container">
        <button @click="handleCancel">キャンセル</button>
        <button @click="handleSave" :disabled="notesStore.loading">保存</button>
      </div>
    </div>
    <div class="editor-container">
      <div class="editor-pane">
        <div v-if="notesStore.loading" class="loading-overlay">
          <div class="loading-message">読み込み中...</div>
        </div>
        <div class="editor-content">
          <textarea
            placeholder="このノートは、Markdown 形式で入力できます。traQ のチャンネルと紐づけることで、ノートを簡単に管理できます。"
            v-model="editingNote.body"
            :disabled="notesStore.loading"
          ></textarea>
        </div>
      </div>
      <div class="preview-pane">
        <div class="preview-content">
          <div v-if="editingNote.body" v-html="renderedMarkdown"></div>
          <div v-else class="empty-preview">
            プレビューエリア<br />
            左側でMarkdownを入力すると、ここにリアルタイムでプレビューが表示されます。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 必要なものをインポートする
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 開発環境でのみデバッグログを出力するヘルパー関数
const debugLog = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(message, ...args);
  }
};

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();

/**
 * 編集ページのパス `/notes/:noteId/edit` にある `:noteId` を取得する
 * 現時点では `uuid-1` と `uuid-2`
 */
const noteId = route.params.noteId as string;
debugLog('noteId:', noteId);

/**
 * 編集中のノートデータ
 */
const editingNote = ref({
  body: '',
  channel: '',
  tags: '',
});

/**
 * 編集中のMarkdownをレンダリングした結果
 */
const renderedMarkdown = computed(() => {
  if (!editingNote.value.body) {
    return '';
  }

  // markedでMarkdownをHTMLに変換し、DOMPurifyでサニタイズする
  const rawHtml = marked(editingNote.value.body) as string;
  return DOMPurify.sanitize(rawHtml);
});

/**
 * 保存ボタンがクリックされた時の処理
 */
const handleSave = async () => {
  debugLog('handleSave: 保存処理開始');
  try {
    // store経由でノートを更新（コンフリクト処理を含む）
    await notesStore.updateNote(noteId, {
      body: editingNote.value.body,
    });

    debugLog('handleSave: 更新成功');
    // 編集中のデータをstoreのcurrentNoteに反映
    if (notesStore.currentNote) {
      notesStore.currentNote.body = editingNote.value.body;
      notesStore.currentNote.channel = editingNote.value.channel;
    }

    // ノート詳細画面に遷移
    router.push({ name: 'note-view', params: { noteId: noteId } });
  } catch (error) {
    debugLog('handleSave: エラーをキャッチ', error);
    debugLog('handleSave: conflictInfo:', notesStore.conflictInfo);

    // store経由でエラーハンドリングが行われるので、
    // コンフリクト情報がある場合はコンフリクト画面に遷移
    if (notesStore.conflictInfo) {
      debugLog('handleSave: コンフリクト画面に遷移します');
      router.push({ name: 'note-conflict', params: { noteId: noteId } });
      // コンフリクト画面への遷移後、古い情報を残さないようにリセット
      // 注意: 遷移先でconflictInfoが使用されるため、少し遅延してリセット
      setTimeout(() => {
        notesStore.clearConflictInfo();
      }, 100);
    } else {
      console.error('Failed to save note:', error);
    }
  }
};

/**
 * キャンセルボタンがクリックされた時の処理
 */
const handleCancel = () => {
  const result = confirm('未保存の内容が破棄されますが、よろしいですか？');
  if (result) {
    // OKが選択された場合、データを保存せずにノート詳細画面に遷移
    router.push({ name: 'note-view', params: { noteId: noteId } });
  }
  // キャンセルが選択された場合は何もしない（編集画面に残る）
};

// コンポーネントがマウントされたら、ノートを取得する
onMounted(async () => {
  if (noteId) {
    // ノート詳細を取得
    await notesStore.fetchNoteById(noteId);

    // 編集開始を記録（editingBaseRevisionを設定）
    notesStore.startEditing(noteId);

    // 取得したノートデータをeditingNoteに設定
    const currentNote = notesStore.currentNote;
    if (currentNote) {
      editingNote.value.body = currentNote.body || '';
      editingNote.value.channel = currentNote.channel || '';
      // タグの実装は後回し
      editingNote.value.tags = '';
    }
  }
});

// コンポーネントがアンマウントされたら、currentNoteのデータをクリアする
onUnmounted(() => {
  notesStore.currentNote = null;
});
</script>

<style scoped>
input {
  padding: 0.5em;
  width: 220px;
  font-size: 14px;
  border: 1px solid #bdbdbd;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
  position: relative;
}

input:focus {
  border-color: #58b582;
  background-color: #f6fff9;
}

input:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #e9ecef;
}

button {
  border-radius: 4px;
  border: 1px solid var(--border, #3f8d44);
  background: var(--background, #abd9ae);
  padding: 0.3em 1.4em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-edit-view {
  height: calc(100vh - 60px); /* Header分を引いた高さ */
  display: flex;
  flex-direction: column;
}

.menu {
  display: flex;
  justify-content: space-between;
  padding: 1em 4rem;
  flex-shrink: 0;
  height: auto;
}

.note-info {
  display: flex;
  margin: auto 0;
  align-items: center;
  gap: 1em;
}

.note-info-container {
  display: flex;
  gap: 2em;
}

.button-container {
  display: flex;
  gap: 2em;
  align-items: center;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-pane,
.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 2px solid #e0e0e0;
  overflow: hidden;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-message {
  padding: 1em 2em;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  color: #6c757d;
  font-size: 14px;
}

.editor-content {
  flex: 1;
  padding: 1em 0 1em 1em;
  overflow: hidden;
}

.editor-content textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Source Code Pro', Consolas, monaco, monospace;
  font-size: 14px;
  line-height: 1.5;
  background-color: transparent;
  overflow-y: auto;
  padding-right: 1em;
  box-sizing: border-box;
}

.editor-content textarea:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.preview-content {
  flex: 1;
  padding: 1em;
  background-color: #fff;
  overflow-y: auto;
}

.preview-content :deep(h1) {
  margin: 0 0 1em 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.preview-content :deep(h2) {
  margin: 1.5em 0 0.5em 0;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.preview-content :deep(p) {
  margin: 0 0 1em 0;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin: 0 0 1em 0;
  padding-left: 2em;
}

.preview-content :deep(li) {
  margin: 0.25em 0;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.preview-content :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Source Code Pro', Consolas, monaco, monospace;
  font-size: 13px;
}

.preview-content :deep(pre) {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin: 0 0 1em 0;
}

.preview-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  font-size: 13px;
  line-height: 1.4;
}

.preview-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  margin: 0 0 1em 0;
  padding-left: 1em;
  color: #666;
}

.preview-content :deep(blockquote p) {
  margin: 0;
}

.preview-content :deep(a) {
  color: #0066cc;
  text-decoration: underline;
}

.preview-content :deep(a:hover) {
  color: #0052a3;
}

.empty-preview {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 2em;
  line-height: 1.6;
}
</style>

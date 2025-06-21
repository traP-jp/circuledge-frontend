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
            v-model="noteChannel"
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
        <button>キャンセル</button>
        <button>保存</button>
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
            v-model="noteBody"
            :disabled="notesStore.loading"
          ></textarea>
        </div>
      </div>
      <div class="preview-pane">
        <div class="preview-content">
          <h1>Lorem ipsum</h1>
          <p>
            dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
            et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
            laboris nisi ut aliquip ex ea commodo consequat.
          </p>

          <h2>サブヘッダー</h2>

          <p><strong>太字のテキスト</strong>と<em>斜体のテキスト</em>の例です。</p>

          <ul>
            <li>リストアイテム1</li>
            <li>リストアイテム2</li>
            <li>リストアイテム3</li>
          </ul>

          <ol>
            <li>番号付きリスト1</li>
            <li>番号付きリスト2</li>
            <li>番号付きリスト3</li>
          </ol>

          <p><code>インラインコード</code>の例です。</p>

          <pre><code class="language-javascript">// コードブロックの例
function hello() {
  console.log("Hello, World!");
}</code></pre>

          <blockquote>
            <p>
              これは引用文です。<br />
              複数行にわたって書くことができます。
            </p>
          </blockquote>

          <p><a href="https://example.com">リンクの例</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 必要なものをインポートする
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNotesStore } from '@/stores/notes';

const route = useRoute();
const notesStore = useNotesStore();

/**
 * 編集ページのパス `/notes/:noteId/edit` にある `:noteId` を取得する
 * 現時点では `uuid-1` と `uuid-2`
 */
const noteId = route.params.noteId as string;
console.log(noteId);

/**
 * ノートの本文
 */
const noteBody = ref('');

/**
 * ノートが紐づけられたチャンネル
 */
const noteChannel = ref('');

/**
 * ノートに付与されたタグ
 */
const noteTags = ref('');

// currentNoteが変更されたときに、リアクティブ変数を更新する
watch(
  () => notesStore.currentNote,
  (newNote) => {
    if (newNote) {
      noteBody.value = newNote.body || '';
      noteChannel.value = newNote.channel || '';
      // タグの実装は後回し
      noteTags.value = '';

      // ちゃんと取得できているか確認
      console.log('noteBody updated:', noteBody.value);
      console.log('noteChannel updated:', noteChannel.value);
      console.log('noteTags updated:', noteTags.value);
    }
  },
  { immediate: true }
);

// コンポーネントがマウントされたら、ノートを取得する
onMounted(async () => {
  if (noteId) {
    // ノート一覧とノート詳細の両方を取得
    await Promise.all([notesStore.fetchNotes(), notesStore.fetchNoteById(noteId)]);
  }
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

.preview-content h1 {
  margin: 0 0 1em 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.preview-content h2 {
  margin: 1.5em 0 0.5em 0;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.preview-content p {
  margin: 0 0 1em 0;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.preview-content ul,
.preview-content ol {
  margin: 0 0 1em 0;
  padding-left: 2em;
}

.preview-content li {
  margin: 0.25em 0;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.preview-content code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
}

.preview-content pre {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin: 0 0 1em 0;
}

.preview-content pre code {
  background-color: transparent;
  padding: 0;
  font-size: 13px;
  line-height: 1.4;
}

.preview-content blockquote {
  border-left: 4px solid #ddd;
  margin: 0 0 1em 0;
  padding-left: 1em;
  color: #666;
}

.preview-content blockquote p {
  margin: 0;
}

.preview-content a {
  color: #0066cc;
  text-decoration: underline;
}

.preview-content a:hover {
  color: #0052a3;
}
</style>

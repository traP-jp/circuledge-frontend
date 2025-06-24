<template>
  <div class="note-edit-view">
    <div class="menu">
      <div class="note-info-container">
        <div class="note-info">
          <label for="channel">channel</label>
          <div class="channel-input-container">
            <input
              type="text"
              name="channel"
              id="channel"
              placeholder="#event/hackathon/25spring/16"
              v-model="editingNote.channel"
              :disabled="notesStore.loading"
              @focus="showChannelDropdown = true"
              @blur="hideChannelDropdown"
            />
            <div v-if="showChannelDropdown && filteredChannels.length > 0" class="channel-dropdown">
              <div class="dropdown-header">
                <small>{{
                  `${filteredChannels.length === 8 ? '8+' : filteredChannels.length}件のチャンネル`
                }}</small>
              </div>
              <div
                v-for="channel in filteredChannels"
                :key="channel.id"
                class="channel-option"
                :class="{ selected: channel.path === editingNote.channel }"
                @mousedown="selectChannel(channel.path)"
              >
                <span class="channel-path">{{ channel.path }}</span>
                <span class="channel-depth">深さ{{ channel.path.split('/').length }}</span>
              </div>
            </div>
          </div>
          <span
            v-if="displayChannelName && displayChannelName !== editingNote.channel"
            class="channel-display"
          >
            → {{ displayChannelName }}
          </span>
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

    <!-- 読み込み中の表示 -->
    <div v-if="notesStore.loading" class="loading-overlay">
      <div class="loading-message">読み込み中...</div>
    </div>

    <!-- CodiMDエディタ -->
    <div v-else class="editor-wrapper">
      <div class="editor-container">
        <!-- 編集エリア -->
        <div class="editor-pane">
          <div class="editor-content">
            <textarea
              ref="textareaRef"
              v-model="editingNote.body"
              :placeholder="editorPlaceholder"
              @input="handleInput"
              @keydown="handleKeydown"
              :disabled="notesStore.loading"
            ></textarea>
          </div>
        </div>

        <!-- プレビューエリア -->
        <div class="preview-pane">
          <div ref="previewContentRef" class="preview-content markdown-body" v-html="renderedContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 必要なものをインポートする
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { useChannelsStore } from '@/stores/channels';
import { updateNote, ConflictError } from '@/api/client';
import { AdvancedMarkdownRenderer } from '@/utils/advancedMarkdown';

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();
const channelsStore = useChannelsStore();

/**
 * 編集ページのパス `/notes/:noteId/edit` にある `:noteId` を取得する
 * 現時点では `uuid-1` と `uuid-2`
 */
const noteId = route.params.noteId as string;
console.log(noteId);

/**
 * 編集中のノートデータ
 */
const editingNote = ref({
  body: '',
  channel: '',
  tags: '',
});

// エディタ関連のリアクティブ変数
const textareaRef = ref<HTMLTextAreaElement>();
const previewContentRef = ref<HTMLDivElement>();
const currentLine = ref(1);
const currentColumn = ref(1);
const markdownRenderer = new AdvancedMarkdownRenderer();
const renderedContent = ref('');

// チャンネルサジェスト関連の変数
const showChannelDropdown = ref(false);

// チャンネル入力の候補リストをフィルタリング
const filteredChannels = computed(() => {
  if (!channelsStore.channels || !Array.isArray(channelsStore.channels)) {
    return [];
  }

  const query = editingNote.value.channel.toLowerCase();

  if (!query) {
    // 検索がない場合は、よく使われそうなトップレベルのチャンネルのみ表示
    return channelsStore.channels
      .filter((c) => !c.path.includes('/')) // 深さ1のみ
      .slice(0, 10); // 最大10件に制限
  }

  let results = [];

  if (query.includes('/')) {
    // `/` を含む場合: 深さとパスパターンによる検索
    const parts = query.split('/');
    const expectedDepth = parts.length;

    results = channelsStore.channels.filter((c) => {
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
    results = channelsStore.channels.filter((c) => {
      const path = c.path.toLowerCase();
      // 深さ1のチャンネルのみ（パスに '/' が含まれない）
      return !c.path.includes('/') && path.includes(query);
    });
  }

  // 結果を制限し、関連度順にソート
  return results
    .sort((a, b) => {
      const aPath = a.path.toLowerCase();
      const bPath = b.path.toLowerCase();

      // 完全一致が最優先
      if (aPath === query) return -1;
      if (bPath === query) return 1;

      // 先頭一致が次に優先
      if (aPath.startsWith(query) && !bPath.startsWith(query)) return -1;
      if (!aPath.startsWith(query) && bPath.startsWith(query)) return 1;

      // 短いパスを優先
      return aPath.length - bPath.length;
    })
    .slice(0, 8); // 最大8件に制限
});

// Markdownレンダリング関数
const renderMarkdown = async () => {
  try {
    const html = markdownRenderer.renderFull(editingNote.value.body);
    renderedContent.value = html;

    // DOM更新後にMermaid図表をレンダリング
    await nextTick();
    if (previewContentRef.value) {
      await markdownRenderer.renderMermaidDiagrams(previewContentRef.value);
    }
  } catch (error) {
    console.error('Markdown rendering error:', error);
    renderedContent.value = '<p>Markdown rendering error</p>';
  }
};

// 算出プロパティ
const displayChannelName = computed(() => {
  if (!editingNote.value.channel || !channelsStore.channels) {
    return '';
  }

  // チャンネルIDからチャンネルパスを検索
  const channel = channelsStore.channels.find((c) => c.id === editingNote.value.channel);

  // チャンネルが見つかった場合はパスを返す、見つからない場合は空文字
  return channel ? channel.path : '';
});

// const wordCount = computed(() => {
//   return editingNote.value.body.trim().split(/\s+/).filter(word => word.length > 0).length;
// });

/**
 * エディタのプレースホルダー
 */
const editorPlaceholder = computed(
  () =>
    `← ここにタイトルを入力
===
このノートは、Markdown 形式で入力できます。
traQ のチャンネルと紐づけることで、ノートを簡単に管理できます。`
);

// ウォッチャー
watch(
  () => editingNote.value.body,
  () => {
    renderMarkdown();
  },
  { immediate: true }
);

// エディタ関連のメソッド
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  updateCursorPosition(target);
};

const updateCursorPosition = (textarea: HTMLTextAreaElement) => {
  const cursorPos = textarea.selectionStart;
  const textBeforeCursor = textarea.value.substring(0, cursorPos);
  const lines = textBeforeCursor.split('\n');

  currentLine.value = lines.length;
  currentColumn.value = lines[lines.length - 1].length + 1;
};

const insertText = (text: string) => {
  if (!textareaRef.value) return;

  const textarea = textareaRef.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const newContent =
    editingNote.value.body.substring(0, start) + text + editingNote.value.body.substring(end);

  editingNote.value.body = newContent;

  nextTick(() => {
    textarea.focus();
    const newCursorPos = start + text.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  });
};

const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+S で保存を無効化
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    return false;
  }

  // Tab キー処理
  if (event.key === 'Tab') {
    event.preventDefault();
    insertText('    '); // 4スペース
  }

  // Ctrl+B で太字
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault();
    insertText('**太字**');
  }

  // Ctrl+I で斜体
  if (event.ctrlKey && event.key === 'i') {
    event.preventDefault();
    insertText('*斜体*');
  }
};

// チャンネルサジェスト関連の関数
const selectChannel = (channelPath: string) => {
  editingNote.value.channel = channelPath;
  showChannelDropdown.value = false;
};

const hideChannelDropdown = () => {
  // 少し遅延させてクリックイベントを処理できるようにする
  setTimeout(() => {
    showChannelDropdown.value = false;
  }, 150);
};

// 同期スクロール（現在は使用していない）
// let isScrollingSyncronously = false;

/**
 * 保存ボタンがクリックされた時の処理
 */
const handleSave = async () => {
  try {
    // 現在のノートの情報を取得
    const currentNote = notesStore.currentNote;
    if (!currentNote) {
      console.error('Current note not found');
      return;
    }

    // ノートを更新
    await updateNote(noteId, {
      body: editingNote.value.body,
      channel: editingNote.value.channel,
      revision: currentNote.revision,
      permission: currentNote.permission,
    });

    // 編集中のデータをstoreのcurrentNoteに反映
    if (notesStore.currentNote) {
      notesStore.currentNote.body = editingNote.value.body;
      notesStore.currentNote.channel = editingNote.value.channel;
    }

    // ノート詳細画面に遷移
    router.push({ name: 'note-view', params: { noteId: noteId } });
  } catch (error) {
    if (error instanceof ConflictError) {
      // 編集競合が発生したときは、:noteId/conflict へ遷移
      router.push({ name: 'note-conflict', params: { noteId: noteId } });
    } else {
      // conflict 以外のエラーはコンソールへ
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
  // チャンネル一覧を取得
  await channelsStore.fetchChannels();

  if (noteId) {
    // ノート詳細を取得
    await notesStore.fetchNoteById(noteId);

    // 取得したノートデータをeditingNoteに設定
    const currentNote = notesStore.currentNote;
    if (currentNote) {
      editingNote.value.body = currentNote.body || '';
      editingNote.value.channel = currentNote.channel || '';
      // タグの実装は後回し
      editingNote.value.tags = '';

      // ちゃんと取得できているか確認
      // console.log('editingNote.body updated:', editingNote.value.body);
      // console.log('editingNote.channel updated:', editingNote.value.channel);
      // console.log('editingNote.tags updated:', editingNote.value.tags);
    }
  }

  // textareaの初期化
  if (textareaRef.value) {
    updateCursorPosition(textareaRef.value);
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
  height: calc(100vh - 120px); /* ビューポート全体の高さ */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 画面全体のスクロールを防ぐ */
}

.menu {
  display: flex;
  justify-content: space-between;
  padding: 1em 4rem;
  flex-shrink: 0;
  height: 80px;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
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

.editor-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0; /* Flexboxでの縮小を許可 */
  display: flex;
  flex-direction: column;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
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
  background-color: #f8f9fa;
  padding: 3px 6px;
  border-radius: 4px;
  font-family: 'Source Code Pro', Consolas, monaco, monospace;
  font-size: 14px;
  color: #d73a49;
  border: 1px solid #e1e4e8;
}

.preview-content :deep(pre) {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid #e1e4e8;
  color: #24292e;
}

.preview-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 1.45;
  color: inherit;
  border: none;
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

.preview-content :deep(table) {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  margin: 1rem 0;
  border: 1px solid #ddd;
}

.preview-content :deep(table th),
.preview-content :deep(table td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.preview-content :deep(table th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

.preview-content :deep(table tr:nth-child(even)) {
  background-color: #f8f9fa;
}

.preview-content :deep(table tr:hover) {
  background-color: #e9ecef;
}

/* 詳細ブロックのスタイル */
.preview-content :deep(.markdown-details) {
  border: 1px solid #e1e4e8;
  border-radius: 0.375rem;
  margin: 1rem 0;
  overflow: hidden;
}

.preview-content :deep(.markdown-summary) {
  background-color: #f6f8fa;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 600;
  color: #24292f;
  user-select: none;
  list-style: none;
  display: block;
  width: 100%;
  text-align: left;
  outline: none;
}

.preview-content :deep(.markdown-summary:hover) {
  background-color: #f1f3f4;
}

.preview-content :deep(.markdown-summary::marker) {
  display: none;
}

.preview-content :deep(.markdown-summary::-webkit-details-marker) {
  display: none;
}

.preview-content :deep(.markdown-details-content) {
  padding: 1rem;
  border-top: 1px solid #e1e4e8;
}

/* 注記ブロックのスタイル */
.preview-content :deep(.markdown-note) {
  border-left: 4px solid;
  border-radius: 0.375rem;
  margin: 1rem 0;
  overflow: hidden;
}

.preview-content :deep(.markdown-note-info) {
  border-left-color: #0969da;
  background-color: #dbeafe;
}

.preview-content :deep(.markdown-note-warn) {
  border-left-color: #d1a317;
  background-color: #fef3c7;
}

.preview-content :deep(.markdown-note-alert) {
  border-left-color: #cf222e;
  background-color: #fecaca;
}

.preview-content :deep(.markdown-note-success) {
  border-left-color: #1a7f37;
  background-color: #d1fae5;
}

.preview-content :deep(.markdown-note-error) {
  border-left-color: #cf222e;
  background-color: #fecaca;
}

.preview-content :deep(.markdown-note-tip) {
  border-left-color: #8250df;
  background-color: #ede9fe;
}

.preview-content :deep(.markdown-note-title) {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.preview-content :deep(.markdown-note-content) {
  padding: 1rem;
}

/* ファイル名付きコードブロックのスタイル */
.preview-content :deep(.markdown-code-block) {
  margin: 1rem 0;
  border: 1px solid #e1e4e8;
  border-radius: 0.375rem;
  overflow: hidden;
}

.preview-content :deep(.markdown-code-filename) {
  background-color: #f6f8fa;
  padding: 0.5rem 1rem;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: 0.875rem;
  color: #656d76;
  border-bottom: 1px solid #e1e4e8;
}

.preview-content :deep(.markdown-code-block pre) {
  margin: 0;
  border-radius: 0;
  border: none;
}

.empty-preview {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 2em;
  line-height: 1.6;
}

.channel-display {
  margin-left: 0.5em;
  color: #666;
  font-size: 0.9em;
  font-style: italic;
  font-weight: 500;
  background-color: #f0f8ff;
  padding: 0.2em 0.5em;
  border-radius: 3px;
  border: 1px solid #d0e8ff;
}

.channel-input-container {
  position: relative;
  display: inline-block;
}

.channel-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-header {
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 12px;
  color: #6c757d;
}

.channel-option {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.channel-option:hover {
  background-color: #f8f9fa;
}

.channel-option.selected {
  background-color: #e3f2fd;
}

.channel-path {
  font-weight: 500;
  color: #333;
}

.channel-depth {
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
}
</style>

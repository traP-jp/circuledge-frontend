<template>
  <div class="note-conflict-view">
    <div class="menu">
      <div class="note-info-container"></div>
      <div class="button-container">
        <button @click="handleCancel">キャンセル</button>
        <button @click="handleSave" :disabled="notesStore.loading">マージして保存</button>
      </div>
    </div>
    <div class="editor-container">
      <!-- 編集中にサーバーで更新された内容 -->
      <div class="editor-pane">
        <div class="pane-header">編集中にサーバーで更新された内容</div>
        <div class="editor-content">
          <textarea
            :value="serverUpdates"
            readonly
            placeholder="編集中に他のユーザーが行った変更"
          ></textarea>
        </div>
      </div>

      <!-- マージした編集データ -->
      <div class="editor-pane">
        <div class="pane-header">マージ</div>
        <div class="editor-content">
          <textarea
            v-model="mergedData.body"
            placeholder="マージした結果を編集してください"
            :disabled="notesStore.loading"
          ></textarea>
        </div>
      </div>

      <!-- 自分が編集したデータ -->
      <div class="editor-pane">
        <div class="pane-header">自分の編集データ</div>
        <div class="editor-content">
          <textarea :value="editedData.body" readonly placeholder="自分が編集したデータ"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { updateNote, ConflictError } from '@/api/client';

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();

/**
 * 編集ページのパス `/notes/:noteId/conflict` にある `:noteId` を取得する
 */
const noteId = route.params.noteId as string;

/**
 * 編集中にサーバーで更新された内容（diff形式、storeから取得）
 */
const serverUpdates = computed(() => notesStore.conflictInfo?.diff || '');

/**
 * 自分が編集したデータ（storeから取得）
 */
const editedData = computed(() => ({
  body: notesStore.conflictInfo?.userEditedContent || '',
  channel: notesStore.conflictInfo?.baseRevision.channel || '',
}));

/**
 * マージした編集データ（編集可能）
 */
const mergedData = ref({
  body: '',
  channel: '',
});

/**
 * storeのconflictInfoが変更された時にマージデータの初期値を設定
 */
watch(
  () => notesStore.conflictInfo,
  (conflictInfo) => {
    if (conflictInfo) {
      // マージデータの初期値（自分が編集したデータをベースにする）
      mergedData.value = {
        body: conflictInfo.userEditedContent,
        channel: conflictInfo.baseRevision.channel,
      };
    }
  },
  { immediate: true }
);

/**
 * マージして保存ボタンがクリックされた時の処理
 */
const handleSave = async () => {
  if (!notesStore.conflictInfo) {
    alert('コンフリクト情報が見つかりません。');
    return;
  }

  try {
    // マージした内容でノートを更新
    await updateNote(noteId, {
      body: mergedData.value.body,
      channel: mergedData.value.channel,
      revision: notesStore.conflictInfo.latestRevision.revision,
      permission: notesStore.conflictInfo.latestRevision.permission,
    });

    // 編集中のデータをstoreのcurrentNoteに反映
    if (notesStore.currentNote) {
      notesStore.currentNote.body = mergedData.value.body;
      notesStore.currentNote.channel = mergedData.value.channel;
      // revisionは新しいUUIDが返されるため、APIレスポンスから取得する必要がある
      // 現在は仮の処理として、既存のrevisionをそのまま使用
    }

    // コンフリクト情報をクリア
    notesStore.clearConflictInfo();

    // ノート詳細画面に遷移
    router.push({ name: 'note-view', params: { noteId: noteId } });
  } catch (error) {
    if (error instanceof ConflictError) {
      // 再度競合が発生した場合
      alert('再度コンフリクトが発生しました。コンフリクトを解消してください');

      // 新しいコンフリクト情報でストアを更新
      if (notesStore.conflictInfo) {
        // 現在のマージ内容をユーザー編集内容として保存し、新しいコンフリクト情報を作成
        const updatedConflictInfo = {
          ...notesStore.conflictInfo,
          // 今回マージしようとした内容を新しいユーザー編集内容とする
          userEditedContent: mergedData.value.body,
          // 最新のサーバー情報に更新
          latestRevision: {
            revision: error.data['latest-revision'],
            channel: error.data.channel,
            permission: error.data.permission,
          },
          // 新しいdiff情報を設定
          diff: error.data.diff || '',
        };

        // ストアのコンフリクト情報を更新
        notesStore.conflictInfo = updatedConflictInfo;
      }

      // 現在のページに留まり、新しいコンフリクト情報でUIを更新
      // router.push({ name: 'note-conflict', params: { noteId: noteId } }); は不要
    } else {
      console.error('Failed to save merged note:', error);
      alert('保存に失敗しました。');
    }
  }
};

/**
 * キャンセルボタンがクリックされた時の処理
 */
const handleCancel = () => {
  const result = confirm('編集競合の解決をキャンセルしますか？ノート詳細画面に戻ります。');
  if (result) {
    // コンフリクト情報をクリア
    notesStore.clearConflictInfo();
    router.push({ name: 'note-view', params: { noteId: noteId } });
  }
};

// コンポーネントがマウントされたら、コンフリクト情報を確認する
onMounted(async () => {
  if (noteId) {
    // 現在のノート情報を取得
    await notesStore.fetchNoteById(noteId);

    // コンフリクト情報が存在しない場合はノート詳細画面に戻る
    if (!notesStore.conflictInfo) {
      console.warn('No conflict info found, redirecting to note view');
      router.push({ name: 'note-view', params: { noteId: noteId } });
    }
  }
});

// コンポーネントがアンマウントされたら、データをクリアする
onUnmounted(() => {
  notesStore.currentNote = null;
});
</script>

<style scoped>
button {
  border-radius: 4px;
  border: 1px solid var(--border, #3f8d44);
  background: var(--background, #abd9ae);
  padding: 0.3em 1.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #9ed1a2;
}

button:disabled {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #e9ecef;
}

.note-conflict-view {
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

.button-container {
  display: flex;
  gap: 1em;
  align-items: center;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 2px solid #e0e0e0;
  overflow: hidden;
  position: relative;
}

.editor-pane:last-child {
  border-right: none;
}

.pane-header {
  padding: 0.75em 1em;
  background-color: #f1f3f4;
  border-bottom: 1px solid #e0e0e0;
  font-weight: bold;
  font-size: 14px;
  color: #333;
  text-align: center;
}

.editor-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.editor-content textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Source Code Pro', Consolas, monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  background-color: transparent;
  overflow-y: auto;
  padding: 1em;
  box-sizing: border-box;
  margin: 0;
}

.editor-content textarea:read-only {
  background-color: #f8f9fa;
  color: #495057;
}

.editor-content textarea:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.editor-content textarea:focus:not(:read-only) {
  background-color: #fff;
  box-shadow: inset 0 0 0 2px #58b582;
}
</style>

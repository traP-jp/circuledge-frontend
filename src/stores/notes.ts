import { ref } from 'vue';
import { defineStore } from 'pinia';
import type {
  NoteSummary,
  NoteRevision,
  UUID,
  PutNoteRequest,
  NotePermission,
  GetNotesRequestParams,
} from '@/types/api';

// 開発環境でのみデバッグログを出力するヘルパー関数
const debugLog = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(message, ...args);
  }
};
import {
  getNotes,
  getNote,
  updateNote as apiUpdateNote,
  createNote,
  ConflictError,
} from '@/api/client';
import type { Router } from 'vue-router';

/** ストア内で使用するコンフリクト情報の型 */
interface ConflictInfo {
  /** ユーザーが編集開始時のベースrevision (例: revision A) */
  baseRevision: NoteRevision;
  /** サーバーの最新revision (例: revision B) */
  latestRevision: {
    revision: UUID;
    channel: UUID;
    permission: NotePermission;
  };
  /** ユーザーが編集した内容 */
  userEditedContent: string;
  /** baseRevision と latestRevision の差分 (A → Bの diff) */
  diff: string;
  /** 対象ノートのID */
  noteId: UUID;
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<NoteSummary[]>([]);
  const currentNote = ref<NoteRevision | null>(null);
  /** 編集開始時のベースrevision（コンフリクト解決で使用） */
  const editingBaseRevision = ref<NoteRevision | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  /** コンフリクト情報 */
  const conflictInfo = ref<ConflictInfo | null>(null);

  /**
   * ノートの一覧を取得する
   */
  async function fetchNotes(params: GetNotesRequestParams = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await getNotes(params); // パラメータを渡す
      notes.value = response.notes;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch notes';
    } finally {
      loading.value = false;
    }
  }

  /**
   * 指定したIDのノート詳細を取得する
   * @param id - ノートのUUID
   */
  async function fetchNoteById(id: UUID) {
    loading.value = true;
    error.value = null;
    try {
      currentNote.value = await getNote(id); // apiClient.getNote(id) -> getNote(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : `Failed to fetch note ${id}`;
      currentNote.value = null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * ノート編集開始時に呼び出す（ベースrevisionを保存）
   * @param id - ノートのUUID
   */
  async function startEditing(id: UUID) {
    debugLog('store startEditing: 開始', { id });
    await fetchNoteById(id);
    if (currentNote.value) {
      // 編集開始時のrevisionを保存
      editingBaseRevision.value = { ...currentNote.value };
      debugLog('store startEditing: editingBaseRevision設定完了', {
        revision: editingBaseRevision.value.revision,
      });
    } else {
      debugLog('store startEditing: currentNoteがnull');
    }
  }

  /**
   * 指定したIDのノートを更新する
   * @param id - ノートのUUID
   * @param payload - 更新するデータ (`body` または `permission`)
   */
  async function updateNote(id: UUID, payload: Partial<Pick<NoteRevision, 'body' | 'permission'>>) {
    debugLog('store updateNote: 開始', { id, payload });

    if (!currentNote.value?.revision) {
      error.value = '現在のノートのリビジョン情報がありません。';
      debugLog('store updateNote: リビジョン情報なしエラー');
      return;
    }

    loading.value = true;
    error.value = null;

    // APIリクエスト用のペイロードを作成（スコープを広げる）
    const requestPayload: PutNoteRequest = {
      revision: currentNote.value.revision,
      channel: currentNote.value.channel,
      permission: payload.permission ?? currentNote.value.permission,
      body: payload.body ?? currentNote.value.body,
    };

    debugLog('store updateNote: リクエストペイロード', requestPayload);

    try {
      // updateNoteがストアのアクション名と重複するため、apiUpdateNoteとしてインポート
      await apiUpdateNote(id, requestPayload);

      debugLog('store updateNote: API呼び出し成功');
      // 更新が成功したら、最新のノート情報を再取得してローカルの状態を同期するのが最も安全
      await fetchNoteById(id);
      await fetchNotes(); // ノート一覧のサマリーなども更新するため
    } catch (e) {
      debugLog('store updateNote: API呼び出しエラー', e);

      if (e instanceof ConflictError) {
        debugLog('store updateNote: ConflictErrorをキャッチ', e.data);
        error.value = `${e.message} サーバー上の最新のノート内容を確認してください。`;
        // 409レスポンスのデータを使用してコンフリクト情報を構築
        if (editingBaseRevision.value) {
          conflictInfo.value = {
            baseRevision: editingBaseRevision.value,
            latestRevision: {
              revision: e.data['latest-revision'],
              channel: e.data.channel,
              permission: e.data.permission,
            },
            userEditedContent: requestPayload.body,
            diff: e.data.diff || '',
            noteId: id,
          };
          debugLog('store updateNote: conflictInfo設定完了', conflictInfo.value);
        } else {
          error.value = '編集開始時の情報が不足しているため、コンフリクト解決ができません。';
          debugLog('store updateNote: editingBaseRevision不足');
        }
        // ConflictErrorを再スローして、呼び出し元がキャッチできるようにする
        throw e;
      } else if (e instanceof Error) {
        error.value = e.message;
        throw e;
      } else {
        error.value = `Failed to update note ${id}`;
        throw new Error(`Failed to update note ${id}`);
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * コンフリクト情報をクリアする
   * コンフリクト解決後や編集セッション終了時に呼び出す
   */
  function clearConflictInfo() {
    conflictInfo.value = null;
    editingBaseRevision.value = null;
    error.value = null;
  }

  /**
   * 新規ノートを作成し、編集ページに遷移する
   */
  async function createNoteAndNavigate(router: Router) {
    loading.value = true;
    error.value = null;
    try {
      const response = await createNote();
      // 作成したノートの編集ページに遷移
      router.push(`/notes/${response.id}/edit`);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create note';
    } finally {
      loading.value = false;
    }
  }

  /**
   * ストアの状態をリセットする
   */
  function $reset() {
    notes.value = [];
    currentNote.value = null;
    loading.value = false;
    error.value = null;
    editingBaseRevision.value = null;
    conflictInfo.value = null;
  }

  return {
    notes,
    currentNote,
    loading,
    error,
    conflictInfo,
    fetchNotes,
    fetchNoteById,
    startEditing,
    updateNote,
    clearConflictInfo,
    createNoteAndNavigate,
    $reset,
  };
});

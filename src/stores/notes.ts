import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { NoteSummary, NoteRevision, UUID, PutNoteRequest } from '@/types/api';
import { getNotes, getNote, updateNote as apiUpdateNote, ConflictError } from '@/api/client';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<NoteSummary[]>([]);
  const currentNote = ref<NoteRevision | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * ノートの一覧を取得する
   */
  async function fetchNotes() {
    loading.value = true;
    error.value = null;
    try {
      const response = await getNotes(); // apiClient.getNotes() -> getNotes()
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
   * 指定したIDのノートを更新する
   * @param id - ノートのUUID
   * @param payload - 更新するデータ (`body` または `permission`)
   */
  async function updateNote(id: UUID, payload: Partial<Pick<NoteRevision, 'body' | 'permission'>>) {
    if (!currentNote.value?.revision) {
      error.value = '現在のノートのリビジョン情報がありません。';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // APIリクエスト用のペイロードを作成
      const requestPayload: PutNoteRequest = {
        revision: currentNote.value.revision,
        channel: currentNote.value.channel,
        permission: payload.permission ?? currentNote.value.permission,
        body: payload.body ?? currentNote.value.body,
      };

      // updateNoteがストアのアクション名と重複するため、apiUpdateNoteとしてインポート
      await apiUpdateNote(id, requestPayload);

      // 更新が成功したら、最新のノート情報を再取得してローカルの状態を同期するのが最も安全
      await fetchNoteById(id);
      await fetchNotes(); // ノート一覧のサマリーなども更新するため
    } catch (e) {
      if (e instanceof ConflictError) {
        error.value = `${e.message} サーバー上の最新のノート内容を確認してください。`;
        // 必要であれば、e.data (サーバーからの最新情報) を使ってUIを更新するなどの対応が考えられます
      } else if (e instanceof Error) {
        error.value = e.message;
      } else {
        error.value = `Failed to update note ${id}`;
      }
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
  }

  return {
    notes,
    currentNote,
    loading,
    error,
    fetchNotes,
    fetchNoteById,
    updateNote,
    $reset,
  };
});

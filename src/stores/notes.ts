import { ref } from 'vue';
import { defineStore } from 'pinia';
import type {
  NoteSummary,
  NoteRevision,
  UUID,
  PutNoteRequest,
  PutNoteConflictResponse,
} from '@/types/api';
import {
  getNotes,
  getNote,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  ApiError,
  ConflictError,
} from '@/api/client';
import { useRouter } from 'vue-router';

export const useNotesStore = defineStore('notes', () => {
  const router = useRouter();

  // --- State ---
  const notes = ref<NoteSummary[]>([]);
  const currentNote = ref<NoteRevision | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  /** 編集競合が発生した際のサーバーからの情報 */
  const conflict = ref<PutNoteConflictResponse | null>(null);

  // --- Actions ---

  /**
   * ノートのリストを取得します。
   */
  async function fetchNotes() {
    loading.value = true;
    error.value = null;
    try {
      const response = await getNotes();
      notes.value = response.notes;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * IDを指定して単一のノートを取得します。
   * @param id ノートのUUID
   */
  async function fetchNote(id: UUID) {
    loading.value = true;
    error.value = null;
    currentNote.value = null;
    try {
      const note = await getNote(id);
      currentNote.value = note;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 新しいノートを作成し、作成されたノートの編集画面に遷移します。
   */
  async function createNote() {
    loading.value = true;
    error.value = null;
    try {
      const newNote = await apiCreateNote();
      // 作成成功後、ノートリストを更新し、新しいノートのページに遷移する
      await fetchNotes();
      router.push({ name: 'note-editor', params: { id: newNote.id } });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * ノートを保存（更新）します。
   * @param noteId 更新するノートのID
   * @param payload 更新内容
   * @returns 成功した場合は `true`、失敗した場合は `false` を返す
   */
  async function saveNote(noteId: UUID, payload: PutNoteRequest): Promise<boolean> {
    loading.value = true;
    error.value = null;
    conflict.value = null; // 前回の競合情報をクリア

    try {
      await apiUpdateNote(noteId, payload);
      // 更新が成功したら、最新のノート情報を再取得する
      await fetchNote(noteId);
      // ノートリストのサマリーも更新されている可能性があるのでリストも更新
      await fetchNotes();
      return true;
    } catch (e) {
      if (e instanceof ConflictError) {
        // 編集競合エラーの場合は、専用のstateに競合情報を格納
        console.error('Conflict detected:', e.data);
        error.value = e.message;
        conflict.value = e.data;
      } else {
        error.value = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(e);
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    notes,
    currentNote,
    loading,
    error,
    conflict,
    // Actions
    fetchNotes,
    fetchNote,
    createNote,
    saveNote,
  };
});

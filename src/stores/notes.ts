import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getNotes, createNote } from '@/api/client';
import type { NoteSummary, GetNotesRequestParams } from '@/types/api';
import type { Router } from 'vue-router';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<NoteSummary[]>([]);
  const totalNotes = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * APIからノート一覧を取得します。
   * @param params - フィルタリングやソートのためのパラメータ
   */
  async function fetchNotes(params: GetNotesRequestParams = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await getNotes(params);
      notes.value = response.notes;
      totalNotes.value = response.total;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred';
    } finally {
      loading.value = false;
    }
  }

  /**
   * 新しいノートを作成し、編集ページに遷移します。
   * @param router - ページ遷移に使用するVue Routerのインスタンス
   */
  async function createNoteAndNavigate(router: Router) {
    loading.value = true;
    error.value = null;
    try {
      // APIを呼び出して新規ノートを作成
      const newNote = await createNote();
      // 成功したら、返ってきたIDを使って編集ページへ遷移
      router.push(`/notes/${newNote.id}/edit`);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred';
    } finally {
      loading.value = false;
    }
  }

  return {
    notes,
    totalNotes,
    loading,
    error,
    fetchNotes,
    createNoteAndNavigate,
  };
});

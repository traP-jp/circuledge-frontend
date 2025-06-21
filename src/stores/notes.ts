import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { NoteSummary, NoteRevision, UUID } from '@/types/api';
// import { apiClient } from '@/api/client' // APIクライアントを想定

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<NoteSummary[]>([]);
  const currentNote = ref<NoteRevision | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // モックデータを一時的に使用
  const mockNotes: NoteSummary[] = [
    {
      id: 'uuid-1',
      channel: 'channel-1',
      permission: 'public',
      title: 'First Note',
      summary: 'This is the first note.',
      tag: 'tech',
      createdAt: Date.now() - 100000,
      updatedAt: Date.now() - 50000,
    },
    {
      id: 'uuid-2',
      channel: 'channel-1',
      permission: 'private',
      title: 'Second Note',
      summary: 'This is the second note.',
      tag: 'life',
      createdAt: Date.now() - 200000,
      updatedAt: Date.now() - 150000,
    },
  ];

  const mockRevision: NoteRevision = {
    revision: 'rev-uuid-1',
    channel: 'channel-1',
    permission: 'public',
    body: 'This is the full content of the first note.',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 50000,
  };

  async function fetchNotes() {
    loading.value = true;
    error.value = null;
    try {
      // notes.value = (await apiClient.getNotes()).notes
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
      notes.value = mockNotes;
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchNoteById(id: UUID) {
    loading.value = true;
    error.value = null;
    try {
      // currentNote.value = await apiClient.getNote(id)
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
      const noteSummary = mockNotes.find((n) => n.id === id);
      if (noteSummary) {
        currentNote.value = { ...mockRevision, body: `Full content for ${noteSummary.title}` };
      } else {
        currentNote.value = null;
      }
    } catch (e) {
      error.value = (e as Error).message;
      currentNote.value = null;
    } finally {
      loading.value = false;
    }
  }

  return { notes, currentNote, loading, error, fetchNotes, fetchNoteById };
});

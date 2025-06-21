import { createRouter, createWebHistory } from 'vue-router';
import NoteListView from '../views/NoteListView.vue';
import NoteEditView from '../views/NoteEditView.vue';
import NoteView from '../views/NoteView.vue';
import NoteConflictView from '../views/NoteConflictView.vue';
import SettingsView from '../views/SettingsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/notes',
    },
    {
      path: '/notes',
      name: 'note-list',
      component: NoteListView,
    },
    {
      path: '/notes/:noteId/edit',
      name: 'note-edit',
      component: NoteEditView,
    },
    {
      path: '/notes/:noteId/view',
      name: 'note-view',
      component: NoteView,
    },
    {
      path: '/notes/:noteId/conflict',
      name: 'note-conflict',
      component: NoteConflictView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
});

export default router;

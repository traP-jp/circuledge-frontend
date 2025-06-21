import { createRouter, createWebHistory } from 'vue-router'
import NoteListView from '../views/NoteListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/notes'
    },
    {
      path: '/notes',
      name: 'note-list',
      component: NoteListView
    },
    {
      path: '/notes/:noteId/edit',
      name: 'note-edit',
      component: () => import('../views/NoteEditView.vue')
    },
    {
      path: '/notes/:noteId/view',
      name: 'note-view',
      component: () => import('../views/NoteView.vue')
    },
    {
      path: '/notes/:noteId/conflict',
      name: 'note-conflict',
      component: () => import('../views/NoteConflictView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    }
  ]
})

export default router

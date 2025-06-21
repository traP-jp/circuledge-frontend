<template>
  <h1>Note View</h1>
  <div v-if="note">
    <div class="note-content">
      <h2>Revision: {{ note.revision }}</h2>
      <p><strong>Channel:</strong> {{ note.channel }}</p>
      <p><strong>Permission:</strong> {{ note.permission }}</p>
      <div class="note-body" v-html="note.body"></div>

    </div>

  </div>
</template>

<script setup lang="ts">
import{ref, onMounted} from 'vue';
import { useRoute } from 'vue-router';

interface Note {
  revision: string;,
  channel: string;,
  permission: string;,
  body: string;
}

const note = ref<Note>({
  revision: '',
  channel: '',
  permission: '',
  body: ''
});





</script>


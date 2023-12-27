<template>
       <div class="flex justify-center">
              <h2>Notes in the "{{ folderName }}" folder</h2>
       </div>

       <div class="flex flex-wrap justify-center mt4">
              <div class="notes-list flex flex-row items-start justify-center flex-wrap">
                     <div class="note flex justify-center" v-for="note in filteredNotes" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>
       </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNotesStore } from '@/stores/notesStore';
import Note from '@/components/Note.vue';
import type { NoteType } from '@/types/Note';

const route = useRoute();
const notesStore = useNotesStore();
notesStore.fetchAndStoreNotes();
// Dynamically update folderName when the route changes
const folderName = computed(() => route.params.tagName as string);

// Watch for route changes
watch(route, (newRoute, oldRoute) => {
       // You can perform additional actions here if needed
       // For example, fetch and store notes based on the new folderName
       notesStore.fetchAndStoreNotes();
});

const filteredNotes = computed<NoteType[]>(() => {
       return notesStore.notes.filter(note => note.folderId === folderName.value);
});

console.log('Filtered Notes:', filteredNotes.value);
</script>

<template>
       <div class="flex flex-wrap justify-center">
              <div class="notes-list flex flex-row items-start justify-center flex-wrap">
                     <div class="note">
                            <NewNote />
                     </div>
                     <div class="note flex justify-center" v-for="note in notes" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>
       </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import NewNote from '@/components/NewNote.vue';
import Note from '@/components/Note.vue';
import { useNotesStore } from '@/stores/notesStore';
import type { NoteType } from '@/types/Note';

const notesStore = useNotesStore();
notesStore.fetchAndStoreNotes();

// Explicitly set the type of 'notes' computed property
const notes = computed<NoteType[]>(() => notesStore.notes);
</script>

<style scoped>

.note {
       padding: 10px;
       margin: 10px;
       min-width: calc(25% - 20px);
}
</style>

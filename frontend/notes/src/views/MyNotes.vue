<template>
       <div class="flex flex-wrap justify-center">
              <!-- <div class="note-item">
                     <NewNote />
              </div> -->
              <div class="note-item" v-for="note in notes" :key="note.id">
                     <Note :note="note" />
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
.note-item {
       padding: 10px;
       margin: 10px;
       /* This adds margin around each note item */
       min-width: calc(25% - 20px);
       display: flex;
       justify-content: center;
       /* Adjust the min-width calculation if necessary */
       /* rest of your styles */

}
</style>

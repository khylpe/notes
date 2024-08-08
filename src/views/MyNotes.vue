<template>
       <div class="flex flex-wrap justify-center mt-4">
              <div class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div class="note flex justify-center" v-for="note in notes" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>
       </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Note from '@/components/Note.vue';
import { useNotesStore } from '@/stores/notesStore';
import type { NoteType } from '@/types/Note';

const notesStore = useNotesStore();
notesStore.fetchAndStoreNotes();

// Filter notes that don't have a folder assigned (folderId is null)
const notes = computed<NoteType[]>(() => {
       return notesStore.notes.filter(note => note.folderId === null);
});
</script>

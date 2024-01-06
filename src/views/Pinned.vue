<template>
       <div class="flex flex-wrap justify-center mt4">
              <div class="notes-list flex flex-row items-start justify-center flex-wrap">
                     <div class="note flex justify-center" v-for="note in notes" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>
       </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import Note from '@/components/Note.vue';
import { useNotesStore } from '@/stores/notesStore';
import type { NoteType } from '@/types/Note';

const notesStore = useNotesStore();
notesStore.fetchAndStoreNotes();

// Filter by pinned notes
const notes = computed<NoteType[]>(() => {
       return notesStore.notes.filter(note => note.isPinned);
});

</script>
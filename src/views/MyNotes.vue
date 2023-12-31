<template>
       <div class="flex justify-center">
              <SearchBar />
       </div>

       <div class="flex flex-wrap justify-center mt4">
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
import SearchBar from '@/components/SearchBar.vue';

const notesStore = useNotesStore();
notesStore.fetchAndStoreNotes();

// Filter notes that don't have a folder assigned (folderId is null)
const notes = computed<NoteType[]>(() => {
       return notesStore.notes.filter(note => note.folderId === null);
});
</script>

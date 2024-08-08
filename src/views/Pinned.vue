<template>
       <div class="flex flex-wrap justify-center mt-4">
              <div v-if="pinnedNotes.length > 0" class="notes-list flex flex-row items-start justify-center flex-wrap">
                     <div class="note flex justify-center" v-for="note in pinnedNotes" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>

              <a-result v-else status="info" title="Pin your first note"
                     sub-title="You currently have no pinned notes. Create a new note and pin it!">
              </a-result>
       </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import Note from '@/components/Note.vue';
import { useNotesStore } from '@/stores/notesStore';
import type { NoteType } from '@/types/Note';

const notesStore = useNotesStore();
notesStore.fetchAndStoreNotes();

// Filter and sort pinned notes by last modified date
const pinnedNotes = computed<NoteType[]>(() => {
       return notesStore.notes
              .filter(note => note.isPinned)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});
</script>
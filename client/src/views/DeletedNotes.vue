<template>
       <div class="flex flex-wrap justify-center mt-4">
              <div v-if="deletedNotes.length > 0 || sharedDeletedNotes.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div class="note flex justify-center" v-for="note in deletedNotes" :key="note.id">
                            <Note :note="note" />
                     </div>

                     <div class="note flex justify-center" v-for="note in sharedDeletedNotes" :key="note.id">
                            <SharedNote :note="note" />
                     </div>
              </div>

              <a-result v-else status="info" title="No Deleted Notes" sub-title="You currently have no deleted notes.">
              </a-result>
       </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import Note from '@/components/NoteComponent.vue';
import { useNotesStore } from '@/stores/notesStore';
import type { NoteType } from '@/types/Note';
import SharedNote from '@/components/SharedNoteComponent.vue';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import { getAuth } from 'firebase/auth';
import type { SharedNoteType } from '@/types/SharedNote';

const notesStore = useNotesStore();
notesStore.fetchAndStoreNotes();
const sharedNotesStore = useSharedNotesStore();

const auth = getAuth();
const currentUserId = auth.currentUser?.uid;

if (!currentUserId) {
       console.error('User not authenticated');
}

onMounted(() => {
       notesStore.fetchAndStoreNotes();
       sharedNotesStore.fetchAllNotes(); // Fetch notes shared with the user
});

// Filter and sort deleted notes by last modified date
const deletedNotes = computed<NoteType[]>(() => {
       return notesStore.notes
              .filter(note => note.isDeleted)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});

const sharedDeletedNotes = computed<SharedNoteType[]>(() => {
       if (!currentUserId) return [];
       return sharedNotesStore.allNotes
              .filter(note => note.users && note.users[currentUserId]?.isDeleted)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});
</script>

<style scoped>
/* Add any specific styles for DeletedNotes.vue here */
</style>
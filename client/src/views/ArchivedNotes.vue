<template>
       <div class="flex flex-wrap justify-center mt-4">
              <!-- Skeleton loading state -->
              <div v-if="loading"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <!-- Display multiple skeleton components to represent the loading state -->
                     <div v-for="index in 3" :key="index" class="note flex justify-center">
                            <SkeletonNote />
                     </div>
              </div>

              <!-- Archived Notes -->
              <div v-else-if="archivedNotes.length > 0 || sharedArchivedNotes.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">

                     <div class="note flex justify-center" v-for="note in archivedNotes" :key="note.id">
                            <Note :note="note" />
                     </div>

                     <!-- Shared Archived Notes -->
                     <div class="note flex justify-center" v-for="note in sharedArchivedNotes" :key="note.id">
                            <SharedNote :note="note" />
                     </div>
              </div>

              <!-- No Archived Notes available -->
              <a-result v-else status="info" title="No Archived Notes"
                     sub-title="You currently have no archived notes.">
              </a-result>
       </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Note from '@/components/NoteComponent.vue';
import { useNotesStore } from '@/stores/notesStore';
import type { NoteType } from '@/types/Note';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import type { SharedNoteType } from '@/types/SharedNote';
import { getAuth } from 'firebase/auth';
import SharedNote from '@/components/SharedNoteComponent.vue';
import SkeletonNote from '@/components/SkeletonNote.vue';

const notesStore = useNotesStore();
const sharedNotesStore = useSharedNotesStore();
const loading = ref(true);

const auth = getAuth();
const currentUserId = auth.currentUser?.uid;

if (!currentUserId) {
       console.error('User not authenticated');
}

onMounted(async () => {
       try {
              loading.value = true;
              await notesStore.fetchAndStoreNotes();
              await sharedNotesStore.fetchAllNotes(); // Fetch notes shared with the user
       } finally {
              loading.value = false;
       }
});

// Filter and sort archived notes by last modified date
const archivedNotes = computed<NoteType[]>(() => {
       return notesStore.notes
              .filter(note => note.isArchived)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});

const sharedArchivedNotes = computed<SharedNoteType[]>(() => {
       if (!currentUserId) return [];
       return sharedNotesStore.allNotes
              .filter(note => note.users && note.users[currentUserId]?.isArchived)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});
</script>

<style scoped>
/* Add any specific styles for ArchivedNotes.vue here */
</style>
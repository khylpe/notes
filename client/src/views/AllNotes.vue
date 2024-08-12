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

              <!-- Actual notes when loaded -->
              <div v-else-if="ownedNotes.length > 0 || sharedNotes.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">

                     <!-- Owned Notes -->
                     <div class="note flex justify-center" v-for="note in ownedNotes" :key="note.id">
                            <Note :note="note" />
                     </div>

                     <!-- Shared Notes -->
                     <div class="note flex justify-center" v-for="note in sharedNotes" :key="note.id">
                            <SharedNote :note="note" />
                     </div>
              </div>

              <!-- No notes available -->
              <a-result v-else status="info" title="Create your first note"
                     sub-title="You currently have no notes. Create a new note now !">
              </a-result>
       </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Note from '@/components/NoteComponent.vue';
import SharedNote from '@/components/SharedNoteComponent.vue';
import { useNotesStore } from '@/stores/notesStore';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import type { NoteType } from '@/types/Note';
import type { SharedNoteType } from '@/types/SharedNote';
import { getAuth } from 'firebase/auth';
import SkeletonNote from '@/components/SkeletonNote.vue';

const notesStore = useNotesStore();
const sharedNotesStore = useSharedNotesStore();
const loading = ref(true);

onMounted(async () => {
       try {
              loading.value = true;
              await notesStore.fetchAndStoreNotes();  // Fetch owned notes
              await sharedNotesStore.fetchAllNotes(); // Fetch shared notes
              sharedNotesStore.listenForUserNotes();  // Listen for real-time updates on shared notes
       } finally {
              loading.value = false;
       }
});

const auth = getAuth();
const currentUser = auth.currentUser;

if (!currentUser) {
       console.error('User not authenticated');
       throw new Error('User not authenticated');
}

// Filter and sort owned notes by last modified date
const ownedNotes = computed<NoteType[]>(() => {
       return notesStore.notes
              .filter(note => !note.isDeleted && !note.isArchived)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});

// Filter and sort shared notes by last modified date
const sharedNotes = computed<SharedNoteType[]>(() => {
       if (!currentUser) return [];

       return sharedNotesStore.allNotes
              .filter(note => note.users && note.users[currentUser.uid] && !note.users[currentUser.uid].isDeleted && !note.users[currentUser.uid].isArchived)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});
</script>
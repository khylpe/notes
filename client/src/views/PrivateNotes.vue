<template>
       <div class="flex flex-wrap justify-center mt-4">
              <!-- Display skeletons while loading -->
              <div v-if="loading"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div v-for="index in 3" :key="index" class="note flex justify-center">
                            <SkeletonNote />
                     </div>
              </div>

              <!-- Display owned notes if available -->
              <div v-else-if="ownedNotes.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">

                     <!-- Owned Notes -->
                     <div class="note flex justify-center" v-for="note in ownedNotes" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>

              <!-- Display message if no owned notes are available -->
              <a-result v-else status="info" title="Create your first private note."
                     sub-title="You currently have no private notes. Create a new note to start using this folder.">
              </a-result>
       </div>
</template>

<script setup lang="ts">
console.log("loading")
import { computed, onMounted, ref } from 'vue';
import Note from '@/components/NoteComponent.vue';
import SkeletonNote from '@/components/SkeletonNote.vue'; // Assuming you have a SkeletonNote component
import { useNotesStore } from '@/stores/notesStore';
import type { NoteType } from '@/types/Note';
import { getAuth } from 'firebase/auth';

const notesStore = useNotesStore();
const loading = ref(true); // Track loading state

onMounted(async () => {
       try {
              await notesStore.fetchAndStoreNotes(); // Fetch owned notes
       } finally {
              loading.value = false; // Set loading to false once data is fetched
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
</script>
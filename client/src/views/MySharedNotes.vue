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

              <!-- Shared Notes -->
              <div v-else-if="sharedNotes.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div class="note flex justify-center" v-for="note in sharedNotes" :key="note.id">
                            <SharedNote :note="note" />
                     </div>
              </div>

              <!-- No Notes available -->
              <a-result v-else status="info" title="You did not create any shared note"
                     sub-title="Create a new shared note to start using this folder :)">
              </a-result>
       </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SharedNote from '@/components/SharedNoteComponent.vue';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import { getAuth } from 'firebase/auth';
import type { SharedNoteType } from '@/types/SharedNote';
import SkeletonNote from '@/components/SkeletonNote.vue';

const sharedNotesStore = useSharedNotesStore();
const loading = ref(true);

const auth = getAuth();
const currentUser = auth.currentUser;

if (!currentUser) {
       console.error('User not authenticated');
       throw new Error('User not authenticated');
}

onMounted(async () => {
       try {
              loading.value = true;
              await sharedNotesStore.fetchAllNotes(); // Fetch shared notes
              sharedNotesStore.listenForUserNotes(); // Listen for real-time updates on shared notes
       } finally {
              loading.value = false;
       }
});

// Filter and sort shared notes by last modified date
const sharedNotes = computed<SharedNoteType[]>(() => {
       if (!currentUser) return [];

       return sharedNotesStore.allNotes
              .filter(note => note.users && note.users[currentUser.uid] && note.owner === currentUser.uid)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});
</script>
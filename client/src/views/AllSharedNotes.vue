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

              <!-- No notes available -->
              <a-result v-else status="info" title="No shared notes"
                     sub-title="You currently have no shared notes. Create a new note and share it or accept an invitation.">
              </a-result>
       </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SharedNote from '@/components/SharedNoteComponent.vue';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import type { SharedNoteType } from '@/types/SharedNote';
import { getAuth } from 'firebase/auth';
import SkeletonNote from '@/components/SkeletonNote.vue';

const sharedNotesStore = useSharedNotesStore();
const loading = ref(true);

onMounted(async () => {
       try {
              loading.value = true;
              await sharedNotesStore.fetchAllNotes(); // Fetch shared notes
              sharedNotesStore.listenForUserNotes(); // Listen for real-time updates on shared notes
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
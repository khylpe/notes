<template>
       <div class="flex flex-wrap justify-center mt-4">
              <!-- Display skeletons while loading -->
              <div v-if="loading"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div v-for="index in 3" :key="index" class="note flex justify-center">
                            <SkeletonNote />
                     </div>
              </div>

              <!-- Display pinned notes if available -->
              <div v-else-if="AllPinnedNotes.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">

                     <!-- Combined Pinned Notes -->
                     <div class="note flex justify-center" v-for="note in AllPinnedNotes" :key="note.note.id">
                            <template v-if="note.type === 'owned'">
                                   <Note :note="note.note" />
                            </template>
                            <template v-else>
                                   <SharedNote :note="note.note" />
                            </template>
                     </div>
              </div>

              <!-- Display message if no pinned notes are available -->
              <a-result v-else status="info" title="Pin your first note"
                     sub-title="You currently have no pinned notes. Create a new note and pin it!">
              </a-result>
       </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import Note from '@/components/NoteComponent.vue';
import SharedNote from '@/components/SharedNoteComponent.vue';
import SkeletonNote from '@/components/SkeletonNote.vue';
import { useNotesStore } from '@/stores/notesStore';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import type { NoteType } from '@/types/Note';
import type { SharedNoteType } from '@/types/SharedNote';
import { getAuth } from 'firebase/auth';

const notesStore = useNotesStore();
const sharedNotesStore = useSharedNotesStore();
const loading = ref(true); // Track loading state

// Fetch notes on component mount
onMounted(async () => {
       try {
              await notesStore.fetchAndStoreNotes();
              await sharedNotesStore.fetchAllNotes(); // Fetch notes shared with the user
       } finally {
              loading.value = false; // Set loading to false once data is fetched
       }
});

// Get the current user's UID
const auth = getAuth();
const currentUserId = auth.currentUser?.uid;

if (!currentUserId) {
       console.error('User not authenticated');
}

// Filter and sort owned pinned notes
const pinnedNotes = computed<NoteType[]>(() => {
       return notesStore.notes
              .filter(note => note.isPinned)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});

// Filter and sort shared pinned notes
const sharedPinnedNotes = computed<SharedNoteType[]>(() => {
       if (!currentUserId) return [];
       return sharedNotesStore.allNotes
              .filter(note => note.users && note.users[currentUserId]?.isPinned)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});

// Combine owned and shared pinned notes and sort them by date
const AllPinnedNotes = computed(() => {
       return [
              ...pinnedNotes.value.map(note => ({ type: 'owned' as const, note })),
              ...sharedPinnedNotes.value.map(note => ({ type: 'shared' as const, note }))
       ].sort((a, b) => {
              const dateA = a.note.updatedDate ? new Date(a.note.updatedDate).getTime() : new Date(a.note.createdDate).getTime();
              const dateB = b.note.updatedDate ? new Date(b.note.updatedDate).getTime() : new Date(b.note.createdDate).getTime();
              return dateB - dateA;
       });
});
</script>
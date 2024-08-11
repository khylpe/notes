<template>
       <div class="flex flex-wrap justify-center mt-4">
              <div v-if="pinnedNotes.length > 0 || sharedPinnedNotes.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <!-- Owned Pinned Notes -->
                     <div class="note flex justify-center" v-for="note in pinnedNotes" :key="note.id">
                            <Note :note="note" />
                     </div>

                     <!-- Shared Pinned Notes -->
                     <div class="note flex justify-center" v-for="note in sharedPinnedNotes" :key="note.id">
                            <SharedNote :note="note" />
                     </div>
              </div>

              <a-result v-else status="info" title="Pin your first note"
                     sub-title="You currently have no pinned notes. Create a new note and pin it!">
              </a-result>
       </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import Note from '@/components/NoteComponent.vue';
import SharedNote from '@/components/SharedNoteComponent.vue';
import { useNotesStore } from '@/stores/notesStore';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import type { NoteType } from '@/types/Note';
import type { SharedNoteType } from '@/types/SharedNote';
import { getAuth } from 'firebase/auth';

const notesStore = useNotesStore();
const sharedNotesStore = useSharedNotesStore();

// Fetch notes on component mount
onMounted(() => {
       notesStore.fetchAndStoreNotes();
       sharedNotesStore.fetchAllNotes(); // Fetch notes shared with the user
});

// Get the current user's UID
const auth = getAuth();
const currentUserId = auth.currentUser?.uid;

if (!currentUserId) {
       console.error('User not authenticated');
}

// Filter and sort owned pinned notes by last modified date
const pinnedNotes = computed<NoteType[]>(() => {
       return notesStore.notes
              .filter(note => note.isPinned)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});

// Filter and sort shared pinned notes by last modified date
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
</script>
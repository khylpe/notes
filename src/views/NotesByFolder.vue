<template>
       <div class="flex flex-wrap justify-center mt-4">
              <div v-if="filteredNotes.length > 0" class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div class="note flex justify-center" v-for="note in filteredNotes" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>

              <a-result v-else status="info" :title="`Add your first note to the ${folderName} folder`"
                     sub-title="You currently have no notes in this folder. Create a new note and add it to this folder to get started!">
              </a-result>
       </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNotesStore } from '@/stores/notesStore';
import Note from '@/components/NoteComponent.vue';
import type { NoteType } from '@/types/Note';

const route = useRoute();
const notesStore = useNotesStore();
notesStore.fetchAndStoreNotes();

// Dynamically update folderName when the route changes
const folderName = computed(() => route.params.tagName as string);

// Watch for route changes
watch(route, (newRoute, oldRoute) => {
       // You can perform additional actions here if needed
       // For example, fetch and store notes based on the new folderName
       notesStore.fetchAndStoreNotes();
});

const filteredNotes = computed<NoteType[]>(() => {
       return notesStore.notes
              .filter(note => note.folderId === folderName.value)
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});

</script>

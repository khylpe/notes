<template>
       <div class="flex flex-wrap justify-center mt-4">
              <div
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div class="note flex justify-center" v-for="note in filteredNotes" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>
       </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNotesStore } from '@/stores/notesStore';
import Note from '@/components/Note.vue';
import type { NoteType } from '@/types/Note';
import { Typography } from 'ant-design-vue';

const { Title } = Typography;

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
       return notesStore.notes.filter(note => note.folderId === folderName.value);
});
</script>

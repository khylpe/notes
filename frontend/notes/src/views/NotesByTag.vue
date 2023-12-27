<template>
       <div class="flex justify-center">
              <h2>Notes with the "{{ tagName }}" tag</h2>
       </div>

       <div class="flex flex-wrap justify-center mt4">
              <div class="notes-list flex flex-row items-start justify-center flex-wrap">
                     <div class="note flex justify-center" v-for="note in filteredNotesByTag" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>
       </div>
</template>
     
     
<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import Note from '@/components/Note.vue';
import type { NoteType } from '@/types/Note';

const route = useRoute();
const notesStore = useNotesStore();
const tagsStore = useTagsStore();

notesStore.fetchAndStoreNotes();
tagsStore.fetchTags(); // Fetch tags

// Get the tag name from the URL
const tagName = computed(() => route.params.tagName as string);

// Find the corresponding tag ID based on the tag name
const tagId = computed(() => {
  const tag = tagsStore.tags.find(t => t.name === tagName.value);
  return tag ? tag.id : null;
});

// Watch for route changes
watch(route, () => {
  notesStore.fetchAndStoreNotes();
});

// Computed property to filter notes based on the tag ID
const filteredNotesByTag = computed<NoteType[]>(() => {
  return notesStore.notes.filter(note => note.tagId === tagId.value);
});

console.log('Filtered Notes by Tag:', filteredNotesByTag.value);
</script>

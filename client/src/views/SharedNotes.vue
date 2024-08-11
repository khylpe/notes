<script setup lang="ts">
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import { onMounted, ref, computed } from 'vue';
import { Spin, List } from 'ant-design-vue';
import SharedNote from '@/components/SharedNoteComponent.vue'; // Import the new component

// Initialize the store
const sharedNotesStore = useSharedNotesStore();
const loading = ref(true);

// When the component is mounted, fetch the initial data and start listening for notes
onMounted(async () => {
       await sharedNotesStore.fetchAllNotes(); // Fetch user notes
       sharedNotesStore.listenForUserNotes(); // Start listening for real-time updates
       loading.value = false;
});

// Use computed property to ensure reactivity
const notes = computed(() => sharedNotesStore.allNotes);
</script>

<template>
       <div>
              <h2>Your Notes</h2>
              <a-spin v-if="loading" tip="Loading notes...">
                     <template #indicator>
                            <a-icon type="loading" />
                     </template>
              </a-spin>
              <a-list v-else>
                     <a-list-item v-for="note in notes" :key="note.id">
                            <!-- Use the SharedNote component -->
                            <SharedNote :note="note" />
                     </a-list-item>
              </a-list>
       </div>
</template>

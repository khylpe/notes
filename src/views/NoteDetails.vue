<template>
       <div class="flex justify-center">
              <Note v-if="note && !isLoading" :note="note" />
              <SkeletonNote v-if="isLoading" />
       </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useNotesStore } from '@/stores/notesStore';
import Note from '@/components/NoteComponent.vue';
import type { NoteType } from '@/types/Note';
import SkeletonNote from '@/components/SkeletonNote.vue';
import { message } from 'ant-design-vue';
const isLoading = ref(true);
const route = useRoute();
const noteId = computed(() => route.params.noteId as string);
const notesStore = useNotesStore();
const note = ref<NoteType | undefined>(undefined);

onMounted(async () => {
       try {
              note.value = await notesStore.getNoteById(noteId.value);
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              }
              console.error(error);
       }
       finally {
              isLoading.value = false;
       }
});

</script>
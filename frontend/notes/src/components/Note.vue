<template>
       <a-card hoverable style="width: 300px">
              <template #cover>
                     <!-- <img alt="example" src="@/assets/newNoteBanner.png" /> -->
              </template>
              <template #actions>
                     <a-tooltip v-if="noteModified">
                            <template #title>Save modification</template>
                            <check-outlined @click="checkAndUpdateNote" key="save" />
                     </a-tooltip>
              </template>
              <a-card-meta>
                     <template #title>
                            <a-input placeholder="Your title" :bordered="false" size="large" v-model:value="editableNote.title"
                                   @pressEnter="checkAndUpdateNote" :maxlength="20" />
                     </template>
                     <template #description>
                            <a-textarea placeholder="Content of your note ! :)" :bordered="false" :rows="8"
                                   @pressEnter="checkAndUpdateNote" v-model:value="editableNote.content" />
                     </template>
              </a-card-meta>
       </a-card>
</template>
<script lang="ts" setup>
import { CheckOutlined } from '@ant-design/icons-vue';
import { defineProps, ref, computed, watch } from 'vue';
import type { NoteType } from '@/types/Note';
import { useNotesStore } from '@/stores/notesStore';
import { isEqual } from 'lodash';

const props = defineProps<{ note: NoteType }>();
const notesStore = useNotesStore();
const editableNote = ref({ ...props.note });
const noteModified = ref(false);

watch(() => props.note, (newNote) => {
       editableNote.value = { ...newNote };
}, { deep: true });
watch(editableNote, () => {
       console.log('editableNote changed:', editableNote.value);
       const storeNote = notesStore.notes.find(n => n.id === editableNote.value.id);
       noteModified.value = !isEqual(storeNote, editableNote.value);
}, { deep: true });
const checkAndUpdateNote = () => {
       const storeNote = notesStore.notes.find(n => n.id === editableNote.value.id);
       if (storeNote && !isEqual(storeNote, editableNote.value)) {
              notesStore.updateStoreAndFirestore(editableNote.value);
              noteModified.value = false;
       }
};
</script>


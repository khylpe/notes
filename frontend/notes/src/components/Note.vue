<template>
       <a-card hoverable :style="{ boxShadow: hover ? `0px 0px 10px 0px ${noteTagColor}` : 'none' }" style="width: 300px"
              @mouseenter="hover = true" @mouseleave="hover = false">
              <template #actions>
                     <a-tooltip v-if="noteModified">
                            <template #title>Save modification</template>
                            <check-outlined @click="checkAndUpdateNote" key="save" />
                     </a-tooltip>
              </template>
              <a-card-meta style="min-height: 200px;">
                     <template #title>
                            <a-input placeholder="Your title" :bordered="false" size="large" v-model:value="editableNote.title"
                                   @pressEnter="checkAndUpdateNote" :maxlength="20" />
                     </template>
                     <template #description>
                            <a-textarea :autoSize="{ minRows: 2, maxRows: 10 }" placeholder="Content of your note ! :)" :bordered="false" :rows="8"
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
import { useTagsStore } from '@/stores/tagsStore';
import { isEqual } from 'lodash';

const props = defineProps<{ note: NoteType }>();
const notesStore = useNotesStore();
const tagsStore = useTagsStore();
const editableNote = ref({ ...props.note });
const noteModified = ref(false);
const hover = ref(false);  // Define hover here

const noteTagColor = computed(() => {
       const tag = tagsStore.tags.find(tag => tag.id === editableNote.value.tagId);
       return tag ? tag.color : '#000000'; // Default color if tag not found
});
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
<style scoped>
.card {
       transition: box-shadow 0.3s;
}
.card:hover {
       box-shadow: var(--dynamic-shadow);
}
</style>




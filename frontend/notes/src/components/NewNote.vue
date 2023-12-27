<template>
       <a-card hoverable :style="cardStyle" style="width: 300px" class="shadow" @mouseenter="hover = true"
              @mouseleave="hover = false">
              <template #cover>
                     <img alt="example" src="@/assets/newNoteBanner.png" />
              </template>
              <template #actions>
                     <a-tooltip v-if="noteModified">
                            <template #title>Save modification</template>
                            <check-outlined @click="addNewNote" key="save" />
                     </a-tooltip>
              </template>
              <a-card-meta style="min-height: 200px;">
                     <template #title>
                            <a-input v-model:value="formState.title" placeholder="Your title" :bordered="false" size="large"
                                   :maxlength="20" @pressEnter="addNewNote" />
                     </template>
                     <template #description>
                            <a-textarea v-model:value="formState.description" placeholder="Content of your note ! :)"
                                   :bordered="false" :autoSize="{ minRows: 2, maxRows: 10 }" @pressEnter="addNewNote" />
                     </template>
              </a-card-meta>
              <div class="flex w-100 justify-center mt3">
                     <a-select v-model:value="selectedTag" placeholder="Select tag" style="width: 150px" :options="tagOptions">
                            <template #suffixIcon><tags-outlined class="ant-select-suffix" /></template>
                     </a-select>
              </div>
       </a-card>
</template>
     
<script lang="ts" setup>
import { reactive, ref, watch, onMounted, computed } from 'vue';
import { CheckOutlined, TagsOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import type { NoteType } from '@/types/Note';
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const userId = auth.currentUser?.uid || '';
const initialFormState = { title: '', description: '' };
const formState = reactive<FormState>({ ...initialFormState });
const noteModified = ref(false);
const tagsStore = useTagsStore();
const hover = ref(false);
const selectedTag = ref('');
const tagOptions = computed(() => tagsStore.tags.map(tag => ({ label: tag.name, value: tag.id })));
const notesStore = useNotesStore();

const cardStyle = computed(() => {
       const tag = tagsStore.tags.find(t => t.id === selectedTag.value);
       if (hover.value && tag) {
              return `box-shadow: 0px 0px 10px 0px ${tag.color};`;
       }
       return '';
});
onMounted(async () => {
       await tagsStore.fetchTags();
       // Set the default selected tag to the one matching the user's ID
       if (userId) {
              selectedTag.value = userId;
       }
});
interface FormState {
       title: string;
       description: string;
}
watch(selectedTag, (newTagId) => {
       if (newTagId) {
              const tagData = tagsStore.tags.find(tag => tag.id === newTagId);
              console.log('Selected Tag Data:', tagData);
       }
});
watch(formState, () => {
       noteModified.value = formState.title.trim() !== '' || formState.description.trim() !== '';
}, { deep: true });
const addNewNote = async () => {
       if (formState.title.trim() && formState.description.trim()) {
              const newNote: NoteType = {
                     id: '', // Assign a unique ID, for instance using a UUID or similar method
                     title: formState.title,
                     content: formState.description,
                     createdDate: new Date(),
                     tagId: selectedTag.value // Add the selected tag ID
              };

              await notesStore.addNoteToFirestore(newNote);

              // Reset the form state and noteModified flag after adding the note
              Object.assign(formState, initialFormState);
              noteModified.value = false;
              selectedTag.value = ''; // Reset the selected tag
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
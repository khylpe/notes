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
                            <a-input spellcheck="false" v-model:value="formState.title" placeholder="Your title"
                                   :bordered="false" size="large" :maxlength="20" @pressEnter="addNewNote" />
                     </template>
                     <template #description>
                            <a-textarea spellcheck="false" v-model:value="formState.description"
                                   placeholder="Content of your note ! :)" :bordered="false"
                                   :autoSize="{ minRows: 2, maxRows: 10 }" @pressEnter="addNewNote" />
                     </template>
              </a-card-meta>
              <div class="flex w-full justify-center mt-3">
                     <a-select :allowClear=true v-model:value="selectedTag" placeholder="Select tag" style="width: 150px"
                            :options="tagOptions">
                            <template #suffixIcon><tags-outlined /></template>
                     </a-select>
              </div>
       </a-card>
</template>

<script lang="ts" setup>
import { reactive, ref, watch, onMounted, computed } from 'vue';
import { CheckOutlined, TagsOutlined } from '@ant-design/icons-vue';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import type { NoteType } from '@/types/Note';
import { message } from 'ant-design-vue';

const initialFormState = { title: '', description: '' };
const formState = reactive<FormState>({ ...initialFormState });
const noteModified = ref(false);
const tagsStore = useTagsStore();
const hover = ref(false);
const selectedTag = ref<string | null>(null);
const tagOptions = computed(() => tagsStore.tags.map(tag => ({ label: tag.name, value: tag.id })));
const notesStore = useNotesStore();

const cardStyle = computed(() => {
       const tag = tagsStore.tags.find(t => t.id === selectedTag.value);
       return hover.value && tag ? `box-shadow: 0px 0px 10px 0px ${tag.color};` : '';
});

onMounted(async () => {
       await tagsStore.fetchTags();
});
interface FormState {
       title: string;
       description: string;
}
// watch(selectedTag, (newTagId) => {
//        if (newTagId) {
//               const tagData = tagsStore.tags.find(tag => tag.id === newTagId);
//        }
// });
watch(formState, () => {
       noteModified.value = formState.title.trim() !== '' || formState.description.trim() !== '';
}, { deep: true });
const addNewNote = async () => {
       if (formState.title.trim() && formState.description.trim()) {
              const newNote: NoteType = {
                     id: '', // Assign a unique ID
                     title: formState.title,
                     content: formState.description,
                     createdDate: new Date(),
                     tagId: selectedTag.value || null, // Use selected tag ID or null if none is selected
                     folderId: null, // Set folderId as null by default
                     isPinned: false,
              };

              try {
                     await notesStore.addNoteToFirestore(newNote);
                     Object.assign(formState, initialFormState);
                     message.success('Note added successfully');
              } catch (error) {
                     if (error instanceof Error) {
                            message.error(error.message);
                     } else {
                            // Handle non-Error objects
                            message.error('An unknown error occurred.');
                     }
              }

              // Reset the form state and noteModified flag after adding the note
              noteModified.value = false;
              selectedTag.value = null; // Reset the selected tag to null
       } else if (!formState.title.trim()) {
              message.warning('Please enter a title');
       } else if (!formState.description.trim()) {
              message.warning('Please enter a description');
       }
};
</script>
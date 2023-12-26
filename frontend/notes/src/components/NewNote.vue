<template>
       <a-card hoverable style="width: 300px">
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
                                   :bordered="false" :rows="8" @pressEnter="addNewNote" />
                     </template>
              </a-card-meta>
       </a-card>
</template>
     
<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { CheckOutlined } from '@ant-design/icons-vue';
import { useNotesStore } from '@/stores/notesStore';
import type { NoteType } from '@/types/Note';

interface FormState {
  title: string;
  description: string;
}

const initialFormState = { title: '', description: '' };
const formState = reactive<FormState>({ ...initialFormState });
const noteModified = ref(false);

watch(formState, () => {
  noteModified.value = formState.title.trim() !== '' || formState.description.trim() !== '';
}, { deep: true });

const notesStore = useNotesStore();

const addNewNote = async () => {
  if (formState.title.trim() && formState.description.trim()) {
    const newNote: NoteType = {
      id: '', // Assign a unique ID
      title: formState.title,
      content: formState.description,
      createdDate: new Date(),
    };

    await notesStore.addNoteToFirestore(newNote);

    Object.assign(formState, initialFormState);
    noteModified.value = false;
  }
};
</script>

     
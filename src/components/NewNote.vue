<template>
       <div class="new-note-container">
              <a-form layout="vertical" @submit.prevent="addNewNote">
                     <a-form-item label="Title" required>
                            <a-input v-model:value="formState.title" placeholder="Your title" :maxlength="50"
                                   @keypress="handleKeyPress($event, 'title')" />
                     </a-form-item>

                     <a-form-item label="Description" required>
                            <a-textarea v-model:value="formState.description" placeholder="Content of your note!"
                                   :autoSize="{ minRows: 8, maxRows: 15 }"
                                   @keypress="handleKeyPress($event, 'description')" />
                     </a-form-item>

                     <a-form-item label="Preview" >
                            <div class="markdown-preview-container">
                                   <div v-html="renderedMarkdown" class="min-h-20"></div>
                            </div>
                     </a-form-item>

                     <a-form-item label="Tag">
                            <a-select v-model:value="selectedTag" placeholder="Select tag" :options="tagOptions"
                                   allowClear>
                                   <template #suffixIcon>
                                          <tags-outlined />
                                   </template>
                            </a-select>
                     </a-form-item>

                     <div class="note-actions">
                            <a-button @click="resetForm" type="default">Clear</a-button>
                            <a-button type="primary"
                                   :disabled="!noteModified || !formState.title.trim() || !formState.description.trim()"
                                   @click="addNewNote">
                                   Save
                            </a-button>
                     </div>
              </a-form>
       </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch, onMounted, computed } from 'vue';
import { TagsOutlined } from '@ant-design/icons-vue';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import type { NoteType } from '@/types/Note';
import { message } from 'ant-design-vue';
import md from './test';

const initialFormState = { title: '', description: '' };
const formState = reactive<FormState>({ ...initialFormState });
const noteModified = ref(false);
const tagsStore = useTagsStore();
const selectedTag = ref<string | null>(null);
const tagOptions = computed(() => tagsStore.tags.map(tag => ({ label: tag.name, value: tag.id })));
const notesStore = useNotesStore();

onMounted(async () => {
       await tagsStore.fetchTags();
});

interface FormState {
       title: string;
       description: string;
}

watch(formState, () => {
       noteModified.value = formState.title.trim() !== '' || formState.description.trim() !== '';
}, { deep: true });

const renderedMarkdown = computed(() => {
       return md.render(formState.description);
});

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
                            message.error('An unknown error occurred.');
                     }
              }

              noteModified.value = false;
              selectedTag.value = null;
       } else if (!formState.title.trim()) {
              message.warning('Please enter a title');
       } else if (!formState.description.trim()) {
              message.warning('Please enter a description');
       }
};

const resetForm = () => {
       Object.assign(formState, initialFormState);
       selectedTag.value = null;
       noteModified.value = false;
};

// Handle key press events for title and description inputs
const handleKeyPress = (event: KeyboardEvent, field: 'title' | 'description') => {
       if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (field === 'title' || field === 'description') {
                     addNewNote();
              }
       }
};
</script>

<style scoped>
.new-note-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 24px;
}

.markdown-preview-container {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 16px;
}

.note-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    margin-top: 24px;
}

@media (max-width: 768px) {
    .new-note-container {
        width: 95%; /* Adjust width to fit better on smaller screens */
        padding: 16px;
    }

    .note-actions {
        flex-direction: column;
        gap: 8px;
    }
}
</style>

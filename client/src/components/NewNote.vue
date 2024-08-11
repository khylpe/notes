<template>
       <div class="new-note-container">
              <a-form layout="vertical" @submit.prevent="addNewNote">
                     <a-form-item label="Title" required>
                            <a-input v-model:value="formState.title" placeholder="Your title" :maxlength="100"
                                   @keypress="handleKeyPress($event, 'title')" />
                     </a-form-item>

                     <a-form-item label="Description" required>
                            <a-textarea v-model:value="formState.description" placeholder="Content of your note!"
                                   :autoSize="{ minRows: 8, maxRows: 15 }"
                                   @keypress="handleKeyPress($event, 'description')" />
                     </a-form-item>

                     <a-form-item label="Preview">
                            <div class="markdown-preview-container">
                                   <div v-html="renderedMarkdown" class="min-h-20"></div>
                            </div>
                     </a-form-item>

                     <a-form-item label="Tags">
                            <a-select v-model:value="selectedTags" placeholder="Select tags" :options="tagOptions"
                                   mode="multiple" allowClear>
                                   <template #suffixIcon>
                                          <tags-outlined />
                                   </template>
                            </a-select>
                     </a-form-item>

                     <a-form-item label="Folder">
                            <a-select v-model:value="selectedFolder" placeholder="Select folder"
                                   :options="folderOptions" allowClear>
                                   <template #suffixIcon>
                                          <folder-outlined />
                                   </template>
                            </a-select>
                     </a-form-item>

                     <a-form-item label="Shared">
                            <a-checkbox v-model:checked="isShared">Shared</a-checkbox>
                     </a-form-item>

                     <a-form-item v-if="isShared" label="Share with (emails)">
                            <div class="email-input-container flex flex-row gap-3">
                                   <a-input v-model:value="newEmail" placeholder="Enter email" autocomplete="off"
                                          @keyup.enter="addEmail" />
                                   <a-button @click="addEmail" type="default" style="margin-left: 8px;">Add</a-button>
                            </div>
                            <div class="shared-emails-list" v-if="sharedEmails.length > 0">
                                   <ul>
                                          <li v-for="(email, index) in sharedEmails" :key="index">
                                                 <span>{{ email }}</span>
                                                 <a-select v-model:value="sharedEmailsAccess[email]"
                                                        :options="accessOptions" placeholder="Access Level"
                                                        :default-value="'read'"
                                                        style="width: 120px; margin-left: 10px;">
                                                 </a-select>
                                                 <a-button type="text" @click="removeEmail(index)">Remove</a-button>
                                          </li>
                                   </ul>
                            </div>
                     </a-form-item>


                     <div class="note-actions">
                            <a-popconfirm title="Clear ? (In case your double clicked on your tag like a guignol)"
                                   ok-text="Yes" cancel-text="No" @confirm="resetForm">
                                   <a-button type="default">Clear</a-button>
                            </a-popconfirm>
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
import { TagsOutlined, FolderOutlined } from '@ant-design/icons-vue';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useFoldersStore } from '@/stores/foldersStore';
import type { NoteType } from '@/types/Note';
import { message } from 'ant-design-vue';
import md from '../markdown';
import type { SharedNoteType } from '@/types/SharedNote';
import { getAuth } from 'firebase/auth';
import { defineEmits } from 'vue';

const emit = defineEmits(['close']);

const initialFormState = { title: '', description: '' };
const formState = reactive<FormState>({ ...initialFormState });
const noteModified = ref(false);
const tagsStore = useTagsStore();
const foldersStore = useFoldersStore();
const selectedTags = ref<string[]>([]);
const selectedFolder = ref<string | null>(null);
const isShared = ref(false);
const newEmail = ref('');
const sharedEmails = ref<string[]>([]);
let sharedEmailsAccess = reactive<Record<string, string>>({}); // Changed to let
const tagOptions = computed(() => tagsStore.tags.map(tag => ({ label: tag.name, value: tag.id })));
const folderOptions = computed(() => foldersStore.folders.map(folder => ({ label: folder.name, value: folder.id })));
const notesStore = useNotesStore();

const accessOptions = ref([
       { label: 'Read', value: 'read' },
       { label: 'Write', value: 'write' }
]);

onMounted(async () => {
       await tagsStore.fetchTags();
       await foldersStore.fetchFolders();
});

interface FormState {
       title: string;
       description: string;
}

watch(
       formState,
       () => {
              noteModified.value = formState.title.trim() !== '' || formState.description.trim() !== '';
       },
       { deep: true }
);

const renderedMarkdown = computed(() => {
       return md.render(formState.description);
});

const addNewNote = async () => {
       if (formState.title.trim() && formState.description.trim()) {
              const auth = getAuth();
              const user = auth.currentUser;

              if (!user) {
                     message.error('You must be logged in to create a note.');
                     return;
              }

              const token = await user.getIdToken();  // Get the Firebase ID token

              if (!isShared.value) {
                     const newNote: NoteType = {
                            id: '', // Assign a unique ID
                            title: formState.title,
                            content: formState.description,
                            createdDate: new Date(),
                            tagIds: selectedTags.value, // Use selected tags array
                            folderId: selectedFolder.value, // Use selected folder ID
                            isPinned: false,
                            updatedDate: new Date(),
                            isArchived: false,
                            isDeleted: false,
                     };

                     try {
                            await notesStore.addNoteToFirestore(newNote);
                            Object.assign(formState, initialFormState);
                            selectedTags.value = [];
                            selectedFolder.value = null;
                            message.success('Note added successfully');
                     } catch (error) {
                            if (error instanceof Error) {
                                   message.error(error.message);
                            } else {
                                   message.error('An unknown error occurred.');
                            }
                     }

                     noteModified.value = false;
              } else {
                     if (isShared.value && sharedEmails.value.length === 0) {
                            message.warning('Please enter at least one email to share the note.');
                            return;
                     }

                     if (isShared.value && user.email && sharedEmails.value.includes(user.email)) {
                            message.warning('You cannot share a note with yourself.');
                            return;
                     }

                     if (isShared.value && sharedEmails.value.some(email => !validateEmail(email))) {
                            message.warning('Please enter valid email addresses.');
                            return;
                     }

                     const newNoteData = {
                            title: formState.title,
                            content: formState.description,
                            owner: user.uid,
                            users: {
                                   [user.uid]: {
                                          tags: selectedTags.value,
                                          folderId: selectedFolder.value,
                                   },
                            },
                     };

                     const invitedEmails = sharedEmails.value.map(email => ({
                            email,
                            rule: sharedEmailsAccess[email] || 'read', // Default to 'read' if no rule is set
                     }));

                     try {
                            // Send data to the backend
                            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-note`, {
                                   method: 'POST',
                                   headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`,  // Include the token in the request headers
                                   },
                                   body: JSON.stringify({
                                          noteDetails: newNoteData,
                                          invitedEmails,
                                   }),
                            });

                            if (response.ok) {
                                   message.success('Shared note added successfully');
                                   resetForm();
                                   emit('close');
                            } else {
                                   const errorResponse = await response.json();
                                   message.error(`Error: ${errorResponse.message}`);
                            }
                     } catch (error) {
                            message.error('An error occurred while saving the note.');
                            console.error(error);
                     }
              }


       } else if (!formState.title.trim()) {
              message.warning('Please enter a title');
       } else if (!formState.description.trim()) {
              message.warning('Please enter a description');
       }
};



const resetForm = () => {
       Object.assign(formState, initialFormState);
       selectedTags.value = [];
       selectedFolder.value = null;
       sharedEmails.value = [];
       sharedEmailsAccess = reactive({}); // Clear access levels properly
       isShared.value = false;
       noteModified.value = false;
       newEmail.value = '';
};

const handleKeyPress = (event: KeyboardEvent, field: 'title' | 'description') => {
       if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (field === 'title' || field === 'description') {
                     addNewNote();
              }
       }
};

const addEmail = () => {
       if (newEmail.value.trim() && validateEmail(newEmail.value)) {
              sharedEmails.value.push(newEmail.value.trim()); // Store the email as-is
              sharedEmailsAccess[newEmail.value.trim()] = 'read'; // Store access level
              newEmail.value = ''; // Reset input
       } else {
              message.warning('Please enter a valid email address');
       }
};


const removeEmail = (index: number) => {
       const email = sharedEmails.value[index];
       const safeEmailKey = email.replace(/\./g, ',');
       sharedEmails.value.splice(index, 1);
       delete sharedEmailsAccess[safeEmailKey];
};

const validateEmail = (email: string) => {
       const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
       return re.test(String(email).toLowerCase());
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
              width: 95%;
              padding: 16px;
       }

       .note-actions {
              flex-direction: column;
              gap: 8px;
       }
}
</style>
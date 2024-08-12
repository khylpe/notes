<template>
       <div class="flex flex-col">
              <div class="flex flex-row justify-end">
                     <a-button type="dashed" @click="openModal"><setting-outlined /></a-button>
              </div>
       </div>

       <div class="flex flex-wrap justify-center mt-4">
              <!-- Skeleton loading state -->
              <div v-if="loading"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div v-for="index in 3" :key="index" class="note flex justify-center">
                            <SkeletonNote />
                     </div>
              </div>

              <!-- Display notes when not loading -->
              <div v-else-if="AllNotes.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div class="note flex justify-center" v-for="note in AllNotes" :key="note.note.id">
                            <template v-if="note.type === 'owned'">
                                   <Note :note="note.note" />
                            </template>
                            <template v-else>
                                   <SharedNote :note="note.note" />
                            </template>
                     </div>
              </div>

              <!-- Display message if no notes are available -->
              <a-result v-else status="info" :title="`Add your first note to the ${folderName} folder`"
                     sub-title="You currently have no notes in this folder. Create a new note and add it to this folder to get started!">
              </a-result>
       </div>

       <a-modal v-model:open="isModalVisible" title="Update Folder" @ok="updateCurrentFolder">
              <div class="flex flex-row my3">
                     <a-input placeholder="New folder name" v-model:value="newFolderName" />
                     <a-input type="color" class="mx-2" style="width: 50px;" v-model:value="newFolderColor" />

                     <a-popconfirm title="Are you sure delete this folder?" ok-text="Yes" cancel-text="No"
                            @confirm="deleteFolder">
                            <a-button danger type="text"><delete-outlined /></a-button>
                     </a-popconfirm>
              </div>
       </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNotesStore } from '@/stores/notesStore';
import { useFoldersStore } from '@/stores/foldersStore';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import { getAuth } from 'firebase/auth';
import Note from '@/components/NoteComponent.vue';
import SharedNote from '@/components/SharedNoteComponent.vue';
import SkeletonNote from '@/components/SkeletonNote.vue';
import { SettingOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import type { NoteType } from '@/types/Note';
import type { SharedNoteType } from '@/types/SharedNote';
import type { FolderType } from '@/types/Folder';
import { message } from 'ant-design-vue';
import router from '@/router';

const route = useRoute();
const notesStore = useNotesStore();
const foldersStore = useFoldersStore();
const sharedNotesStore = useSharedNotesStore();

const loading = ref(true);

const auth = getAuth();
const currentUserId = auth.currentUser?.uid;

onMounted(async () => {
       loading.value = true;
       try {
              await notesStore.fetchAndStoreNotes();
              await foldersStore.fetchFolders();
              await sharedNotesStore.fetchAllNotes(); // Fetch notes shared with the user
       } finally {
              loading.value = false;
       }
});

const folderName = computed(() => route.params.folderName as string);

const folderId = computed(() => {
       const folder = foldersStore.folders.find(f => f.name === folderName.value);
       return folder ? folder.id : null;
});

const filteredNotesByFolder = computed<NoteType[]>(() => {
       return notesStore.notes
              .filter(note => note.folderId === folderId.value && !note.isArchived && !note.isDeleted);
});

const sharedNotesByFolder = computed<SharedNoteType[]>(() => {
       if (!currentUserId) return [];
       return sharedNotesStore.allNotes
              .filter(note => note.users[currentUserId].folderId === folderId.value && !note.users[currentUserId].isArchived && !note.users[currentUserId].isDeleted);
});

const AllNotes = computed(() => {
       return [
              ...filteredNotesByFolder.value.map(note => ({ type: 'owned' as const, note })),
              ...sharedNotesByFolder.value.map(note => ({ type: 'shared' as const, note }))
       ].sort((a, b) => {
              const dateA = a.note.updatedDate ? new Date(a.note.updatedDate).getTime() : new Date(a.note.createdDate).getTime();
              const dateB = b.note.updatedDate ? new Date(b.note.updatedDate).getTime() : new Date(b.note.createdDate).getTime();
              return dateB - dateA;
       });
});

const folderColor = computed(() => {
       const folder = foldersStore.folders.find(f => f.name === folderName.value);
       return folder ? folder.color : null;
});

const newFolderColor = ref(folderColor.value);
const isModalVisible = ref(false);
const newFolderName = ref(folderName.value);
const isModifyingFolderLoading = ref(false);

const openModal = () => {
       isModalVisible.value = true;
};

watch(route, () => {
       notesStore.fetchAndStoreNotes();
});

const updateCurrentFolder = () => {
       isModalVisible.value = true;
       isModifyingFolderLoading.value = true;

       if (!newFolderName.value.trim()) {
              message.warning('Please enter a folder name');
              isModifyingFolderLoading.value = false;
              return;
       }
       if (!newFolderColor.value) {
              message.warning('Please select a color');
              isModifyingFolderLoading.value = false;
              return;
       }
       if ((newFolderName.value === folderName.value) && (newFolderColor.value === folderColor.value)) {
              message.warning('Please change the folder name or color');
              isModifyingFolderLoading.value = false;
              return;
       }
       if (!folderId.value) {
              message.warning('Folder not found');
              isModifyingFolderLoading.value = false;
              return;
       }

       const existingFolder = foldersStore.folders.find(f => f.id === folderId.value);
       if (!existingFolder) {
              message.warning('Folder not found');
              isModifyingFolderLoading.value = false;
              return;
       };

       const updatedFolder: FolderType = {
              id: folderId.value,
              name: newFolderName.value,
              color: newFolderColor.value,
              createdDate: existingFolder.createdDate,
              updatedDate: new Date(),
              numberOfNotes: existingFolder.numberOfNotes
       };

       try {
              foldersStore.updateFolder(updatedFolder);

              if (folderName.value !== newFolderName.value) router.push(`/notes/folder/${newFolderName.value}`);
              message.success('Folder updated successfully');
              isModalVisible.value = false;
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     message.error('An error occurred while updating the folder');
              }
       }
       isModifyingFolderLoading.value = false;
};

const deleteFolder = () => {
       isModifyingFolderLoading.value = true;

       if (!folderId.value) {
              message.warning('Folder not found');
              isModifyingFolderLoading.value = false;
              return;
       }

       try {
              foldersStore.deleteFolder(folderId.value);
              notesStore.fetchAndStoreNotes();
              router.push('/notes');
              message.success('Folder deleted successfully');
              isModalVisible.value = false;
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     message.error('An error occurred while deleting the folder');
              }
       }
       isModifyingFolderLoading.value = false;
};
</script>
<template>
       <a-drawer v-model:open="localIsOpen" root-class-name="root-class-name"
              :root-style="{ color: 'blue' }" style="color: red" placement="left" @after-open-change="afterOpenChange" :closable="false" >

              <a-menu :inlineCollapsed="isCollapsed" :inlineIndent="inLineIndentValue" class="h-full pt-3 bg-transparent !border-0"
                     v-model:selectedKeys="current" :mode="menuMode" :items="items" @click="handleMenuClick" />
              <a-modal v-model:open="isModalVisible" title="Create New Tag" @cancel="handleCancel">
                     <div class="flex flex-row">
                            <a-input placeholder="Enter tag name" v-model:value="newTagName" />
                            <a-input type="color" class="ml-2" style="width: 50px;" v-model:value="newTagColor" />
                     </div>
                     <template #footer>
                            <a-button key="back" @click="handleCancel">Cancel</a-button>
                            <a-button key="submit" type="primary" @click="handleOk"
                                   :loading="isAddingTag">Add</a-button>
                     </template>
              </a-modal>
              <!-- Modal for creating a new folder -->
              <a-modal v-model:open="isFolderModalVisible" title="Create New Folder" @cancel="handleFolderCancel">
                     <div class="flex flex-row">
                            <a-input placeholder="Enter folder name" v-model:value="newFolderName" />
                            <a-input type="color" class="ml-2" style="width: 50px;" v-model:value="newFolderColor" />
                     </div>
                     <template #footer>
                            <a-button key="back" @click="handleFolderCancel">Cancel</a-button>
                            <a-button key="submit" type="primary" @click="handleFolderOk"
                                   :loading="isAddingFolder">Add</a-button>
                     </template>
              </a-modal>
       </a-drawer>
</template>

<script lang="ts" setup>
import { h, ref, onMounted, watch, watchEffect } from 'vue';
import { TagsOutlined, UnorderedListOutlined, FolderOutlined, PlusCircleOutlined, PushpinOutlined, DeleteOutlined, InboxOutlined, LockOutlined, ShareAltOutlined, MailOutlined, CrownOutlined, LoginOutlined } from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import type { TagType } from '@/types/Tag';
import type { FolderType } from '@/types/Folder';
import { useTagsStore } from '@/stores/tagsStore';
import { useFoldersStore } from '@/stores/foldersStore';
import { useNotesStore } from '@/stores/notesStore';
import { useRoute, useRouter } from 'vue-router';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import { getAuth } from 'firebase/auth';
import { useInvitationStore } from '@/stores/invitationsStore';

const invitationStore = useInvitationStore();
const sharedNotesStore = useSharedNotesStore();
const menuMode = ref('inline');
const isCollapsed = ref(false);
const inLineIndentValue = ref(24);
const isModalVisible = ref(false);
const isFolderModalVisible = ref(false);
const newTagName = ref('');
const newTagColor = ref('#000000');
const newFolderName = ref(''); // Folder name for the new folder
const newFolderColor = ref('#000000'); // Folder color for the new folder
const current = ref<string[]>([]);
const items = ref<MenuProps['items']>([]);
const isAddingTag = ref(false);
const isAddingFolder = ref(false);
const tagsStore = useTagsStore();
const foldersStore = useFoldersStore();
const notesStore = useNotesStore();
const userHasPinNote = ref(false);
const userHasDeletedNote = ref(false);
const userHasArchivedNote = ref(false);
const userHasSharedNote = ref(false);
const userHasSharedNoteWithMe = ref(false);
const userHasInvitation = ref(false);
const userHasMySharedNote = ref(false);
const sidebarClass = ref('w-1/6');
const props = defineProps<{ isOpen: boolean }>();
const localIsOpen = ref(props.isOpen);
const emit = defineEmits(['close']);

watch(() => props.isOpen, (newVal) => {
       localIsOpen.value = newVal;
});

const route = useRoute();
const router = useRouter();
const userId = getAuth().currentUser?.uid;

const afterOpenChange = (bool: boolean) => {
       if (!bool) {
              emit('close');
       }
};

async function handleOk() {
       isAddingTag.value = true;  // Start loading
       if (!newTagName.value.trim()) {
              message.warning('Please enter a tag name');
              isAddingTag.value = false;
              return;
       }
       const newTag: TagType = {
              id: Date.now().toString(),
              name: newTagName.value.trim(),
              color: newTagColor.value,
              createdDate: new Date(),
              updatedDate: new Date(),
              numberOfNotes: 0,
       };
       try {
              await tagsStore.addTag(newTag); // Use the store action to add the tag
              message.success('Tag added successfully');
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     message.error('An unknown error occurred.');
              }
       }
       isAddingTag.value = false;
       isModalVisible.value = false;
       newTagName.value = '';
       newTagColor.value = '#000000';
}

async function handleFolderOk() {
       isAddingFolder.value = true;  // Start loading
       if (!newFolderName.value.trim()) {
              message.warning('Please enter a folder name');
              isAddingFolder.value = false;
              return;
       }
       try {
              const newFolder: FolderType = {
                     id: Date.now().toString(),
                     name: newFolderName.value.trim(),
                     color: newFolderColor.value,
                     createdDate: new Date(),
                     updatedDate: new Date(),
                     numberOfNotes: 0,
              };
              await foldersStore.addFolder(newFolder); // Use the store action to add the folder
              message.success('Folder added successfully');
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     message.error('An unknown error occurred.');
              }
       }
       isAddingFolder.value = false;
       isFolderModalVisible.value = false;
       newFolderName.value = '';
       newFolderColor.value = '#000000';
}

const showModal = () => {
       isModalVisible.value = true;
       newTagName.value = '';
};

const showFolderModal = () => {
       isFolderModalVisible.value = true;
       newFolderName.value = '';
       newFolderColor.value = '#000000';
};

const handleCancel = () => {
       isModalVisible.value = false;
       newTagName.value = '';
       newTagColor.value = '#000000';
};

const handleFolderCancel = () => {
       isFolderModalVisible.value = false;
       newFolderName.value = '';
       newFolderColor.value = '#000000';
};

const handleMenuClick = (e: any) => {
       current.value = [e.key];
};

const updateMenuItems = () => {
       const fetchedTags = tagsStore.tags.map(tag => ({
              label: tag.name,
              key: tag.id,
              style: { color: tag.color },
              onClick: () => {
                     router.push(`/notes/tag/${tag.name}`);
              },
       }));

       const fetchedFolders = foldersStore.folders.map(folder => ({
              label: folder.name,
              key: folder.name,
              style: { color: folder.color },
              onClick: () => {
                     router.push(`/notes/folder/${folder.name}`);
              },
       }));

       const menuItems: MenuProps['items'] = [
              {
                     key: 'notes',
                     icon: () => h(UnorderedListOutlined),
                     label: 'All notes',
                     title: 'All notes',
                     onClick: () => router.push('/notes'),
              },
              {
                     key: 'Private',
                     icon: () => h(LockOutlined),
                     label: 'Private notes',
                     title: 'Private notes',
                     onClick: () => router.push('/notes/private'),
              },
       ];

       // Conditionally add Pinned Notes section
       if (userHasPinNote.value) {
              menuItems.push({
                     key: 'Pinned notes',
                     icon: () => h(PushpinOutlined),
                     label: 'Pinned',
                     title: 'Pinned',
                     onClick: () => router.push('/notes/pinned'),
              });
       }

       // Add the divider before Shared Notes section if there are any shared notes sections to display
       if (userHasSharedNote.value || userHasMySharedNote.value || userHasSharedNoteWithMe.value || userHasInvitation.value) {
              menuItems.push({ type: 'divider' } as any);

              const sharedChildren = [];

              if (userHasSharedNote.value) {
                     sharedChildren.push({
                            label: 'All shared notes',
                            key: 'All shared notes',
                            icon: () => h(UnorderedListOutlined),
                            onClick: () => router.push('/notes/all-shared-notes'),
                     });
              }

              if (userHasMySharedNote.value) {
                     sharedChildren.push({
                            label: 'My shared notes',
                            key: 'My shared notes',
                            icon: () => h(CrownOutlined),
                            onClick: () => router.push('/notes/my-shared-notes'),
                     });
              }

              if (userHasSharedNoteWithMe.value) {
                     sharedChildren.push({
                            label: 'Notes shared with me',
                            key: 'Notes shared with me',
                            icon: () => h(LoginOutlined),
                            onClick: () => router.push('/notes/notes-shared-with-me'),
                     });
              }

              if (userHasInvitation.value) {
                     sharedChildren.push({
                            label: 'Invitations',
                            key: 'Invitations',
                            icon: () => h(MailOutlined),
                            onClick: () => router.push('/notes/invitations'),
                     });
              }

              menuItems.push({
                     key: 'Shared',
                     icon: () => h(ShareAltOutlined),
                     label: 'Shared Notes',
                     title: 'Shared Notes',
                     children: sharedChildren,
              });
       }

       // Add a divider before Folders if there are Tags, Shared Notes, or Pinned Notes sections
       if (fetchedTags.length > 0 || menuItems.length > 2) {
              menuItems.push({ type: 'divider' } as any);
       }

       menuItems.push({
              key: 'Folders',
              icon: () => h(FolderOutlined),
              label: 'Folders',
              title: 'Folders',
              children: [
                     ...fetchedFolders,
                     { type: 'divider' } as any,
                     {
                            label: 'Create new folder',
                            key: 'Create new folder',
                            icon: () => h(PlusCircleOutlined),
                            onClick: () => showFolderModal(),
                     },
              ],
       });

       // Conditionally add Tags section
       menuItems.push({
              key: 'Tags',
              icon: () => h(TagsOutlined),
              label: 'Tags',
              title: 'Tags',
              children: [
                     ...fetchedTags,
                     { type: 'divider' } as any,
                     {
                            label: 'Create new tag',
                            key: 'Create new tag',
                            icon: () => h(PlusCircleOutlined),
                            onClick: () => showModal(),
                     },
              ],
       });

       // Add divider after Tags only if there is an item after Tags (Archived or Deleted)
       if (userHasArchivedNote.value || userHasDeletedNote.value) {
              menuItems.push({ type: 'divider' } as any);
       }

       // Conditionally add Archived section
       if (userHasArchivedNote.value) {
              menuItems.push({
                     key: 'Archived',
                     icon: () => h(InboxOutlined),
                     label: 'Archived',
                     title: 'Archived',
                     onClick: () => router.push('/notes/archived'),
              });
       }

       // Conditionally add Deleted section without a preceding divider
       if (userHasDeletedNote.value) {
              menuItems.push({
                     key: 'Deleted',
                     icon: () => h(DeleteOutlined),
                     label: 'Deleted',
                     title: 'Deleted',
                     onClick: () => router.push('/notes/deleted'),
              });
       }

       items.value = menuItems;
};

const updateSelectedKeys = (path: string) => {
       const decodedPath = decodeURIComponent(path); // Decode the path to handle spaces and special characters

       if (decodedPath.includes('/notes/tag/')) {
              const tagName = decodedPath.split('/notes/tag/')[1];
              const tag = tagsStore.tags.find(tag => tag.name === tagName);
              if (tag) {
                     current.value = [tag.id];
              }
       } else if (decodedPath.includes('/notes/folder/')) {
              const folderKey = decodedPath.split('/notes/folder/')[1];
              current.value = [folderKey];
       } else if (decodedPath.includes('/notes/pinned')) {
              current.value = ['Pinned notes'];
       } else if (decodedPath.includes('/notes/archived')) {
              current.value = ['Archived'];
       } else if (decodedPath.includes('/notes/deleted')) {
              current.value = ['Deleted'];
       } else if (decodedPath.includes('/notes/private')) {
              current.value = ['Private'];
       } else if (decodedPath.includes('/notes/all-shared-notes')) {
              current.value = ['Shared', 'All shared notes'];
       } else if (decodedPath.includes('/notes/invitations')) {
              current.value = ['Shared', 'Invitations'];
       } else if (decodedPath.includes('/notes/my-shared-notes')) {
              current.value = ['Shared', 'My shared notes'];
       } else if (decodedPath.includes('/notes/notes-shared-with-me')) {
              current.value = ['Shared', 'Notes shared with me'];
       } else {
              current.value = [decodedPath.replace('/notes', 'notes')];
       }
};

onMounted(async () => {
       try {
              await tagsStore.fetchTags();
              await foldersStore.fetchFolders();
              await sharedNotesStore.fetchAllNotes(); // Fetch all accessible notes
              await invitationStore.fetchInitialInvitations(); // Fetch all invitations
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     message.error('An unknown error occurred.');
              }
       }

       watch(() => route.path, (newPath) => {
              updateSelectedKeys(newPath);
       }, { immediate: true });
});


watch(() => tagsStore.tags, () => {
       updateMenuItems();
}, { deep: true });

watch(() => foldersStore.folders, () => {
       updateMenuItems();
}, { deep: true });

watchEffect(() => {
       if (!userId) return;
       userHasPinNote.value = notesStore.notes.some(note => note.isPinned) ||
              sharedNotesStore.allNotes.some(note => note.users && userId && note.users[userId]?.isPinned);

       userHasDeletedNote.value = notesStore.notes.some(note => note.isDeleted) ||
              sharedNotesStore.allNotes.some(note => note.users && userId && note.users[userId]?.isDeleted);

       userHasArchivedNote.value = notesStore.notes.some(note => note.isArchived) ||
              sharedNotesStore.allNotes.some(note => note.users && userId && note.users[userId]?.isArchived);

       userHasSharedNote.value = sharedNotesStore.allNotes.some(note => note.users && note.users[userId] && !note.users[userId].isDeleted && !note.users[userId].isArchived);
       userHasSharedNoteWithMe.value = sharedNotesStore.allNotes.some(note => userId !== note.owner && note.users && note.users[userId] && !note.users[userId].isDeleted && !note.users[userId].isArchived);
       userHasMySharedNote.value = sharedNotesStore.allNotes.some(note => userId === note.owner);
       userHasInvitation.value = invitationStore.countInvitations() > 0;

       updateMenuItems();
});

watch(() => sharedNotesStore.allNotes, () => {
       updateMenuItems();
}, { deep: true });
</script>
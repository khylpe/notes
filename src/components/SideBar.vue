<template>
       <div :class="sidebarClass">
              <a-menu :inlineCollapsed="isCollapsed" :inlineIndent="inLineIndentValue" :class="sidebarClass"
                     class="h-full fixed pt-3" v-model:selectedKeys="current" :mode="menuMode" :items="items"
                     @click="handleMenuClick" />
       </div>
       <a-modal v-model:open="isModalVisible" title="Create New Tag" @cancel="handleCancel">
              <div class="flex flex-row">
                     <a-input placeholder="Enter tag name" v-model:value="newTagName" />
                     <a-input type="color" class="ml-2" style="width: 50px;" v-model:value="newTagColor" />
              </div>
              <template #footer>
                     <a-button key="back" @click="handleCancel">Cancel</a-button>
                     <a-button key="submit" type="primary" @click="handleOk" :loading="isAddingTag">Add</a-button>
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
</template>

<script lang="ts" setup>
import { h, ref, onMounted, onUnmounted, watch, watchEffect } from 'vue';
import { TagsOutlined, UnorderedListOutlined, FolderOutlined, PlusCircleOutlined, PushpinOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import type { TagType } from '@/types/Tag';
import type { FolderType } from '@/types/Folder';
import { useTagsStore } from '@/stores/tagsStore';
import { useFoldersStore } from '@/stores/foldersStore';
import { useNotesStore } from '@/stores/notesStore';
import { useRoute, useRouter } from 'vue-router';

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
const sidebarClass = ref('w-1/6');

const route = useRoute();
const router = useRouter();

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

const updateMenuMode = () => {
       const width = window.innerWidth;
       menuMode.value = width < 992 ? 'vertical' : 'inline';
       isCollapsed.value = width < 992;

       if (width < 768) {
              inLineIndentValue.value = 0;
              sidebarClass.value = 'w-[10%]';
       } else if (width < 1000) {
              inLineIndentValue.value = 0;
              sidebarClass.value = 'w-[10%]';
       } else if (width < 1200) {
              inLineIndentValue.value = 24;
              sidebarClass.value = 'w-[15%]';
       } else {
              inLineIndentValue.value = 32;
              sidebarClass.value = 'w-[15%]';

       }
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
                     label: 'My notes',
                     title: 'My notes',
                     onClick: () => router.push('/notes'),
              },
              { type: 'divider' } as any,  // Divider between Tags and Archived

              {
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
              },
              {
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
              },
              { type: 'divider' } as any,  // Divider between Tags and Archived
              {
                     key: 'Archived',
                     icon: () => h(InboxOutlined),
                     label: 'Archived',
                     title: 'Archived',
                     onClick: () => router.push('/notes/archived'),
              },
              {
                     key: 'Deleted',
                     icon: () => h(DeleteOutlined),
                     label: 'Deleted',
                     title: 'Deleted',
                     onClick: () => router.push('/notes/deleted'),
              },
       ];

       if (userHasPinNote.value) {
              menuItems.splice(1, 0, {
                     key: 'Pinned notes',
                     icon: () => h(PushpinOutlined),
                     label: 'Pinned',
                     title: 'Pinned',
                     onClick: () => router.push('/notes/pinned'),
              });
       }
       items.value = menuItems;
};

const updateSelectedKeys = (path: string) => {
       if (path.includes('/notes/tag/')) {
              const tagName = path.split('/notes/tag/')[1];
              const tag = tagsStore.tags.find(tag => tag.name === tagName);
              if (tag) {
                     current.value = [tag.id];
              }
       } else if (path.includes('/notes/folder/')) {
              const folderKey = path.split('/notes/folder/')[1];
              current.value = [folderKey];
       } else if (path.includes('/notes/pinned')) {
              current.value = ['Pinned notes'];
       } else if (path.includes('/notes/archived')) {
              current.value = ['Archived'];
       } else if (path.includes('/notes/deleted')) {
              current.value = ['Deleted'];
       } else {
              current.value = [path.replace('/notes', 'notes')];
       }
};

onMounted(async () => {
       window.addEventListener('resize', updateMenuMode);
       updateMenuMode();

       try {
              await tagsStore.fetchTags();
              await foldersStore.fetchFolders();
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

onUnmounted(() => {
       window.removeEventListener('resize', updateMenuMode);
});

watch(() => tagsStore.tags, () => {
       updateMenuItems();
}, { deep: true });

watch(() => foldersStore.folders, () => {
       updateMenuItems();
}, { deep: true });

watchEffect(() => {
       userHasPinNote.value = notesStore.notes.some(note => note.isPinned);
       updateMenuItems();
});
</script>
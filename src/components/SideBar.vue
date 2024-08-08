<template>
       <div :class="sidebarClass">
                <a-menu :inlineCollapsed="isCollapsed" :inlineIndent="inLineIndentValue" :class="sidebarClass" class="h-full fixed pt-3"
                             v-model:selectedKeys="current" :mode="menuMode" :items="items" @click="handleMenuClick" />
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
</template>

<script lang="ts" setup>
import { h, ref, onMounted, onUnmounted, watch, watchEffect } from 'vue';
import { TagsOutlined, UnorderedListOutlined, FolderOutlined, PlusCircleOutlined, PushpinOutlined } from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import type { TagType } from '@/types/Tag';
import { useTagsStore } from '@/stores/tagsStore';
import { useNotesStore } from '@/stores/notesStore';
import { useRoute, useRouter } from 'vue-router';

const menuMode = ref('inline');
const isCollapsed = ref(false);
const inLineIndentValue = ref(24);
const isModalVisible = ref(false);
const newTagName = ref('');
const newTagColor = ref('#000000');
const current = ref<string[]>([]);
const items = ref<MenuProps['items']>([]);
const isAddingTag = ref(false);
const tagsStore = useTagsStore();
const notesStore = useNotesStore();
const userHasPinNote = ref(false);
const sidebarClass = ref('w-1/6');

const route = useRoute();
const router = useRouter();

async function handleOk() {
       isAddingTag.value = true;  // Start loading
       if (!newTagName.value.trim()) {
              message.warning('Please enter a tag name')
              isAddingTag.value = false;
              return;
       }
       const newTag: TagType = {
              id: Date.now().toString(), // Generate a unique ID for the tag
              name: newTagName.value.trim(),
              color: newTagColor.value, // Use the selected color
              createdDate: new Date(),
              numberOfNotes: 0,
       };
       try {
              await tagsStore.addTag(newTag); // Use the store action to add the tag
              message.success('Tag added successfully');
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     // Handle non-Error objects
                     message.error('An unknown error occurred.');
              }
       }
       isAddingTag.value = false;  // Stop loading
       isModalVisible.value = false;
       newTagName.value = '';
       newTagColor.value = '#000000'; // Reset the color
}

const showModal = () => {
       isModalVisible.value = true;
       newTagName.value = '';
};

const handleCancel = () => {
       isModalVisible.value = false;
       newTagName.value = '';
       newTagColor.value = '#000000';
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

       const menuItems = [
              {
                     key: 'notes',
                     icon: () => h(UnorderedListOutlined),
                     label: 'My notes',
                     title: 'My notes',
                     onClick: () => router.push('/notes'),
              },
              {
                     key: 'Folders',
                     icon: () => h(FolderOutlined),
                     label: 'Folders',
                     title: 'Folders',
                     children: [
                            {
                                   label: 'Archived',
                                   key: 'archived', // Make sure this matches the route
                                   onClick: () => router.push('/notes/folder/archived'),
                            },
                            { type: 'divider' },
                            {
                                   label: 'Deleted',
                                   key: 'deleted', // Make sure this matches the route
                                   onClick: () => router.push('/notes/folder/deleted'),
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
                            { type: 'divider' },
                            {
                                   label: 'Create new tag',
                                   key: 'Create new tag',
                                   icon: () => h(PlusCircleOutlined),
                                   onClick: () => showModal(),
                            },
                     ],
              },
       ];

       if (userHasPinNote.value) {
              menuItems.splice(1, 0, {
                     key: 'Pinned notes',
                     icon: () => h(PushpinOutlined),
                     label: 'My pinned notes',
                     title: 'My pinned notes',
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
              current.value = [folderKey]; // Changed this line
       } else if (path.includes('/notes/pinned')) {
              current.value = ['Pinned notes'];
       } else {
              current.value = [path.replace('/notes', 'notes')];
       }
};

onMounted(async () => {
       window.addEventListener('resize', updateMenuMode);
       updateMenuMode();

       try {
              await tagsStore.fetchTags();
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

watchEffect(() => {
       userHasPinNote.value = notesStore.notes.some(note => note.isPinned);
       updateMenuItems();
});
</script>

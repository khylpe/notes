<template>
       <div class="w-1/6">
              <a-menu :inlineCollapsed="isCollapsed" :inlineIndent="inLineIndentValue" class="h-full fixed w-1/6 pt-3"
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

const route = useRoute();
const router = useRouter();

const handleOk = async () => {
       // Handle adding a new tag
};

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
       menuMode.value = width < 768 ? 'vertical' : 'inline';
       isCollapsed.value = width < 768;

       if (width < 768) {
              inLineIndentValue.value = 0;
       } else if (width < 992) {
              inLineIndentValue.value = 5;
       } else if (width < 1200) {
              inLineIndentValue.value = 24;
       } else {
              inLineIndentValue.value = 32;
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
                                   label: 'Archives',
                                   key: 'archive', // Make sure this matches the route
                                   onClick: () => router.push('/notes/folder/archive'),
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

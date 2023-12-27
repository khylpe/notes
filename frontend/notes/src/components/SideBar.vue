<template>
       <div class="col col-2 mt3">
              <a-menu :inlineCollapsed="isCollapsed" :inlineIndent="inLineIndentValue" class="h-100 fixed col col-2"
                     v-model:selectedKeys="current" :mode="menuMode" :items="items" @click="handleMenuClick" />
       </div>
       <a-modal v-model:open="isModalVisible" title="Create New Tag" @ok="handleOk" @cancel="handleCancel">
              <div class="flex flex-row">
                     <a-input placeholder="Enter tag name" v-model:value="newTagName" />
                     <a-input type="color" class="ml2" style="width: 50px;" v-model:value="newTagColor" /> <!-- Color input -->
              </div>
              <template #footer>
                     <a-button key="back" @click="handleCancel">Cancel</a-button>
                     <a-button key="submit" type="primary" @click="handleOk" :loading="isAddingTag">Add</a-button>
              </template>
       </a-modal>
</template>

<script lang="ts" setup>
import { h, ref, onMounted, onUnmounted, watch } from 'vue';
import { TagsOutlined, UnorderedListOutlined, FolderOutlined, PlusCircleOutlined, PushpinOutlined, SettingOutlined } from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import type { TagType } from '@/types/Tag';
import { useTagsStore } from '@/stores/tagsStore'; // Import the tags store
import router from "@/router";

const menuMode = ref('inline');
const isCollapsed = ref(false);
const inLineIndentValue = ref(24);
const isModalVisible = ref(false);
const newTagName = ref('');
const newTagColor = ref('#000000'); // Default color
const current = ref<string[]>();
const items = ref<MenuProps['items']>([]);
const isAddingTag = ref(false);
const tagsStore = useTagsStore(); // Use the tags store

interface FetchedTag {
       label: string;
       key: string;
       style: {
              color: string;
       };
}
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

       await tagsStore.addTag(newTag); // Use the store action to add the tag

       isAddingTag.value = false;  // Stop loading
       isModalVisible.value = false;
       newTagName.value = '';
       newTagColor.value = '#000000'; // Reset the color
       await tagsStore.fetchTags(); // Fetch tags again after adding a new one
}
function showModal() {
       isModalVisible.value = true;
       newTagName.value = '';  // Reset the input field when modal is shown
}
function handleCancel() {
       isModalVisible.value = false;
       newTagName.value = '';
       newTagColor.value = '#000000'; // Reset the color
}
function updateMenuMode() {
       const width = window.innerWidth;
       menuMode.value = width < 768 ? 'vertical' : 'inline'; // Change 768 to your desired breakpoint
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
       // 1150
}
function handleMenuClick(e: any) {
       current.value = [e.key];
}
const updateMenuItems = (fetchedTags: FetchedTag[]) => {
       items.value = [
              {
                     // style: { marginTop: '50px' },
                     key: 'My pinned notes',
                     icon: () => h(PushpinOutlined),
                     label: 'My pinned notes',
                     title: 'My pinned notes',
                     onClick: () => {
                     },
              },
              {
                     key: 'My notes',
                     icon: () => h(UnorderedListOutlined),
                     label: 'My notes',
                     title: 'My notes',
                     onClick: () => {
                            router.push('/notes');
                     },
              },
              {
                     key: 'Folders',
                     icon: () => h(FolderOutlined),
                     label: 'Folders',
                     title: 'Folders',

                     children: [
                            {
                                   label: 'Archives',
                                   key: 'Archives',
                            },
                            { type: 'divider' },
                            {
                                   label: 'Deleted',
                                   key: 'Deleted',
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
};
onMounted(() => {
       window.addEventListener('resize', updateMenuMode);
       updateMenuMode(); // Initial check
       tagsStore.fetchTags(); // Fetch tags using the store
});
onUnmounted(() => {
       window.removeEventListener('resize', updateMenuMode);
});
watch(() => tagsStore.tags, (newTags) => {
       const fetchedTags = newTags.map(tag => ({
              label: tag.name,
              key: tag.id,
              style: { color: tag.color }
       }));
       updateMenuItems(fetchedTags);
}, { deep: true });
</script>
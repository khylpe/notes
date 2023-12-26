<template>
       <div class="col col-2">
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
import { h, ref, onMounted, onUnmounted } from 'vue';
import { TagsOutlined, UnorderedListOutlined, FolderOutlined, PlusCircleOutlined, PushpinOutlined, SettingOutlined } from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import { Modal } from 'ant-design-vue';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { TagType } from '@/types/Tag';
import router from "@/router";

const menuMode = ref('inline');
const isCollapsed = ref(false);
const inLineIndentValue = ref(24);
const isModalVisible = ref(false);
const newTagName = ref('');
const current = ref<string[]>();
const items = ref<MenuProps['items']>([]);
const isAddingTag = ref(false);
const newTagColor = ref('#000000'); // Default color

interface FetchedTag {
       label: string;
       key: string;
}
async function handleOk() {
       isAddingTag.value = true;  // Start loading

       const auth = getAuth();
       const user = auth.currentUser;

       if (user && newTagName.value.trim()) {
              const db = getFirestore();
              const tagId = Date.now().toString(); // Generate a unique ID for the tag
              const newTag: TagType = {
                     id: tagId,
                     name: newTagName.value,
                     color: newTagColor.value, // Use the selected color
                     createdDate: new Date(),
                     numberOfNotes: 0,
              };

              try {
                     await setDoc(doc(db, `users/${user.uid}/tags/${tagId}`), newTag);
                     console.log('Tag added successfully');
                     await fetchTags(); // Fetch tags again after adding a new one
              } catch (error) {
                     console.error('Error adding tag:', error);
              }
       }

       isAddingTag.value = false;  // Stop loading
       isModalVisible.value = false;
       newTagName.value = '';
       newTagColor.value = '#000000'; // Reset the color
}

function showModal() {
       isModalVisible.value = true;
       newTagName.value = '';  // Reset the input field when modal is shown
}
function handleCancel() {
       isModalVisible.value = false;
       newTagName.value = '';
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
const fetchTags = async () => {
       const auth = getAuth();
       const user = auth.currentUser;

       if (user) {
              const db = getFirestore();
              const tagsQuery = query(collection(db, `users/${user.uid}/tags`));
              const querySnapshot = await getDocs(tagsQuery);

              const fetchedTags = querySnapshot.docs.map(doc => ({
                     label: doc.data().name,
                     key: doc.id,
                     style: {
                            color: doc.data().color, // Apply the tag color
                     }
              }));


              updateMenuItems(fetchedTags);
       }
};
const updateMenuItems = (fetchedTags: FetchedTag[]) => {
       // Assuming 'items' originally contains only static entries
       items.value = [
              {
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
       fetchTags(); // Fetch tags when component is mounted
});
onUnmounted(() => {
       window.removeEventListener('resize', updateMenuMode);
});
</script>
<template>
       <a-card :style="{ boxShadow: hover ? `0px 0px 10px 0px ${noteFolderColor}` : 'none' }" :tab-list="tabList"
              :active-tab-key="key" @tabChange="onTabChange"
              class="w-[300px] sm:w-[550px] md:w-[550px] lg:w-[750px] xl:w-[800px] 2xl:w-[1000px] p-0"
              @mouseenter="hover = true" @mouseleave="hover = false">
              <template #customTab="item">
                     <span v-if="item.key === 'Settings'">
                            <setting-outlined />
                            {{ item.key }}
                     </span>
              </template>

              <template #actions>
                     <a-tooltip v-if="key === 'Note' && canEdit" :title="isEditMode ? 'View Markdown' : 'Edit Content'">
                            <template v-if="isEditMode">
                                   <eye-outlined @click="toggleEditMode" />
                            </template>
                            <template v-else>
                                   <edit-outlined @click="toggleEditMode" />
                            </template>
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Note'" title="View full screen">
                            <expand-alt-outlined @click="showFullScreenModal" key="expandIcon" />
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Settings'">
                            <template #title v-if="userId && editableNote.users[userId].isPinned">Unpin</template>
                            <template #title v-else-if="userId && !editableNote.users[userId].isPinned">Pin</template>

                            <pushpin-outlined :style="{ color: pinIconColor }" @mouseenter="onMouseEnterPinIcon"
                                   @mouseleave="onMouseLeavePinIcon" @click="pinIconClicked" key="pinIcon" />
                     </a-tooltip>

                     <!-- Conditional rendering based on note status -->
                     <a-tooltip v-if="key === 'Settings' && userId && !editableNote.users[userId].isDeleted"
                            title="Move to deleted folder">
                            <delete-outlined @click="moveToDeletedFolder" key="moveToDeletedFolder" />
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Settings' && userId && editableNote.users[userId].isDeleted"
                            title="Delete permanently">
                            <a-popconfirm title="Are you sure you want to permanently delete this note?" ok-text="Yes"
                                   cancel-text="No" @confirm="deleteNote">
                                   <delete-outlined key="deleteNote" />
                            </a-popconfirm>
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Settings' && userId && !editableNote.users[userId].isArchived"
                            title="Move to archives">
                            <inbox-outlined @click="moveToArchiveFolder" key="moveToArchiveFolder" />
                     </a-tooltip>

                     <a-tooltip
                            v-if="(key === 'Settings' && userId) && (editableNote.users[userId].isArchived || editableNote.users[userId].isDeleted)"
                            title="Move to notes list">
                            <unordered-list-outlined @click="moveToMyNotes" key="moveToMyNotes" />
                     </a-tooltip>
              </template>

              <template #title>
                     <div v-if="canEdit && isEditMode">
                            <a-input spellcheck="false" placeholder="Your title" :bordered="false" size="large"
                                   v-model:value="editableNote.title" :maxlength="100" @input="onTitleInput" />
                     </div>
                     <div v-else>
                            <span>{{ editableNote.title }}</span>
                     </div>
              </template>

              <template v-if="key === 'Note'">
                     <a-card-meta style="min-height: 200px;">
                            <template #description>
                                   <div v-if="isEditMode && canEdit">
                                          <a-textarea spellcheck="false" :autoSize="{ minRows: 2, maxRows: 10 }"
                                                 placeholder="Content of your note!" :bordered="false" :rows="8"
                                                 v-model:value="editableNote.content" @input="onContentInput" />
                                   </div>
                                   <div v-else>
                                          <div v-if="editableNote.content.length > 250">
                                                 <div v-html="truncatedMarkdown" class="!text-[#dfd9d9] markdowndiv">
                                                 </div>
                                                 <a v-if="!showFullContent" @click="toggleFullContent">Show More</a>
                                                 <a v-if="showFullContent" @click="toggleFullContent">Show Less</a>
                                          </div>
                                          <div v-else>
                                                 <div class="!text-[#dfd9d9] markdowndiv" v-html="compiledMarkdown">
                                                 </div>
                                          </div>
                                   </div>
                            </template>
                     </a-card-meta>
              </template>

              <template v-if="key === 'Settings'">
                     <!-- Settings content here -->
                     <a-card-meta style="min-height: 200px;">
                            <template #description>
                                   <div class="flex justify-center">
                                          <a-select :allowClear="true" v-model:value="selectedFolder"
                                                 placeholder="Select folder" style="width: 150px"
                                                 :options="folderOptions" @change="handleFolderChange">
                                                 <template #suffixIcon><folder-outlined /></template>
                                          </a-select>
                                   </div>
                                   <div class="flex justify-center mt-3">
                                          <a-select mode="multiple" :allowClear="true" v-model:value="selectedTags"
                                                 placeholder="Select tags" style="width: 150px" :options="tagOptions"
                                                 @change="handleTagChange"
                                                 :filterOption="filterTagOption" @search="handleTagSearch">
                                                 <template #suffixIcon><tags-outlined /></template>
                                          </a-select>
                                   </div>

                                   <!-- Display the list of users -->
                                   <div class="mt-5">
                                          <a-list :dataSource="usersArray">
                                                 <template #renderItem="{ item: user }">
                                                        <a-list-item
                                                               class="flex flex-col md:flex-row gap-5 items-start">
                                                               <div class="flex flex-row w-full">
                                                                      <a-avatar
                                                                             :src="user.imageUrl || 'https://via.placeholder.com/50'" />
                                                                      <div class="ml-3 w-4/5 flex flex-col">
                                                                             <a-typography-text
                                                                                    :ellipsis="{ rows: 1 }">{{
                                                                                           user.username ||
                                                                                           'Unknown User'
                                                                                    }}</a-typography-text>
                                                                             <span class="user-email">{{ user.email ||
                                                                                    'No Email Provided' }}</span>
                                                                      </div>
                                                               </div>

                                                               <div class="flex flex-row">
                                                                      <a-tooltip v-if="user.uuid !== note.owner"
                                                                             :title="undefined">
                                                                             <template #title>
                                                                                    <span
                                                                                           v-html="getInviteTooltip(user)"></span>
                                                                             </template>
                                                                             <a-tag
                                                                                    :color="user.inviteStatus === 'accepted' ? 'green' : (user.inviteStatus === 'pending' ? 'blue' : 'red')">
                                                                                    {{ user.inviteStatus }}
                                                                             </a-tag>
                                                                      </a-tooltip>

                                                                      <!-- Add toggle for write permissions -->
                                                                      <a-switch
                                                                             v-if="user.uuid !== note.owner && userId === note.owner"
                                                                             class="ml-0"
                                                                             :checked="user.rule === 'write'"
                                                                             @change="(checked: boolean) => updateWritePermission(user.uuid, checked)"
                                                                             checkedChildren="Write"
                                                                             unCheckedChildren="Read" />
                                                               </div>

                                                        </a-list-item>
                                                 </template>
                                          </a-list>
                                   </div>
                            </template>
                     </a-card-meta>
              </template>

              <template #extra>
                     <div class="flex items-center">
                            <div class="flex flex-row items-center gap-4">
                                   <!-- Display the list of users watching the note -->
                                   <div v-if="watchingUsers.length" class="flex items-center">
                                          <div class="mr-2">
                                                 <eye-outlined />
                                          </div>
                                          <div class="flex">
                                                 <a-tooltip v-for="user in watchingUsers" :key="user.uuid"
                                                        :title="user.username || 'Unknown User'">
                                                        <a-avatar :src="user.imageUrl" class="mr-1" />
                                                 </a-tooltip>
                                          </div>
                                   </div>

                                   <!-- Display the list of users writing the note -->
                                   <div v-if="writingUsers.length" class="flex items-center">
                                          <div class="mr-2">
                                                 <edit-outlined />
                                          </div>
                                          <div class="flex">
                                                 <a-tooltip v-for="user in writingUsers" :key="user.uuid"
                                                        :title="user.username || 'Unknown User'">
                                                        <a-avatar :src="user.imageUrl" class="mr-1" />
                                                 </a-tooltip>
                                          </div>
                                   </div>
                            </div>

                            <div class="flex items-center ml-5">
                                   <a-tag v-for="(tagId) in visibleTags" :key="tagId" class="hover:cursor-pointer"
                                          :color="getTagColor(tagId)"
                                          :style="{ color: getContrastColor(getTagColor(tagId)) }"
                                          @click="redirectToTag(tagId)">
                                          {{ getTagName(tagId) }}
                                   </a-tag>
                                   <a-tooltip v-if="hiddenTags.length > 0" placement="top" trigger="hover">
                                          <template #title>
                                                 <div class="flex flex-wrap">
                                                        <a-tag v-for="tagId in hiddenTags" :key="tagId"
                                                               class="mr-1 mb-1 hover:cursor-pointer"
                                                               :color="getTagColor(tagId)"
                                                               :style="{ color: getContrastColor(getTagColor(tagId)) }"
                                                               @click="redirectToTag(tagId)">
                                                               {{ getTagName(tagId) }}
                                                        </a-tag>
                                                 </div>
                                          </template>
                                          <span class="cursor-pointer">{{ isMobile ? hiddenTags.length + ' tags' : '+' +
                                                 hiddenTags.length + ' more' }}</span>
                                   </a-tooltip>



                            </div>
                            <a-tooltip class="ml-2">
                                   <template #title>
                                          <span v-html="datesTooltipTitle"></span>
                                   </template>
                                   <calendar-outlined />
                            </a-tooltip>
                     </div>
              </template>
       </a-card>

       <div>
              <a-modal v-model:open="isFullScreenModalVisible" width="100%" wrap-class-name="full-modal">
                     <template #title>
                            <div v-if="canEdit && isEditMode">
                                   <a-input spellcheck="false" placeholder="Your title" :bordered="false" size="large"
                                          class="p-0 m-0" v-model:value="editableNote.title" :maxlength="100"
                                          @input="onTitleInput" />
                            </div>
                            <div v-else>
                                   <span>{{ editableNote.title }}</span>
                            </div>
                     </template>

                     <div class="full-screen-modal-content">
                            <a-tabs v-model:activeKey="key" @change="onTabChange">
                                   <a-tab-pane key="Note" tab="Note">
                                          <div v-if="isEditMode && canEdit" class="textarea-container">
                                                 <a-textarea spellcheck="false" :autoSize="false"
                                                        placeholder="Content of your note!" :bordered="false"
                                                        v-model:value="editableNote.content" @input="onContentInput"
                                                        class="full-height-textarea !text-[#dfd9d9]" />
                                          </div>
                                          <div v-else>
                                                 <div class="!text-[#dfd9d9] markdowndiv" v-html="compiledMarkdown">
                                                 </div>
                                          </div>
                                   </a-tab-pane>
                                   <a-tab-pane key="Settings" tab="Settings">
                                          <div class="flex justify-center">
                                                 <a-select :allowClear="true" v-model:value="selectedFolder"
                                                        placeholder="Select folder" style="width: 150px"
                                                        :options="folderOptions" @change="handleFolderChange">
                                                        <template #suffixIcon><folder-outlined /></template>
                                                 </a-select>
                                          </div>
                                          <div class="flex justify-center mt-3">
                                                 <a-select mode="multiple" :allowClear="true"
                                                        v-model:value="selectedTags" placeholder="Select tags"
                                                        :filterOption="filterTagOption" @search="handleTagSearch"
                                                        style="width: 150px" :options="tagOptions"
                                                        @change="handleTagChange">
                                                        <template #suffixIcon><tags-outlined /></template>
                                                 </a-select>
                                          </div>

                                          <div class="mt-5">
                                                 <a-list :dataSource="usersArray">
                                                        <template #renderItem="{ item: user }">
                                                               <a-list-item
                                                                      class="flex flex-col md:flex-row gap-5 items-start">
                                                                      <div class="flex flex-row w-full">
                                                                             <a-avatar
                                                                                    :src="user.imageUrl || 'https://via.placeholder.com/50'" />
                                                                             <div class="ml-3 w-4/5 flex flex-col">
                                                                                    <a-typography-text
                                                                                           :ellipsis="{ rows: 1 }">{{
                                                                                                  user.username ||
                                                                                                  'Unknown User'
                                                                                           }}</a-typography-text>
                                                                                    <span class="user-email">{{
                                                                                           user.email ||
                                                                                           'No Email Provided' }}</span>
                                                                             </div>
                                                                      </div>

                                                                      <div class="flex flex-row">
                                                                             <a-tooltip v-if="user.uuid !== note.owner"
                                                                                    :title="undefined">
                                                                                    <template #title>
                                                                                           <span
                                                                                                  v-html="getInviteTooltip(user)"></span>
                                                                                    </template>
                                                                                    <a-tag
                                                                                           :color="user.inviteStatus === 'accepted' ? 'green' : (user.inviteStatus === 'pending' ? 'blue' : 'red')">
                                                                                           {{ user.inviteStatus }}
                                                                                    </a-tag>
                                                                             </a-tooltip>

                                                                             <!-- Add toggle for write permissions -->
                                                                             <a-switch
                                                                                    v-if="user.uuid !== note.owner && userId === note.owner"
                                                                                    class="ml-0"
                                                                                    :checked="user.rule === 'write'"
                                                                                    @change="(checked: boolean) => updateWritePermission(user.uuid, checked)"
                                                                                    checkedChildren="Write"
                                                                                    unCheckedChildren="Read" />
                                                                      </div>

                                                               </a-list-item>
                                                        </template>
                                                 </a-list>
                                          </div>
                                   </a-tab-pane>
                            </a-tabs>
                     </div>
                     <template #footer>
                            <div class="modal-footer">
                                   <a-tooltip v-if="key === 'Note' && canEdit"
                                          :title="isEditMode ? 'View Markdown' : 'Edit Content'">
                                          <template v-if="isEditMode">
                                                 <eye-outlined @click="toggleEditMode" />
                                          </template>
                                          <template v-else>
                                                 <edit-outlined @click="toggleEditMode" />
                                          </template>
                                   </a-tooltip>

                                   <a-divider type="vertical" v-if="canEdit" />

                                   <a-tooltip title="Exit full screen">
                                          <shrink-outlined @click="closeFullScreenModal" key="shrinkIcon" />
                                   </a-tooltip>
                                   <a-divider type="vertical" />
                                   <a-tooltip :title="userId && editableNote.users[userId].isPinned ? 'Unpin' : 'Pin'">
                                          <pushpin-outlined :style="{ color: pinIconColor }"
                                                 @mouseenter="onMouseEnterPinIcon" @mouseleave="onMouseLeavePinIcon"
                                                 @click="pinIconClicked" key="pinIcon" />
                                   </a-tooltip>
                                   <a-divider type="vertical" />
                                   <a-tooltip v-if="userId && !editableNote.users[userId].isDeleted"
                                          title="Move to deleted folder">
                                          <delete-outlined :onclick="moveToDeletedFolder" key="moveToDeletedFolder" />
                                   </a-tooltip>
                                   <a-tooltip v-if="userId && editableNote.users[userId].isDeleted"
                                          title="Delete permanently">
                                          <a-popconfirm title="Delete this note permanently?" ok-text="Yes"
                                                 cancel-text="No" @confirm="deleteNote">
                                                 <delete-outlined key="deleteNote" />
                                          </a-popconfirm>
                                   </a-tooltip>
                                   <a-divider type="vertical" />
                                   <a-tooltip v-if="userId && !editableNote.users[userId].isArchived"
                                          title="Move to archives">
                                          <inbox-outlined @click="moveToArchiveFolder" key="moveToArchiveFolder" />
                                   </a-tooltip>

                                   <a-divider type="vertical"
                                          v-if="(userId && !editableNote.users[userId].isArchived) && userId && (editableNote.users[userId].isDeleted || editableNote.users[userId].isArchived)"></a-divider>
                                   <a-tooltip
                                          v-if="userId && (editableNote.users[userId].isDeleted || editableNote.users[userId].isArchived)"
                                          title="Move to notes list">
                                          <unordered-list-outlined @click="moveToMyNotes" key="moveToMyNotes" />
                                   </a-tooltip>
                            </div>
                     </template>
              </a-modal>
       </div>
</template>


<script lang="ts" setup>
import { SettingOutlined } from '@ant-design/icons-vue';
import { ShrinkOutlined, CalendarOutlined, TagsOutlined, DeleteOutlined, InboxOutlined, UnorderedListOutlined, PushpinOutlined, ExpandAltOutlined, FolderOutlined } from '@ant-design/icons-vue';
import { EyeOutlined, EditOutlined } from '@ant-design/icons-vue';

import type { SharedNoteType } from '@/types/SharedNote';
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue';
import { useFoldersStore } from '@/stores/foldersStore'; // Import the folders store
import { getAuth } from 'firebase/auth';
import md from '@/markdown';
import { useTagsStore } from '@/stores/tagsStore';
import { useRouter } from 'vue-router';
import { Timestamp } from 'firebase/firestore';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import { message } from 'ant-design-vue';
import { watch } from 'vue';
import { debounce } from 'lodash'; // Import debounce function from lodash

const searchTagText = ref(''); // Track the search text for tags
const router = useRouter();
const userId = getAuth().currentUser?.uid; // Get the current user's UID
const props = defineProps<{ note: SharedNoteType }>();
const foldersStore = useFoldersStore(); // Use the folders store
const selectedFolder = ref<string | null>(userId && props.note.users[userId] ? props.note.users[userId].folderId : null); const hover = ref(false);
const isEditMode = ref(false);
const sharedNotesStore = useSharedNotesStore();
const isDeletingNote = ref(false);

const tabList = [
       {
              key: 'Note',
              tab: 'Note',
       },
       {
              key: 'Settings',
              tab: 'Settings',
       },
];
const key = ref('Note');
const isFullScreenModalVisible = ref(false);
const editableNote = ref({ ...props.note });
const pinIconColor = ref('currentColor');
const showFullContent = ref(false);
const tagsStore = useTagsStore();
const selectedTags = ref<string[]>(userId && props.note.users[userId] ? props.note.users[userId].tags || [] : []);
const tagOptions = computed(() => tagsStore.tags.map(tag => ({ label: tag.name, value: tag.id })));
const folderOptions = computed(() => foldersStore.folders.map(folder => ({ label: folder.name, value: folder.id }))); // Folder options for select

const isMobile = ref(window.innerWidth < 768);

// Convert the users object into an array for easier iteration in the template
const usersArray = computed(() =>
       Object.keys(editableNote.value.users).map((userId) => {
              const user = editableNote.value.users[userId];
              console.log(user.imageUrl);
              return user;
       })
);
const noteFolderColor = computed(() => {
       const folder = foldersStore.folders.find(folder => folder.id === selectedFolder.value);
       return folder ? folder.color : '#000000';
});

const onTabChange = (value: string) => {
       key.value = value;
};

const toggleEditMode = () => {

       isEditMode.value = !isEditMode.value;

       // update the writing user
       if (!userId) return;

       if (isEditMode.value) {
              sharedNotesStore.updateWritingStatus(editableNote.value.id, userId, true);
       } else {
              sharedNotesStore.updateWritingStatus(editableNote.value.id, userId, false);
       }
};

const showFullScreenModal = () => {
       isFullScreenModalVisible.value = true;
};
const closeFullScreenModal = () => {
       isFullScreenModalVisible.value = false;
};

const onMouseEnterPinIcon = () => {
       if (userId) pinIconColor.value = editableNote.value.users[userId].isPinned ? 'red' : 'currentColor';
};
const onMouseLeavePinIcon = () => {
       pinIconColor.value = 'currentColor';
};

const pinIconClicked = async () => {
       if (!userId) return;

       const isPinned = editableNote.value.users[userId].isPinned;
       editableNote.value.users[userId].isPinned = !isPinned;

       if (editableNote.value.users[userId].isPinned) {
              await sharedNotesStore.pinNote(editableNote.value.id);
       } else {
              await sharedNotesStore.unpinNote(editableNote.value.id);
       }

};

const moveToDeletedFolder = async () => {
       if (!userId || !editableNote.value.id) return;

       try {
              await sharedNotesStore.moveToDeletedFolder(editableNote.value.id);
              editableNote.value.users[userId].isDeleted = true;
              editableNote.value.users[userId].isArchived = false;
              console.log('Note moved to deleted folder successfully');
       } catch (error) {
              console.error('Error moving note to deleted folder:', error);
              // You might want to show an error message to the user here
       }
};


const moveToMyNotes = async () => {
       if (!userId || !editableNote.value.id) return;

       try {
              await sharedNotesStore.moveToMyList(editableNote.value.id);
              editableNote.value.users[userId].isArchived = false;
              editableNote.value.users[userId].isDeleted = false;
              console.log('Note removed from archive successfully');
       } catch (error) {
              console.error('Error removing note from archive:', error);
              // You might want to show an error message to the user here
       }
};
const truncatedMarkdown = computed(() => {
       if (showFullContent.value || !editableNote.value.content) {
              return compiledMarkdown.value;
       } else {
              // Truncate the content
              const truncatedContent = editableNote.value.content.substring(0, 250) + (editableNote.value.content.length > 250 ? '...' : '');
              return md.render(truncatedContent);
       }
});
const compiledMarkdown = computed(() => {
       return md.render(editableNote.value.content || '');
});


const toggleFullContent = () => {
       showFullContent.value = !showFullContent.value;
};

const visibleTags = computed(() => {
       return isMobile.value ? [] : selectedTags.value.slice(0, 3);
});

const hiddenTags = computed(() => {
       return isMobile.value ? selectedTags.value.slice(0) : selectedTags.value.slice(3);
});

const handleResize = () => {
       // Update the isMobile ref based on the current window width
       isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
       window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
       window.removeEventListener('resize', handleResize);
});

const getTagColor = (tagId: string) => {
       const tag = tagsStore.tags.find(tag => tag.id === tagId);
       return tag ? tag.color : '#000000'; // Default to black if no color found
};

const getContrastColor = (bgColor: string) => {
       if (!bgColor) return '#000000'; // Default to black if no color provided

       // Convert hex color to RGB
       const hex = bgColor.replace('#', '');
       const r = parseInt(hex.substring(0, 2), 16);
       const g = parseInt(hex.substring(2, 4), 16);
       const b = parseInt(hex.substring(4, 6), 16);

       // Calculate luminance
       const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

       // Return black or white depending on the luminance
       return luminance > 150 ? '#000000' : '#FFFFFF';
};

const getTagName = (tagId: string) => {
       const tag = tagsStore.tags.find(tag => tag.id === tagId);
       return tag ? tag.name : '';
};

const redirectToTag = (tagId: string) => {
       const tagName = getTagName(tagId);
       if (tagName) {
              router.push(`/notes/tag/${tagName}`);
       }
};

const formattedCreationDate = computed(() => {
       if (!editableNote.value.createdDate) return '';

       let date: Date;
       if (editableNote.value.createdDate instanceof Timestamp) {
              date = editableNote.value.createdDate.toDate();
       } else {
              date = new Date(editableNote.value.createdDate);
       }

       return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
});

const formattedUpdatedDate = computed(() => {
       if (!editableNote.value.updatedDate) return '';

       let date: Date;
       if (editableNote.value.updatedDate instanceof Timestamp) {
              date = editableNote.value.updatedDate.toDate();
       } else {
              date = new Date(editableNote.value.updatedDate);
       }

       return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
});

const datesTooltipTitle = computed(() => {
       let title = `Created: ${formattedCreationDate.value}`;
       if (formattedUpdatedDate.value) {
              title += `<br>Modified: ${formattedUpdatedDate.value}`;
       }
       return title;
});

const handleFolderChange = async (newFolderId: string | null) => {
       if (!userId || !editableNote.value.id) return;

       // If newFolderId is an empty string or undefined, set it to null
       const folderIdToSet = newFolderId === '' || newFolderId === undefined ? null : newFolderId;

       try {
              await sharedNotesStore.updateNoteFolder(editableNote.value.id, folderIdToSet);
              selectedFolder.value = folderIdToSet;
              editableNote.value.users[userId].folderId = folderIdToSet;
              console.log(`Folder updated successfully to: ${folderIdToSet}`);
       } catch (error) {
              console.error('Error updating folder:', error);
              // You might want to show an error message to the user here
       }
};

const handleTagChange = async (newTags: string[]) => {
       if (!userId || !editableNote.value.id) return;

       try {
              await sharedNotesStore.updateNoteTags(editableNote.value.id, newTags);
              selectedTags.value = newTags;
              editableNote.value.users[userId].tags = newTags;
              console.log(`Tags updated successfully to: ${newTags}`);
       } catch (error) {
              console.error('Error updating tags:', error);
              // You might want to show an error message to the user here
       }
};

const deleteNote = async () => {
       if (!userId || !editableNote.value.id) return;
       isDeletingNote.value = true; // Set the flag to indicate note deletion is in progress

       try {
              const auth = getAuth();
              const token = await auth.currentUser?.getIdToken();

              const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/delete-note`, {
                     method: 'POST',
                     headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,  // Include the Firebase ID token in the request headers
                     },
                     body: JSON.stringify({ noteId: editableNote.value.id }),
              });

              if (response.ok) {
                     message.success('Note permanently deleted successfully');
                     // Optionally, you might want to close the note view or navigate away here
              } else {
                     const errorResponse = await response.json();
                     message.error(`Error: ${errorResponse.message}`);
              }
       } catch (error) {
              console.error('Error permanently deleting note:', error);
              message.error('An error occurred while trying to delete the note.');
       }
};


const moveToArchiveFolder = async () => {
       if (!userId || !editableNote.value.id) return;

       try {
              await sharedNotesStore.moveToArchive(editableNote.value.id);
              editableNote.value.users[userId].isArchived = true;
              console.log('Note moved to archive successfully');
       } catch (error) {
              console.error('Error moving note to archive:', error);
              // You might want to show an error message to the user here
       }
};

interface User {
       inviteStatus: string;
       inviteDate: string;
       inviteAcceptedDate?: string;
       inviteRefusedDate?: string;
}

const getInviteTooltip = (user: User): string => {
       if (user.inviteStatus === 'accepted') {
              const inviteDate = new Date(user.inviteDate).toLocaleDateString();
              const inviteAcceptedDate = new Date(user.inviteAcceptedDate!).toLocaleDateString();
              return `Invited on: ${inviteDate}<br/>Accepted on: ${inviteAcceptedDate}`;
       } else if (user.inviteStatus === 'refused') {
              const inviteDate = new Date(user.inviteDate).toLocaleDateString();
              const inviteRefusedDate = new Date(user.inviteRefusedDate!).toLocaleDateString();
              return `Invited on: ${inviteDate}<br/>Refused on: ${inviteRefusedDate}`;
       } else {
              const inviteDate = new Date(user.inviteDate).toLocaleDateString();
              return `Invited on: ${inviteDate}<br/>Status: Pending`;
       }
};



watch(() => props.note, (newNote) => {
       console.log('Note content changed LOL:', newNote);
       editableNote.value = { ...newNote };
}, { deep: true });

async function updateWritePermission(userId: string, canWrite: boolean) {
       if (!userId) return;
       await sharedNotesStore.updateWritePermission(editableNote.value.id, userId, canWrite);
}

const debouncedUpdateTitle = debounce(async (newTitle: string) => {
       if (editableNote.value.id && userId) {
              await sharedNotesStore.updateTitle(editableNote.value.id, newTitle);
       }
}, 20); // Adjust the debounce time as necessary (300ms is a common choice)

const onTitleInput = (event: Event) => {
       if (!canEdit.value) return;
       const newTitle = (event.target as HTMLInputElement).value;
       debouncedUpdateTitle(newTitle);
};

const canEdit = computed(() => {
       if (!userId || !editableNote.value.users) return false;
       const user = editableNote.value.users[userId];
       return user && (user.rule === 'write' || userId === editableNote.value.owner);
});

const debouncedUpdateContent = debounce(async (newTitle: string) => {
       if (editableNote.value.id && userId) {
              await sharedNotesStore.editContent(editableNote.value.id, newTitle);
       }
}, 20); // Adjust the debounce time as necessary (300ms is a common choice)

const onContentInput = (event: Event) => {
       if (!canEdit.value) return;
       const newContent = (event.target as HTMLInputElement).value;
       debouncedUpdateContent(newContent);
};

const watchingUsers = computed(() => {
       return Object.values(editableNote.value.users).filter(user => user.isWatching && !user.isWriting && user.uuid !== userId);
});

const writingUsers = computed(() => {
       return Object.values(editableNote.value.users).filter(user => user.isWriting && user.uuid !== userId);
});

const filterTagOption = (input: string, option: any) => {
       return option?.label?.toLowerCase().includes(input.toLowerCase());
};

const handleTagSearch = (value: string) => {
       searchTagText.value = value;
};

onMounted(() => {
       if (userId) {
              sharedNotesStore.updateWatchingStatus(editableNote.value.id, userId, true);
       }

       window.addEventListener('beforeunload', () => {
              if (userId && !isDeletingNote.value) {
                     sharedNotesStore.updateWatchingStatus(editableNote.value.id, userId, false);
                     sharedNotesStore.updateWritingStatus(editableNote.value.id, userId, false);
              }
       });
});

onBeforeUnmount(() => {
       if (!isDeletingNote.value && userId) {
              sharedNotesStore.updateWatchingStatus(editableNote.value.id, userId, false);
              sharedNotesStore.updateWritingStatus(editableNote.value.id, userId, false);
       }

       window.removeEventListener('beforeunload', () => {
              if (userId && !isDeletingNote.value) {
                     sharedNotesStore.updateWatchingStatus(editableNote.value.id, userId, false);
                     sharedNotesStore.updateWritingStatus(editableNote.value.id, userId, false);
              }
       });
});


</script>

<style scoped>
.user-info {
       margin-left: 10px;
}

.user-name {
       font-weight: bold;
}

.user-email {
       color: gray;
}
</style>
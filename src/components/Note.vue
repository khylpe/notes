<template>
       <a-card hoverable :style="{ boxShadow: hover ? `0px 0px 10px 0px ${noteTagColor}` : 'none' }" :tab-list="tabList"
              :active-tab-key="key" @tabChange="onTabChange"
              class="w-auto sm:w-[450px] md:w-[550px] lg:w-[750px] xl:w-[800px] 2xl:w-[1000px]"
              @mouseenter="hover = true" @mouseleave="hover = false">
              <template #customTab="item">
                     <span v-if="item.key === 'Settings'">
                            <setting-outlined />
                            {{ item.key }}
                     </span>
              </template>
              <template #actions>
                     <a-tooltip v-if="key === 'Note'" :title="isEditMode ? 'View Markdown' : 'Edit Content'">
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
                            <template #title v-if="editableNote.isPinned">Unpin</template>
                            <template #title v-else-if="!editableNote.isPinned">Pin</template>

                            <pushpin-outlined :style="{ color: pinIconColor }" @mouseenter="onMouseEnterPinIcon"
                                   @mouseleave="onMouseLeavePinIcon" @click="pinIconClicked" key="pinIcon" />
                     </a-tooltip>

                     <a-tooltip v-if="noteModified">
                            <template #title>Save modification</template>
                            <check-outlined @click="checkAndUpdateNote" key="save" />
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Settings' && editableNote.folderId != 'deleted'" placement="bottom">
                            <template #title>Move to deleted folder</template>
                            <a-popconfirm title="Delete this note?" ok-text="Yes" cancel-text="No"
                                   @confirm="moveToDeletedFolder">
                                   <delete-outlined key="moveToDeletedFolder" />
                            </a-popconfirm>
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Settings' && editableNote.folderId === 'deleted'" placement="bottom">
                            <template #title>Delete</template>
                            <a-popconfirm title="Delete this note permanently?" ok-text="Yes" cancel-text="No"
                                   @confirm="deleteNote">
                                   <delete-outlined key="deleteNote" />
                            </a-popconfirm>
                     </a-tooltip>
                     <a-tooltip v-if="key === 'Settings' && editableNote.folderId != 'archived'" placement="bottom">
                            <template #title>Move to archives</template>
                            <a-popconfirm title="Archive this note?" ok-text="Yes" cancel-text="No"
                                   @confirm="moveToArchiveFolder">
                                   <inbox-outlined key="moveToArchiveFolder" />
                            </a-popconfirm>
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Settings' && editableNote.folderId != null" placement="bottom">
                            <template #title>Move to notes list</template>

                            <a-popconfirm title="Move to my list?" ok-text="Yes" cancel-text="No"
                                   @confirm="moveToMyNotes">
                                   <unordered-list-outlined key="moveToMyNotes" />
                            </a-popconfirm>
                     </a-tooltip>

              </template>

              <template #title>
                     <a-input spellcheck="false" placeholder="Your title" :bordered="false" size="large"
                            v-model:value="editableNote.title" @pressEnter="checkAndUpdateNote" :maxlength="20" />
              </template>
              <template v-if="key === 'Note'">
                     <a-card-meta style="min-height: 200px;">
                            <template #description>
                                   <div v-if="isEditMode">
                                          <a-textarea spellcheck="false" :autoSize="{ minRows: 2, maxRows: 10 }"
                                                 placeholder="Content of your note!" :bordered="false" :rows="8"
                                                 v-model:value="editableNote.content" />
                                   </div>
                                   <div v-else>
                                          <div v-if="editableNote.content.length > 250">
                                                 <div v-html="truncatedMarkdown" class="!text-[#dfd9d9]"></div>
                                                 <a v-if="!showFullContent" @click="toggleFullContent">Show More</a>
                                                 <a v-if="showFullContent" @click="toggleFullContent">Show Less</a>
                                          </div>
                                          <div v-else>
                                                 <div class="!text-[#dfd9d9]" v-html="compiledMarkdown"></div>
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
                                          <a-select :allowClear="true" v-model:value="selectedTag"
                                                 placeholder="Select tag" style="width: 150px" :options="tagOptions">
                                                 <template #suffixIcon><tags-outlined /></template>
                                          </a-select>
                                   </div>
                            </template>
                     </a-card-meta>
              </template>
              <template #extra>
                     <div class="flex items-center">
                            <a-tag class="mr-3" v-if="selectedTag" :color="getTagColor(selectedTag)"
                                   :style="{ color: getContrastColor(getTagColor(selectedTag)) }"
                                   @click="redirectToTag">
                                   {{ getTagName(selectedTag) }}
                            </a-tag>

                            <a-tooltip :title="datesTooltipTitle">
                                   <calendar-outlined />
                            </a-tooltip>
                     </div>
              </template>
       </a-card>

       <!-- Full Screen Modal -->
       <div>
              <!-- Full Screen Modal -->
              <a-modal v-model:open="isFullScreenModalVisible" width="100%" wrap-class-name="full-modal">
                     <template #title>
                            <a-input spellcheck="false" placeholder="Your title" :bordered="false" size="large"
                                   class="p-0 m-0" v-model:value="editableNote.title" @pressEnter="checkAndUpdateNote"
                                   :maxlength="20" />
                     </template>
                     <div class="full-screen-modal-content">
                            <a-tabs v-model:activeKey="key" @change="onTabChange">
                                   <a-tab-pane key="Note" tab="Note">
                                          <div v-if="isEditMode" class="textarea-container">
                                                 <a-textarea spellcheck="false" :autoSize="false"
                                                        placeholder="Content of your note" :bordered="false"
                                                        v-model:value="editableNote.content"
                                                        class="full-height-textarea !text-[#dfd9d9]" />
                                          </div>
                                          <div v-else class="!text-[#dfd9d9]" v-html="compiledMarkdown"></div>
                                   </a-tab-pane>
                                   <a-tab-pane key="Settings" tab="Settings">
                                          <div class="flex justify-center">
                                                 <a-select :allowClear="true" v-model:value="selectedTag"
                                                        placeholder="Select tag" style="width: 150px"
                                                        :options="tagOptions">
                                                        <template #suffixIcon><tags-outlined /></template>
                                                 </a-select>
                                          </div>
                                   </a-tab-pane>
                            </a-tabs>
                     </div>
                     <template #footer>
                            <div class="modal-footer">
                                   <!-- Vos icônes et actions existantes -->
                                   <a-tooltip v-if="key === 'Note'"
                                          :title="isEditMode ? 'View Markdown' : 'Edit Content'">
                                          <template v-if="isEditMode">
                                                 <eye-outlined @click="toggleEditMode" />
                                          </template>
                                          <template v-else>
                                                 <edit-outlined @click="toggleEditMode" />
                                          </template>
                                   </a-tooltip>

                                   <a-divider type="vertical" />

                                   <a-tooltip title="Exit full screen">
                                          <shrink-outlined @click="closeFullScreenModal" key="shrinkIcon" />
                                   </a-tooltip>
                                   <a-divider type="vertical" />
                                   <a-tooltip :title="editableNote.isPinned ? 'Unpin' : 'Pin'">
                                          <pushpin-outlined :style="{ color: pinIconColor }"
                                                 @mouseenter="onMouseEnterPinIcon" @mouseleave="onMouseLeavePinIcon"
                                                 @click="pinIconClicked" key="pinIcon" />
                                   </a-tooltip>
                                   <a-divider type="vertical" />
                                   <a-tooltip v-if="noteModified" title="Save modification">
                                          <check-outlined @click="checkAndUpdateNote" key="save" />
                                   </a-tooltip>
                                   <a-divider type="vertical" v-if="noteModified" />
                                   <a-tooltip v-if="editableNote.folderId != 'deleted'" title="Move to deleted folder">
                                          <a-popconfirm title="Delete this note?" ok-text="Yes" cancel-text="No"
                                                 @confirm="moveToDeletedFolder">
                                                 <delete-outlined key="moveToDeletedFolder" />
                                          </a-popconfirm>
                                   </a-tooltip>
                                   <a-tooltip v-if="editableNote.folderId === 'deleted'" title="Delete permanently">
                                          <a-popconfirm title="Delete this note permanently?" ok-text="Yes"
                                                 cancel-text="No" @confirm="deleteNote">
                                                 <delete-outlined key="deleteNote" />
                                          </a-popconfirm>
                                   </a-tooltip>
                                   <a-divider type="vertical" />
                                   <a-tooltip v-if="editableNote.folderId != 'archived'" title="Move to archives">
                                          <a-popconfirm title="Archive this note?" ok-text="Yes" cancel-text="No"
                                                 @confirm="moveToArchiveFolder">
                                                 <inbox-outlined key="moveToArchiveFolder" />
                                          </a-popconfirm>
                                   </a-tooltip>
                                   <a-divider type="vertical" v-if="editableNote.folderId != 'archived'" />
                                   <a-tooltip v-if="editableNote.folderId != null" title="Move to notes list">
                                          <a-popconfirm title="Move to my list?" ok-text="Yes" cancel-text="No"
                                                 @confirm="moveToMyNotes">
                                                 <unordered-list-outlined key="moveToMyNotes" />
                                          </a-popconfirm>
                                   </a-tooltip>
                            </div>
                     </template>
              </a-modal>
       </div>
</template>

<script lang="ts" setup>
import { CheckOutlined, SettingOutlined, CalendarOutlined, TagsOutlined, DeleteOutlined, InboxOutlined, UnorderedListOutlined, PushpinOutlined, ExpandAltOutlined } from '@ant-design/icons-vue';
import { ref, computed, watch } from 'vue';
import { EyeOutlined, EditOutlined } from '@ant-design/icons-vue';

import type { NoteType } from '@/types/Note';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import { isEqual } from 'lodash';
import { Timestamp } from 'firebase/firestore';
import { message } from 'ant-design-vue';
import { ShrinkOutlined } from '@ant-design/icons-vue';
import md from './test';
import { useRouter } from 'vue-router';

const props = defineProps<{ note: NoteType }>();
const notesStore = useNotesStore();
const tagsStore = useTagsStore();
const tagOptions = computed(() => tagsStore.tags.map(tag => ({ label: tag.name, value: tag.id })));

const key = ref('Note');
const hover = ref(false);  // Define hover here
const isEditMode = ref(false); // State for toggling between edit and view modes
const selectedTag = ref<string | null>(props.note.tagId || null);
const noteModified = ref(false);
const editableNote = ref({ ...props.note });
const pinIconColor = ref('currentColor');
const showFullContent = ref(false);
const isFullScreenModalVisible = ref(false);
const router = useRouter();

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

const toggleEditMode = () => {
       isEditMode.value = !isEditMode.value;
};
const redirectToTag = () => {
       const tagName = getTagName(selectedTag.value as string);
       if (tagName) {
              router.push(`/notes/tag/${tagName}`);
       }
};
const showFullScreenModal = () => {
       isFullScreenModalVisible.value = true;
};
const closeFullScreenModal = () => {
       isFullScreenModalVisible.value = false;
};
const onTabChange = (value: string) => {
       key.value = value;
};
const checkAndUpdateNote = async () => {
       const storeNote = notesStore.notes.find(n => n.id === editableNote.value.id);

       // Check if title is empty
       if (!editableNote.value.title.trim()) {
              message.warning('Please enter a title');
              return;
       }

       // Check if content is empty
       if (!editableNote.value.content.trim()) {
              message.warning('Please enter a content');
              return;
       }

       if (storeNote && !isEqual(storeNote, editableNote.value)) {
              try {
                     await notesStore.updateStoreAndFirestore(editableNote.value);
                     message.success('Note updated');
              } catch (error) {
                     if (error instanceof Error) {
                            message.error(error.message);
                     } else {
                            // Handle non-Error objects
                            message.error('An unknown error occurred.');
                     }
              }
              noteModified.value = false;
       }
       else if (!storeNote) {
              message.error("No note found in store for update.");
       }
       else if (isEqual(storeNote, editableNote.value)) {
              message.warning('Please modify your note');
       }
};
const noteTagColor = computed(() => {
       const tag = tagsStore.tags.find(tag => tag.id === selectedTag.value);
       return tag ? tag.color : '#000000';
});
const getTagName = (tagId: string) => {
       const tag = tagsStore.tags.find(tag => tag.id === tagId);
       return tag ? tag.name : '';
};
const getTagColor = (tagId: string) => {
       const tag = tagsStore.tags.find(tag => tag.id === tagId);
       console.log(tag?.color);
       console.log("tag?.color");

       return tag ? tag.color : '#000000'; // Default to black if no color found
};
const moveToDeletedFolder = () => {
       if (editableNote.value.id) {
              try {
                     notesStore.moveToDeletedFolder(editableNote.value.id);
                     message.success('Note deleted');
              } catch (error) {
                     if (error instanceof Error) {
                            message.error(error.message);
                     } else {
                            // Handle non-Error objects
                            message.error('An unknown error occurred.');
                     }
              }
       } else {
              message.error("No note ID available for deletion.");
       }
}
const moveToArchiveFolder = () => {
       if (editableNote.value.id) {
              try {
                     notesStore.moveToArchiveFolder(editableNote.value.id);
                     message.success('Note archived');
              } catch (error) {
                     if (error instanceof Error) {
                            message.error(error.message);
                     } else {
                            // Handle non-Error objects
                            message.error('An unknown error occurred.');
                     }
              }
       } else {
              message.error("No note ID available for archiving.");
       }
}
const moveToMyNotes = () => {
       if (editableNote.value.id) {
              try {
                     notesStore.moveToMyNotes(editableNote.value.id);
                     message.success('Note moved to my notes');
              } catch (error) {
                     if (error instanceof Error) {
                            message.error(error.message);
                     } else {
                            // Handle non-Error objects
                            message.error('An unknown error occurred.');
                     }
              }
       } else {
              message.error("No note ID available for moving.");
       }
}
const deleteNote = () => {
       if (editableNote.value.id) {
              try {
                     notesStore.deleteNote(editableNote.value.id);
                     message.success('Note deleted permanently');
              } catch (error) {
                     if (error instanceof Error) {
                            message.error(error.message);
                     } else {
                            // Handle non-Error objects
                            message.error('An unknown error occurred.');
                     }
              }
       } else {
              message.error("No note ID available for deletion.");
       }
}
const onMouseEnterPinIcon = () => {
       pinIconColor.value = editableNote.value.isPinned ? 'red' : 'currentColor';
};
const onMouseLeavePinIcon = () => {
       pinIconColor.value = 'currentColor';
};
const pinIconClicked = async () => {
       if (!editableNote.value.id) {
              message.error("No note ID available for pinning/unpinning.");
              return;
       }

       // Toggle the isPinned status
       editableNote.value.isPinned = !editableNote.value.isPinned;

       try {
              // Call the appropriate store action based on the new isPinned status
              if (editableNote.value.isPinned) {
                     await notesStore.pinNote(editableNote.value.id);
                     message.success('Note pinned');
              } else {
                     await notesStore.unpinNote(editableNote.value.id);
                     message.success('Note unpinned');
              }
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     // Handle non-Error objects
                     message.error('An unknown error occurred.');
              }
       }
};
const toggleFullContent = () => {
       showFullContent.value = !showFullContent.value;
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
       return luminance > 186 ? '#000000' : '#FFFFFF';
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
              title += `\nModified: ${formattedUpdatedDate.value}`;
       }
       return title;
});
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

watch(() => props.note, (newNote) => {
       editableNote.value = { ...newNote };
       selectedTag.value = newNote.tagId || null;
}, { deep: true });
watch(editableNote, () => {
       noteModified.value = !isEqual(notesStore.notes.find(n => n.id === editableNote.value.id), editableNote.value);
}, { deep: true });
watch(selectedTag, (newTagId) => {
       if (newTagId !== editableNote.value.tagId && editableNote.value.id) {
              editableNote.value.tagId = newTagId || null;
       }
});
</script>

<style lang="less">
.full-modal {
       .ant-modal {
              max-width: 100%;
              top: 0;
              padding-bottom: 0;
              margin: 0;
       }

       .ant-modal-content {
              display: flex;
              flex-direction: column;
              height: 100vh;
              border-radius: 0;
       }

       .ant-modal-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              overflow-y: auto;
              /* Ensure content scrolls inside the modal */
              background-color: #3E3E3E;
              /* Ensures the background color covers the entire content area */
       }

       .full-screen-modal-content {
              flex: 1;
              padding: 16px;
              /* Add some padding for content spacing */
              overflow-y: auto;
       }

       .ant-modal-footer {
              padding: 16px;
              background-color: #3E3E3E;
              /* Match the background color */
       }

       .modal-footer {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;

              .anticon {
                     font-size: 20px;
                     cursor: pointer;
              }

              .ant-divider-vertical {
                     height: 24px;
                     margin: 0 16px;
              }

              .ant-tooltip-open {
                     display: inline-flex;
              }
       }
}

.textarea-container {
       height: calc(100vh - 200px);
       /* Adjust this value to ensure the textarea fits well with the footer */
       display: flex;
       flex-direction: column;
}

.full-height-textarea {
       flex: 1;
       resize: none;
       height: 100%;
}
</style>
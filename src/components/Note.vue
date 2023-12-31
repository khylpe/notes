<template>
       <a-card hoverable :style="{ boxShadow: hover ? `0px 0px 10px 0px ${noteTagColor}` : 'none' }" style="width: 300px"
              :tab-list="tabList" :active-tab-key="key" @tabChange="onTabChange" @mouseenter="hover = true"
              @mouseleave="hover = false">
              <template #customTab="item">
                     <span v-if="item.key === 'Settings'">
                            <setting-outlined />
                            {{ item.key }}
                     </span>
              </template>
              <template #actions>
                     <!-- <edit-outlined @click="checkAndUpdateNote" key="save" /> -->

                     <a-tooltip v-if="noteModified">
                            <template #title>Save modification</template>
                            <check-outlined @click="checkAndUpdateNote" key="save" />
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Settings' && editableNote.folderId != 'deleted'" placement="bottom">
                            <template #title>Move to deleted folder</template>
                            <a-popconfirm title="Delete this note?" ok-text="Yes" cancel-text="No"
                                   @confirm="moveToDeletedFolder">
                                   <delete-outlined key="moveToDeletedFolder"/>
                            </a-popconfirm>
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Settings' && editableNote.folderId === 'deleted'" placement="bottom">
                            <template #title>Delete</template>
                            <a-popconfirm title="Delete this note permanently?" ok-text="Yes" cancel-text="No"
                                   @confirm="deleteNote">
                                   <delete-outlined key="deleteNote" />
                            </a-popconfirm>
                     </a-tooltip>
                     <a-tooltip v-if="key === 'Settings' && editableNote.folderId != 'archive'" placement="bottom">
                            <template #title>Move to archives</template>
                            <a-popconfirm title="Archive this note?" ok-text="Yes" cancel-text="No"
                                   @confirm="moveToArchiveFolder">
                                   <inbox-outlined key="moveToArchiveFolder" />
                            </a-popconfirm>
                     </a-tooltip>

                     <a-tooltip v-if="key === 'Settings' && editableNote.folderId != null" placement="bottom">
                            <template #title>Move to notes list</template>

                            <a-popconfirm title="Move to my list?" ok-text="Yes" cancel-text="No" @confirm="moveToMyNotes">
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
                                   <a-textarea spellcheck="false" :autoSize="{ minRows: 2, maxRows: 10 }"
                                          placeholder="Content of your note ! :)" :bordered="false" :rows="8"
                                          @pressEnter="checkAndUpdateNote" v-model:value="editableNote.content" />
                            </template>
                     </a-card-meta>
              </template>

              <template v-if="key === 'Settings'">
                     <!-- Settings content here -->
                     <a-card-meta style="min-height: 200px;">
                            <template #description>
                                   <div class="flex justify-center">
                                          <a-select :allowClear="true" v-model:value="selectedTag" placeholder="Select tag"
                                                 style="width: 150px" :options="tagOptions">
                                                 <template #suffixIcon><tags-outlined /></template>
                                          </a-select>
                                   </div>
                            </template>
                     </a-card-meta>
              </template>
              <template #extra>
                     <a-tooltip>
                            <template #title>Creation date</template>
                            {{ formattedDate }}
                     </a-tooltip>
              </template>
       </a-card>
</template>
<script lang="ts" setup>
import { CheckOutlined, SettingOutlined, TagsOutlined, DeleteOutlined, InboxOutlined, UnorderedListOutlined } from '@ant-design/icons-vue';
import { defineProps, ref, computed, watch } from 'vue';
import type { NoteType } from '@/types/Note';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import { isEqual } from 'lodash';
import { Timestamp } from 'firebase/firestore';
import { message } from 'ant-design-vue';

const props = defineProps<{ note: NoteType }>();
const notesStore = useNotesStore();
const tagsStore = useTagsStore();
const editableNote = ref({ ...props.note });
const noteModified = ref(false);
const hover = ref(false);  // Define hover here
const key = ref('Note');
const selectedTag = ref<string | null>(props.note.tagId || null);
const tagOptions = computed(() => tagsStore.tags.map(tag => ({ label: tag.name, value: tag.id })));
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
const formattedDate = computed(() => {
       if (!editableNote.value.createdDate) return '';

       let date: Date;
       if (editableNote.value.createdDate instanceof Timestamp) {
              date = editableNote.value.createdDate.toDate(); // Type assertion here
       } else {
              date = new Date(editableNote.value.createdDate);
       }

       return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
});
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
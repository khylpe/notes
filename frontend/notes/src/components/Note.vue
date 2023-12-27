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

                     <a-popconfirm title="Are you sure delete this note?" ok-text="Yes" v-if="key === 'Settings'"
                            cancel-text="No" @confirm="deleteNote">
                            <delete-outlined key="delete" />
                     </a-popconfirm>
              </template>
              <template #title>
                     <a-input spellcheck="false" placeholder="Your title" :bordered="false" size="large" v-model:value="editableNote.title"
                            @pressEnter="checkAndUpdateNote" :maxlength="20" />
              </template>
              <template v-if="key === 'Note'">
                     <a-card-meta style="min-height: 200px;">
                            <template #description>
                                   <a-textarea spellcheck="false" :autoSize="{ minRows: 2, maxRows: 10 }" placeholder="Content of your note ! :)"
                                          :bordered="false" :rows="8" @pressEnter="checkAndUpdateNote"
                                          v-model:value="editableNote.content" />
                            </template>
                     </a-card-meta>
              </template>

              <template v-if="key === 'Settings'">
                     <!-- Settings content here -->
                     <a-card-meta style="min-height: 200px;">
                            <template #description>

                                   <div><a-select v-model:value="selectedTag" placeholder="Select tag" style="width: 150px"
                                                 :options="tagOptions">
                                                 <template #suffixIcon><tags-outlined /></template>
                                          </a-select></div>
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
import { CheckOutlined, EditOutlined, SettingOutlined, TagsOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { defineProps, ref, computed, watch } from 'vue';
import type { NoteType } from '@/types/Note';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import { isEqual } from 'lodash';
import { Timestamp } from 'firebase/firestore';

const props = defineProps<{ note: NoteType }>();
const notesStore = useNotesStore();
const tagsStore = useTagsStore();
const editableNote = ref({ ...props.note });
const noteModified = ref(false);
const hover = ref(false);  // Define hover here
const key = ref('Note');
const selectedTag = ref(props.note.tagId || ''); // Initialize with the note's tag ID
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
       if (storeNote && !isEqual(storeNote, editableNote.value)) {
              // Update the note's tagId if it has been changed
              if (editableNote.value.tagId !== selectedTag.value) {
                     await tagsStore.updateNoteTag(editableNote.value.id, selectedTag.value);
                     editableNote.value.tagId = selectedTag.value;
              }
              notesStore.updateStoreAndFirestore(editableNote.value);
              noteModified.value = false;
       }
};
const noteTagColor = computed(() => {
       const tag = tagsStore.tags.find(tag => tag.id === selectedTag.value);
       return tag ? tag.color : '#000000';
});
const deleteNote = () => {
       if (editableNote.value.id) {
              notesStore.deleteNote(editableNote.value.id);
       } else {
              console.error("No note ID available for deletion.");
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



watch(() => props.note, (newNote) => {
       editableNote.value = { ...newNote };
       selectedTag.value = newNote.tagId || ""; // Update when note changes
}, { deep: true });
watch(editableNote, () => {
       const storeNote = notesStore.notes.find(n => n.id === editableNote.value.id);
       noteModified.value = !isEqual(storeNote, editableNote.value);
}, { deep: true });
watch(selectedTag, async (newTagId, oldTagId) => {
       if (newTagId !== oldTagId && editableNote.value.id) {
              // Update the note's tagId locally
              editableNote.value.tagId = newTagId;
       }
});
</script>

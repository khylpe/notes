<template>
       <div class="flex flex-col">
              <div class="flex flex-row justify-end">
                     <a-button type="dashed" @click="openModal"><setting-outlined></setting-outlined></a-button>
              </div>
       </div>

       <div class="flex flex-wrap justify-center mt-4">
              <div v-if="filteredNotesByTag.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div class="note flex justify-center" v-for="note in filteredNotesByTag" :key="note.id">
                            <Note :note="note" />
                     </div>
              </div>

              <a-result v-else status="info" :title="`Add your first note to the ${tagName} tag`"
                     sub-title="You currently have no notes in this tag. Create a new note and add it to this tag to get started!">
              </a-result>
       </div>

       <a-modal v-model:open="isModalVisible" title="Update Tag" @ok="updateCurrentTag">
              <div class="flex flex-row my3">
                     <a-input placeholder="New tag name" v-model:value="newTagName" />
                     <a-input type="color" class="mx-2" style="width: 50px;" v-model:value="newTagColor" />

                     <a-popconfirm title="Are you sure delete this task?" ok-text="Yes" cancel-text="No"
                            @confirm="deleteTag">
                            <a-button danger type="text"><delete-outlined></delete-outlined></a-button>
                     </a-popconfirm>
              </div>
       </a-modal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import Note from '@/components/NoteComponent.vue';
import type { NoteType } from '@/types/Note';
import { SettingOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { ref } from 'vue';
import { Modal as AModal, message } from 'ant-design-vue'; // Import Modal
import type { TagType } from '@/types/Tag';
import router from '@/router';

const route = useRoute();
const tagName = computed(() => route.params.tagName as string);

const notesStore = useNotesStore();
const tagsStore = useTagsStore();
notesStore.fetchAndStoreNotes();

const filteredNotesByTag = computed<NoteType[]>(() => {
       return notesStore.notes
              .filter(note => note.tagIds && note.tagIds.includes(tagId.value ?? ''))
              .sort((a, b) => {
                     const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : new Date(a.createdDate).getTime();
                     const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : new Date(b.createdDate).getTime();
                     return dateB - dateA;
              });
});

tagsStore.fetchTags();

const tagColor = computed(() => {
       const tag = tagsStore.tags.find(t => t.name === tagName.value);
       return tag ? tag.color : null;
});

const newTagColor = ref(tagColor.value); // Default color
const isModalVisible = ref(false);

const newTagName = ref(tagName.value);
const isModifyingTagLoading = ref(false);

const openModal = () => {
       isModalVisible.value = true;
};

const tagId = computed(() => {
       const tag = tagsStore.tags.find(t => t.name === tagName.value);
       return tag ? tag.id : null;
});

watch(route, () => {
       notesStore.fetchAndStoreNotes();
});

const updateCurrentTag = () => {
       isModalVisible.value = true;
       isModifyingTagLoading.value = true;

       if (!newTagName.value.trim()) {
              message.warning('Please enter a tag name');
              isModifyingTagLoading.value = false;
              return;
       }
       if (!newTagColor.value) {
              message.warning('Please select a color');
              isModifyingTagLoading.value = false;
              return;
       }
       if ((newTagName.value === tagName.value) && (newTagColor.value === tagColor.value)) {
              message.warning('Please change the tag name or color');
              isModifyingTagLoading.value = false;
              return;
       }
       if (!tagId.value) {
              message.warning('Tag not found');
              isModifyingTagLoading.value = false;
              return;
       }

       const existingTag = tagsStore.tags.find(t => t.id === tagId.value);
       if (!existingTag) {
              message.warning('Tag not found');
              isModifyingTagLoading.value = false;
              return;
       };

       const updatedTag: TagType = {
              id: tagId.value,
              name: newTagName.value,
              color: newTagColor.value,
              createdDate: existingTag.createdDate, // Use existing value
              updatedDate: new Date(),
              numberOfNotes: existingTag.numberOfNotes // Use existing value
       };

       try {
              tagsStore.updateTag(updatedTag);

              if (tagName.value !== newTagName.value) router.push(`/notes/tag/${newTagName.value}`);
              message.success('Tag updated successfully');
              isModalVisible.value = false;
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     message.error('An error occurred while updating the tag');
              }
       }
       isModifyingTagLoading.value = false;
};

const deleteTag = () => {
       isModifyingTagLoading.value = true;

       if (!tagId.value) {
              message.warning('Tag not found');
              isModifyingTagLoading.value = false;
              return;
       }

       try {
              tagsStore.deleteTag(tagId.value);
              router.push('/notes');
              message.success('Tag deleted successfully');
              isModalVisible.value = false;
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     message.error('An error occurred while deleting the tag');
              }
       }
       isModifyingTagLoading.value = false;
};
</script>

<style scoped>
.container {
       display: flex;
       justify-content: space-between;
       /* Aligns items as requested */
}

.center-element {
       /* This will center the element in the remaining space */
       margin-right: auto;
       margin-left: auto;
}
</style>

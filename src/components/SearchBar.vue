<template>
       <div class="flex flex-row justify-center pb-10">
              <div class="certain-category-search-wrapper flex flex-col gap-2"
                     style="margin-left: auto; margin-right: auto;">
                     <div class="flex flex-row items-center w-full">
                            <!-- Tooltip element -->
                            <a-tooltip>
                                   <!-- Tooltip value -->
                                   <template #title>By default, it will search in all notes.</template>
                                   <!-- Element to hover for the tooltip -->
                                   <a-auto-complete v-model:value="searchValue" autofocus
                                          class="certain-category-search"
                                          popup-class-name="certain-category-search-dropdown"
                                          :dropdown-match-select-width="isMobile ? 400 : 600" :options="dataSource"
                                          @focus="fetchNotesByFilters">
                                          <template #option="item">
                                                 <!-- Check if the item is a main category (Tags or Folders) -->
                                                 <div v-if="isSearchResultsLoading">
                                                        <a-skeleton active :title="true" />
                                                 </div>
                                                 <div v-else>
                                                        <template v-if="item.options">
                                                               <div class="flex items-center justify-between">
                                                                      <!-- center icons -->
                                                                      <span>{{ item.value }}</span>
                                                                      <folder-outlined class="mr-1"
                                                                             v-if="item.value == 'Deleted' || item.value == 'Archived' || item.value == 'My Notes'"
                                                                             style="float: right" />
                                                                      <pushpin-outlined
                                                                             v-else-if="item.value == 'Pinned'"
                                                                             class="mr-1" style="float: right" />
                                                                      <tags-outlined v-else class="mr-1"
                                                                             style="float: right" />
                                                               </div>
                                                        </template>
                                                        <!-- Handling for other items if any -->
                                                        <template v-else>
                                                               <a class="flex justify-between text-decoration-none"
                                                                      :style="{ color: item.color || '#000' }"
                                                                      :href="`/notes/${item.noteId}`">
                                                                      {{ item.title }}
                                                                      <span>
                                                                             <calendar-outlined
                                                                                    class="mr-1"></calendar-outlined>
                                                                             {{ item.date }}
                                                                      </span>
                                                               </a>
                                                        </template>
                                                 </div>
                                          </template>
                                          <a-input-search placeholder="Input Here" size="large"></a-input-search>
                                   </a-auto-complete>
                            </a-tooltip>
                            <a-tooltip>
                                   <!-- Tooltip value -->
                                   <template #title>Reset search settings</template>
                                   <!-- Element to hover for tooltip -->
                                   <a-button @click="resetFilters" type="text" class="ml-2">
                                          <UndoOutlined class="flex-col"
                                                 style="font-size: 24px; display: flex; color: #7a7878" />
                                   </a-button>
                            </a-tooltip>
                     </div>
                     <!-- Div containing settings such as Folder, Tags, date -->
                     <div style="max-width: 600px; margin-top: -4px;"
                            class="flex justify-around flex-wrap pt-1 settings gap-2">
                            <!-- margin-top (negative) must be equal of the padding-top value -->
                            <!-- Select folder to search in -->
                            <a-select v-model:value="folderValue" mode="multiple"
                                   style="width: fit-content; min-width: 120px;" :options="folderOptions" size="large"
                                   :dropdown-match-select-width="200" :max-tag-count="3" placeholder="Folder"
                                   @change="handleFolderChange" class="setting flex-child">
                            </a-select>
                            <!-- Filter by tags -->
                            <a-select v-model:value="tagValue" mode="multiple"
                                   style="width: fit-content ; min-width: 120px;" :options="tagOptions" size="large"
                                   :dropdown-match-select-width="200" :max-tag-count="3" placeholder="Tags"
                                   @change="handleTagChange" class="setting flex-child">
                                   <template v-slot:option="option">
                                          <!-- Custom rendering of each option -->
                                          <div :style="{ color: option.color }">{{ option.label }}</div>
                                   </template>
                            </a-select>

                            <!-- Filter by creation date -->
                            <a-space direction="vertical" :size="12" class="setting flex-child">
                                   <a-range-picker :presets="rangePresets" :disabled-date="disabledDate"
                                          format="DD/MM/YYYY" @change="onRangeChange" :value="selectedDateRange"
                                          size="large">
                                          <template #renderExtraFooter>
                                                 <span class="flex justify-center">Select a
                                                        start and end date for when the
                                                        note was
                                                        created.</span>
                                          </template>
                                   </a-range-picker>
                            </a-space>
                     </div>
              </div>
       </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import { UndoOutlined, FolderOutlined, TagsOutlined, CalendarOutlined, PushpinOutlined } from '@ant-design/icons-vue';
import dayjs, { Dayjs } from 'dayjs';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useFoldersStore } from '@/stores/foldersStore';
import type { NoteType } from '@/types/Note';
import { message } from 'ant-design-vue';
const isMobile = ref(window.innerWidth < 768);

type RangeValue = [Dayjs, Dayjs];

interface DataSourceItem {
       value: string;
       count: number;
       options: { title: string; date: string; }[];
}
interface TagOption {
       label: string;
       value: string;
}
interface FolderOption {
       label: string;
       value: string | null;
}

const selectedDateRange = ref<RangeValue | null>(null);
const notesStore = useNotesStore();
const tagsStore = useTagsStore();
const foldersStore = useFoldersStore();
const searchValue = ref('');
const tagValue = ref<string[]>([]);
const folderValue = ref<string[]>([]);
const tagOptions = ref<TagOption[]>([]);
const folderOptions = ref<FolderOption[]>([]);
const dataSource = ref<DataSourceItem[]>([]);
const isSearchResultsLoading = ref(true);

const rangePresets = ref([
       { label: 'Last 7 Days', value: [dayjs().add(-7, 'd'), dayjs()] },
       { label: 'Last 14 Days', value: [dayjs().add(-14, 'd'), dayjs()] },
       { label: 'Last 30 Days', value: [dayjs().add(-30, 'd'), dayjs()] },
       { label: 'Last 90 Days', value: [dayjs().add(-90, 'd'), dayjs()] },
]);

const disabledDate = (current: Dayjs) => {
       // Can not select days after today
       return current > dayjs().endOf('day');
};

const handleTagChange = (value: string[]) => {
       fetchNotesByFilters().catch(handleError);
};

const handleFolderChange = (value: string[]) => {
       fetchNotesByFilters().catch(handleError);
};

const onRangeChange = (dates: RangeValue, dateStrings: string[]) => {
       selectedDateRange.value = dates || null;
       fetchNotesByFilters().catch(handleError);
};

const updateDataSource = (filteredNotes: NoteType[]) => {
       isSearchResultsLoading.value = true;
       const tagsMap = new Map<string, { notes: NoteType[], color: string }>();
       const foldersMap = new Map<string, NoteType[]>();

       filteredNotes.forEach(note => {
              // Handle tags
              note.tagIds?.forEach(tagId => {
                     const tagName = tagsStore.tags.find(tag => tag.id === tagId)?.name;
                     const tagColor = tagsStore.tags.find(tag => tag.id === tagId)?.color || '#000';
                     if (tagName) {
                            if (!tagsMap.has(tagName)) {
                                   tagsMap.set(tagName, { notes: [], color: tagColor });
                            }
                            tagsMap.get(tagName)?.notes.push(note);
                     }
              });

              // Handle folders
              const folderKey = note.folderId ? note.folderId : 'My Notes';
              if (!foldersMap.has(folderKey)) {
                     foldersMap.set(folderKey, []);
              }
              foldersMap.get(folderKey)?.push(note);
       });

       // Convert the maps to the dataSource format
       const tagsData = Array.from(tagsMap, ([key, { notes, color }]) => ({
              value: key.charAt(0).toUpperCase() + key.slice(1),
              count: notes.length,
              options: notes.map(note => ({
                     title: note.title,
                     date: Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(note.createdDate),
                     noteId: note.id,
                     color: color, // Include the color here
              }))
       }));

       const foldersData = Array.from(foldersMap, ([key, notes]) => ({
              value: key.charAt(0).toUpperCase() + key.slice(1),
              count: notes.length,
              options: notes.map(note => ({
                     title: note.title,
                     date: Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(note.createdDate),
                     noteId: note.id
              }))
       }));

       const pinnedNotes = filteredNotes.filter(note => note.isPinned);
       const pinnedData = {
              value: 'Pinned',
              count: pinnedNotes.length,
              options: pinnedNotes.map(note => ({
                     title: note.title,
                     date: Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(note.createdDate),
                     noteId: note.id,
              }))
       };

       dataSource.value = [pinnedData, ...foldersData, ...tagsData];
       isSearchResultsLoading.value = false;
};

const fetchNotesByFilters = async () => {
       isSearchResultsLoading.value = true;
       try {
              const selectedTag = tagValue.value;
              const selectedFolders = folderValue.value;
              let dateRange: [Date, Date] | null = null;

              if (selectedDateRange.value) {
                     // Ensuring that dateRange is a tuple
                     dateRange = [selectedDateRange.value[0].toDate(), selectedDateRange.value[1].toDate()] as [Date, Date];
              }

              const filteredNotes = await notesStore.fetchFilteredNotes(
                     searchValue.value,
                     selectedTag,
                     selectedFolders,
                     dateRange
              );
              updateDataSource(filteredNotes);
       } catch (error) {
              handleError(error);
       } finally {
              isSearchResultsLoading.value = false;
       }
};

const resetFilters = () => {
       searchValue.value = '';
       tagValue.value = [];
       folderValue.value = [];
       selectedDateRange.value = null;
       fetchNotesByFilters().catch(handleError);
};

const getColorForTag = (tagId: string) => {
       const tag = tagsStore.tags.find(t => t.id === tagId);
       return tag ? tag.color : '#000'; // default color if not found
};

const handleError = (error: unknown) => {
       if (error instanceof Error) {
              message.error(error.message);
       } else {
              message.error('An unknown error occurred.');
       }
};

// Watchers
watch(searchValue, () => {
       fetchNotesByFilters().catch(handleError);
});

watch(() => tagsStore.tags, (newTags) => {
       const fetchedTags = newTags.map(tag => ({
              label: tag.name,
              value: tag.id,
              color: getColorForTag(tag.id)
       }));
       tagOptions.value = fetchedTags;
}, { deep: true });

watch(() => foldersStore.folders, (newFolders) => {
       const fetchedFolders = newFolders.map(folder => ({
              label: folder.name,
              value: folder.id,
       }));
       // Add default folders at the start
       folderOptions.value = [
              { label: 'My Notes', value: null },
              { label: 'Archived', value: 'archived' },
              { label: 'Deleted', value: 'deleted' },
              ...fetchedFolders
       ];
}, { deep: true });

watch(() => notesStore.notes, (newNotes) => {
       updateDataSource(newNotes);
}, { deep: true });

// Initial fetching
onMounted(async () => {
       await foldersStore.fetchFolders();
       await tagsStore.fetchTags();
       await notesStore.fetchAndStoreNotes();
});
</script>

<style scoped>
@media (max-width: 1000px) {
       .settings {
              flex-direction: column;
              width: 100%;
       }

       .setting {
              width: 100%;
       }

       .certain-category-search {
              width: 100%;
              /* Full width for the search bar on small screens */
       }

       .a-select,
       .a-space {
              width: 100%;
       }
}

/* For larger screens, you can set a specific width if necessary */
@media (min-width: 1001px) {
       .certain-category-search {
              width: 600px;
              /* Adjust as needed for larger screens */
       }
}

.certain-category-search-dropdown .ant-select-dropdown-menu-item-group-title {
       color: #666;
       font-weight: bold;
}

.certain-category-search-dropdown .ant-select-dropdown-menu-item-group {
       border-bottom: 1px solid #f6f6f6;
}

.certain-category-search-dropdown .ant-select-dropdown-menu-item {
       padding-left: 16px;
}

.certain-category-search-dropdown .ant-select-dropdown-menu-item.show-all {
       text-align: center;
       cursor: default;
}

.certain-category-search-dropdown .ant-select-dropdown-menu {
       max-height: 300px;
}
</style>
<template>
       <div class="certain-category-search-wrapper flex flex-column" style="margin-left: auto; margin-right: auto;">
              <div class="flex flex-row items-center w-100">
                     <!-- Tooltip element -->
                     <a-tooltip>
                            <!-- Tooltip value -->
                            <template #title>By default, it will search in all notes.</template>
                            <!-- Element to hover for the tooltip -->
                            <a-auto-complete v-model:value="searchValue" class="certain-category-search"
                                   popup-class-name="certain-category-search-dropdown" :dropdown-match-select-width="600"
                                   :options="dataSource" @focus="fetchNotesByFilters">
                                   <template #option="item">
                                          <!-- Check if the item is a main category (Tags or Folders) -->
                                          <div v-if="isSearchResultsLoading">
                                                 <a-skeleton active :title="true" />
                                          </div>
                                          <div v-else>
                                                 <template v-if="item.options">
                                                        <span>{{ item.value }}</span>
                                                        <folder-outlined class="mr1"
                                                               v-if="item.value == 'Deleted' || item.value == 'Archives' || item.value == 'My notes'"
                                                               style="float: right">

                                                        </folder-outlined>
                                                        <tags-outlined v-else class="mr1" style="float: right">
                                                        </tags-outlined>
                                                 </template>
                                                 <!-- Handling for other items if any -->
                                                 <template v-else>
                                                        <a class="flex justify-between text-decoration-none"
                                                               :style="{ color: item.color || '#000' }"
                                                               :href="`/notes/${item.noteId}`">
                                                               {{ item.title }}
                                                               <span>
                                                                      <calendar-outlined class="mr1"></calendar-outlined>
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
                            <a-button @click="resetFilters" type="text" class="ml2">
                                   <UndoOutlined class="flex-column" style="font-size: 24px; display: flex; color: #7a7878" />
                            </a-button>
                     </a-tooltip>
              </div>
              <!-- Div containing settings such as Folder, Tags, date -->
              <div style="max-width: 600px; margin-top: -10px;" class="flex justify-around flex-wrap pt1 settings">
                     <!-- Select folder to search in -->
                     <a-select v-model:value="folderValue" mode="multiple" style="width: fit-content; min-width: 120px;"
                            :options="folderOptions" size="large" :dropdown-match-select-width="200" :max-tag-count="3"
                            placeholder="Folder" @change="handleFolderChange" class="setting flex-child">
                     </a-select>
                     <!-- Filter by tags -->
                     <a-select v-model:value="tagValue" mode="multiple" style="width: fit-content ; min-width: 120px;"
                            :options="tagOptions" size="large" :dropdown-match-select-width="200" :max-tag-count="3"
                            placeholder="Tags" @change="handleTagChange" class="setting flex-child">
                            <template v-slot:option="option">
                                   <!-- Custom rendering of each option -->
                                   <div :style="{ color: option.color }">{{ option.label }}</div>
                            </template>
                     </a-select>

                     <!-- Filter by creation date -->
                     <a-space direction="vertical" :size="12" class="setting flex-child">
                            <a-range-picker :presets="rangePresets" :disabled-date="disabledDate" format="DD/MM/YYYY"
                                   @change="onRangeChange" :value="selectedDateRange" size="large" #renderExtraFooter><span
                                          class="flex justify-center">Select a
                                          start and end date for when the
                                          note was
                                          created.</span>
                            </a-range-picker>
                     </a-space>
              </div>
       </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { UndoOutlined, FolderOutlined, TagsOutlined, CalendarOutlined } from '@ant-design/icons-vue';
import dayjs, { Dayjs } from 'dayjs';
import { useNotesStore } from '@/stores/notesStore';
import { useTagsStore } from '@/stores/tagsStore';
import type { NoteType } from '@/types/Note';
import { message } from 'ant-design-vue';

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
const selectedDateRange = ref<RangeValue | null>(null);
const notesStore = useNotesStore();
const tagsStore = useTagsStore();
const searchValue = ref('');
const tagValue = ref([]);
const folderValue = ref([]);
const tagOptions = ref<TagOption[]>([]);
const dataSource = ref<DataSourceItem[]>([]);
const isSearchResultsLoading = ref(true);

const rangePresets = ref([
       { label: 'Last 7 Days', value: [dayjs().add(-7, 'd'), dayjs()] },
       { label: 'Last 14 Days', value: [dayjs().add(-14, 'd'), dayjs()] },
       { label: 'Last 30 Days', value: [dayjs().add(-30, 'd'), dayjs()] },
       { label: 'Last 90 Days', value: [dayjs().add(-90, 'd'), dayjs()] },
]);
const folderOptions = [
       // value should match the database values
       { label: 'My Notes', value: null },       // Display 'My Notes', value is `null`
       { label: 'Archives', value: 'archive' },  // Display 'Archives', value is 'archive'
       { label: 'Deleted', value: 'deleted' },   // Display 'Deleted', value is 'deleted'
];
const disabledDate = (current: Dayjs) => {
       // Can not select days after today
       return current > dayjs().endOf('day');
};
const handleTagChange = (value: string) => {
       try {
              fetchNotesByFilters();
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     // Handle non-Error objects
                     message.error('An unknown error occurred.');
              }
       }
};
const handleFolderChange = (value: string) => {
       try {
              fetchNotesByFilters();
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     // Handle non-Error objects
                     message.error('An unknown error occurred.');
              }
       }
};
const onRangeChange = (dates: RangeValue, dateStrings: string[]) => {
       if (dates) {
              selectedDateRange.value = dates;
              try {
                     fetchNotesByFilters();
              } catch (error) {
                     if (error instanceof Error) {
                            message.error(error.message);
                     } else {
                            // Handle non-Error objects
                            message.error('An unknown error occurred.');
                     }
              }
       } else {
              selectedDateRange.value = null;
       }
};
const getColorForTag = (tagId: string) => {
       const tag = tagsStore.tags.find(t => t.id === tagId);
       return tag ? tag.color : '#000'; // default color if not found
};
const updateDataSource = (filteredNotes: NoteType[]) => {
       isSearchResultsLoading.value = true;
       const tagsMap = new Map<string, { notes: NoteType[], color: string }>();
       const foldersMap = new Map<string, NoteType[]>();

       filteredNotes.forEach(note => {
              // Handle tags only if the note has a tag
              if (note.tagId) {
                     const tagName = tagsStore.tags.find(tag => tag.id === note.tagId)?.name;
                     const tagColor = tagsStore.tags.find(tag => tag.id === note.tagId)?.color || '#0000';
                     if (tagName) {
                            if (!tagsMap.has(tagName)) {
                                   tagsMap.set(tagName, { notes: [], color: tagColor });
                            }
                            tagsMap.get(tagName)?.notes.push(note);
                     }
              }

              // Handle folders
              const folderKey = note.folderId ? note.folderId : 'My notes';
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
       dataSource.value = [...tagsData, ...foldersData];
       isSearchResultsLoading.value = false;
};
const fetchNotesByFilters = async () => {
       isSearchResultsLoading.value = true;
       try {
              const selectedTag = tagValue.value.length > 0 ? tagValue.value[0] : null;
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
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     // Handle non-Error objects
                     message.error('An unknown error occurred.');
              }
       }
       finally {
              isSearchResultsLoading.value = false;
       }
};
const resetFilters = () => {
       searchValue.value = '';
       tagValue.value = [];
       folderValue.value = [];
       selectedDateRange.value = null;
       try {
              fetchNotesByFilters();
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     // Handle non-Error objects
                     message.error('An unknown error occurred.');
              }
       }
};
watch(searchValue, () => {
       try {
              fetchNotesByFilters();
       } catch (error) {
              if (error instanceof Error) {
                     message.error(error.message);
              } else {
                     // Handle non-Error objects
                     message.error('An unknown error occurred.');
              }
       }
});
watch(() => tagsStore.tags, (newTags) => {
       const fetchedTags = newTags.map(tag => ({
              label: tag.name,
              value: tag.id,
              color: getColorForTag(tag.id)
       }));
       tagOptions.value = fetchedTags;
}, { deep: true });
watch(() => notesStore.notes, (newNotes) => {
       updateDataSource(newNotes);
}, { deep: true });
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
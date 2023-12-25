<template>
       <div class="certain-category-search-wrapper flex flex-column"
              style="width: 600px; margin-left: auto; margin-right: auto;">

              <!-- Tooltip element -->
              <div class="flex flex-row items-center">
                     <a-tooltip>
                            <!-- Tooltip value -->
                            <template #title>By default, it will search in all notes</template>

                            <!-- Element to hover for the tooltip -->
                            <a-auto-complete v-model:value="searchValue" class="certain-category-search"
                                   popup-class-name="certain-category-search-dropdown" :dropdown-match-select-width="600"
                                   style="width: 600px;" :options="dataSource">
                                   <template #option="item">
                                          <template v-if="item.options">
                                                 <span>
                                                        {{ item.value }}
                                                        <a style="float: right" href="https://www.google.com/search?q=antd"
                                                               target="_blank" rel="noopener noreferrer">
                                                               more
                                                        </a>
                                                 </span>
                                          </template>
                                          <template v-else-if="item.value === 'all'">
                                                 <a href="https://www.google.com/search?q=ant-design-vue" target="_blank"
                                                        rel="noopener noreferrer">
                                                        View all results
                                                 </a>
                                          </template>
                                          <template v-else>
                                                 <div style="display: flex; justify-content: space-between">
                                                        {{ item.value }}
                                                        <span>
                                                               <UserOutlined />
                                                               {{ item.count }}
                                                        </span>
                                                 </div>
                                          </template>
                                   </template>
                                   <a-input-search placeholder="input here" size="large"></a-input-search>
                            </a-auto-complete>
                     </a-tooltip>

                     <a-tooltip>
                            <!-- Tooltip value -->
                            <template #title>Reset search settings</template>

                     <UndoOutlined class="flex-column ml2"
                            style="font-size: 24px; display: flex; color: #7a7878" />
                            </a-tooltip>
              </div>


              <!-- Div containing settings such as Folder, Tags, date -->
              <div style="width: 600px; margin-left: auto; margin-right: auto; margin-top: -10px;"
                     class="flex justify-around flex-wrap pt1">

                     <!-- Select folder to search in -->
                     <a-select v-model:value="folderValue" mode="multiple" style="width: fit-content; min-width: 120px;"
                            :options="folderOptions" size="large" :dropdown-match-select-width="200" :max-tag-count="3"
                            placeholder="Folder" @change="handleFolderChange" class="flex-child">
                     </a-select>

                     <!-- Filter by tags -->
                     <a-select v-model:value="tagValue" mode="multiple" style="width: fit-content ; min-width: 120px;"
                            :options="tagOptions" size="large" :dropdown-match-select-width="200" :max-tag-count="3"
                            placeholder="Tags" @change="handleTagChange" class="flex-child">
                     </a-select>

                     <!-- Filter by creation date -->
                     <a-space direction="vertical" :size="12" class="flex-child">
                            <a-range-picker :presets="rangePresets" format="DD/MM/YYYY" @change="onRangeChange" size="large"
                                   :disabled-date="disabledDate" #renderExtraFooter><span class="flex justify-center">Select a
                                          start and end date for when the
                                          note was
                                          created.</span></a-range-picker>
                     </a-space>

              </div>
       </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { UserOutlined, UndoOutlined } from '@ant-design/icons-vue';
import dayjs, { Dayjs } from 'dayjs';

const dataSource = [
       {
              value: 'Libraries',
              options: [
                     {
                            value: 'AntDesignVue',
                            count: 10000,
                     },
                     {
                            value: 'AntDesignVue UI',
                            count: 10600,
                     },
              ],
       },
       {
              value: 'Solutions',
              options: [
                     {
                            value: 'AntDesignVue UI FAQ',
                            count: 60100,
                     },
                     {
                            value: 'AntDesignVue FAQ',
                            count: 30010,
                     },
              ],
       },
       {
              value: 'Articles',
              options: [
                     {
                            value: 'AntDesignVue design language',
                            count: 100000,
                     },
              ],
       },
       {
              value: 'all',
       },
];
const searchValue = ref('');

const handleTagChange = (value: string) => {
       console.log(`selected ${value}`);
};

const handleFolderChange = (value: string) => {
       console.log(`selected ${value}`);
};

const tagValue = ref([]);
const folderValue = ref([]);

const tagOptions = [
       { value: 'shopping' },
       { value: 'music' },
       { value: 'shoRTHpping' },
       { value: 'musRTHic' },
       { value: 'shopRTHping' },
       { value: 'musRTHicTRH' },
       { value: 'shoRTHpping' },
       { value: 'musRTHic' },
       { value: 'shoRTHpping' },
       { value: 'muRTHsic' }
];

const folderOptions = [
       { value: 'My notes' },
       { value: 'Archived' },
       { value: 'Deleted' },
];

type RangeValue = [Dayjs, Dayjs];
const onChange = (date: Dayjs) => {
       if (date) {
              console.log('Date: ', date);
       } else {
              console.log('Clear');
       }
};
const onRangeChange = (dates: RangeValue, dateStrings: string[]) => {
       if (dates) {
              console.log('From: ', dates[0], ', to: ', dates[1]);
              console.log('From: ', dateStrings[0], ', to: ', dateStrings[1]);
       } else {
              console.log('Clear');
       }
};

const presets = ref([
       { label: 'Yesterday', value: dayjs().add(-1, 'd') },
       { label: 'Last Week', value: dayjs().add(-7, 'd') },
       { label: 'Last Month', value: dayjs().add(-1, 'month') },
]);

const rangePresets = ref([
       { label: 'Last 7 Days', value: [dayjs().add(-7, 'd'), dayjs()] },
       { label: 'Last 14 Days', value: [dayjs().add(-14, 'd'), dayjs()] },
       { label: 'Last 30 Days', value: [dayjs().add(-30, 'd'), dayjs()] },
       { label: 'Last 90 Days', value: [dayjs().add(-90, 'd'), dayjs()] },
]);

const disabledDate = (current: Dayjs) => {
       // Can not select days before today and today
       return current > dayjs().endOf('day');
};
</script>

<style scoped>
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
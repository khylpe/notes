<template>
       <a-card :tab-list="tabList" :active-tab-key="key"
              class="w-auto sm:w-[450px] md:w-[550px] lg:w-[750px] xl:w-[800px] 2xl:w-[1000px]">
              <!-- Tabs -->
              <template #customTab="item">
                     <span v-if="item.key === 'Settings'">
                            <setting-outlined />
                            {{ item.key }}
                     </span>
              </template>

              <!-- Actions -->
              <template #actions>
                     <a-tooltip title="Edit Content">
                            <edit-outlined />
                     </a-tooltip>
                     <a-tooltip title="View full screen">
                            <expand-alt-outlined key="expandIcon" />
                     </a-tooltip>
              </template>

              <!-- Title -->
              <template #title>
                     <a-skeleton-input title style="width: 300px;" active />
              </template>

              <!-- Content/Description -->
              <template v-if="key === 'Note'">
                     <a-card-meta style="min-height: 200px;">
                            <template #description>
                                   <a-skeleton paragraph :rows="4" active />
                            </template>
                     </a-card-meta>
              </template>

              <template v-if="key === 'Settings'">
                     <a-card-meta style="min-height: 200px;">
                            <template #description>
                                   <a-skeleton-paragraph :rows="4" active />
                            </template>
                     </a-card-meta>
              </template>

              <!-- Extra (Calendar icon) -->
              <template #extra>
                     <a-tooltip title="Dates">
                            <calendar-outlined />
                     </a-tooltip>
              </template>
       </a-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { EditOutlined, ExpandAltOutlined, CalendarOutlined, SettingOutlined } from '@ant-design/icons-vue';

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
</script>
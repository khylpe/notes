<template>
       <div class="col col-2">
              <a-menu :inlineCollapsed="isCollapsed" :inlineIndent="inLineIndentValue" class="h-100 fixed col col-2"
                     v-model:selectedKeys="current" :mode="menuMode" :items="items" @click="handleMenuClick" />
       </div>
</template>

<script lang="ts" setup>
import { h, ref, onMounted, onUnmounted } from 'vue';
import { TagsOutlined, UnorderedListOutlined, FolderOutlined, PlusCircleOutlined, PushpinOutlined, SettingOutlined } from '@ant-design/icons-vue';
import type { MenuProps } from 'ant-design-vue';
import router from "@/router";

const menuMode = ref('inline');
const isCollapsed = ref(false);
const inLineIndentValue = ref(24);

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
onMounted(() => {
       window.addEventListener('resize', updateMenuMode);
       updateMenuMode(); // Initial check
});
onUnmounted(() => {
       window.removeEventListener('resize', updateMenuMode);
});
const current = ref<string[]>();
const items = ref<MenuProps['items']>([
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
                            label: 'Option 1',
                            key: 'setting:1',
                     },
                     { type: 'divider' },
                     {
                            label: 'Option 2',
                            key: 'setting:2',
                     },
              ],
       },
       {
              key: 'Tags',
              icon: () => h(TagsOutlined),
              label: 'Tags',
              title: 'Tags',

              children: [
                     {
                            label: 'Shopping',
                            key: 'Shopping',
                     },
                     { type: 'divider' },
                     {
                            label: 'Music',
                            key: 'Music',
                     },
                     { type: 'divider' },
                     {
                            label: 'Create new tag',
                            key: 'Create new tag',
                            icon: () => h(PlusCircleOutlined),
                     }
              ],
       },
]);
function handleMenuClick(e: any) {
       current.value = [e.key];
}
</script>
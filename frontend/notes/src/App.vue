
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { Divider } from 'ant-design-vue';
import SideBar from '@/components/SideBar.vue';
import SearchBar from '@/components/SearchBar.vue';
</script>

<template>
       <header class="flex flex-column pl1 pt1">
              <div class="flex flex-row items-center">
                     <RouterLink to="/">
                            <img alt="Vue logo" class="logo" src="@/assets/logo_black.svg" width="75" height="auto" />
                     </RouterLink>
                     <span class="ml3 h1">Notes by Arthur CRAHE</span>
              </div>

              <div class="mx1">
                     <Divider class="my1" />
              </div>
       </header>

       <main class="flex flex-row">
              <SideBar />

              <div class="content-page">
                     <SearchBar />
                     <RouterView />
              </div>
       </main>
</template> 
<template>
       <!-- Layout header, sidebar, etc. -->
       <Header />

       <!-- Child component will be rendered here -->
       <main class="flex flex-row content-page">
              <SideBar />
              <div class="flex flex-col w-full mt-3 ml-20">
                     <router-view></router-view>
              </div>
       </main>
</template>

<script setup lang="ts">
import Header from '@/components/Header.vue';
import SideBar from '@/components/SideBar.vue';
import SearchBar from '@/components/SearchBar.vue';
</script>

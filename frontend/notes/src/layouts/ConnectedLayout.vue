<template>
       <!-- Layout header, sidebar, etc. -->
       <Header />

       <!-- Child component will be rendered here -->
       <main class="flex flex-row content-page ">
                     <SideBar />
                     <div class="flex flex-column w-100 mt3">
                            <div class="flex justify-center">
                                   <SearchBar />
                            </div>
                            <div class="mt4"></div>
                            <router-view></router-view>
                     </div>
       </main>
</template>

<script setup lang="ts">
import Header from '@/components/Header.vue';
import SideBar from '@/components/SideBar.vue';
import SearchBar from '@/components/SearchBar.vue';
</script>

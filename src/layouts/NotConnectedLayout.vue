<template>
              <Header />

              <main>
                     <router-view></router-view>
              </main>

              <footer>
              </footer>
</template>

<script setup lang="ts">
import Header from '@/components/AppHeader.vue';
// Composition API setup logic, if needed
</script>
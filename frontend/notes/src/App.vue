
<script setup lang="ts">
import { RouterView } from 'vue-router'
import SideBar from '@/components/SideBar.vue';
import SearchBar from '@/components/SearchBar.vue';
import LoginForm from '@/components/LoginForm.vue';
import { onAuthStateChanged } from 'firebase/auth';
import { ref } from 'vue';
import auth from '@/services/FirebaseConfig';
import Header from '@/components/Header.vue';

const isAuthenticated = ref(false);

onAuthStateChanged(auth, (user) => {
       isAuthenticated.value = !!user;
});
</script>
<template>
       <Header></Header>
       <main class="flex flex-row" v-if="isAuthenticated">
              <SideBar />
              <div class="content-page">
                     <SearchBar />
                     <RouterView />
              </div>
       </main>
       <main v-else>
              <div class="col col-12 flex flex-row justify-center items-center h-100 rm-header-height">
                     <LoginForm />
              </div>
       </main>
</template> 
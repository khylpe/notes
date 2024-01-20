<template>
       <header class="flex flex-col pl-1 pt-1">
              <div class="flex flex-row items-center justify-between">
                     <div class="flex flex-row items-center">
                            <RouterLink to="/">
                                   <img alt="Vue logo" class="logo" src="@/assets/logo_black.svg" width="75" height="auto" />
                            </RouterLink>
                            <span class="ml-3 text-4xl">{{ pageName }}</span>
                     </div>
                     <a-popover v-if="isAuthenticated" placement="bottomRight" trigger="click">
                            <template #content>
                                   <div class="flex flex-col">
                                          <span>{{ username }}</span>
                                          <RouterLink to="/profil">
                                                 <a-button class="mt-1" style="width: 100%;">Profil</a-button>
                                          </RouterLink>
                                          <a-button danger @click="logout" class="mt-1" style="width: 100%;">Logout</a-button>
                                   </div>
                            </template>
                            <a-avatar :size="36" class="mr-2" v-if="userProfilePicture" :src="userProfilePicture" />
                            <a-avatar v-else :size="36" class="mr-2">
                                   <UserOutlined width="65px" />
                            </a-avatar>
                     </a-popover>
              </div>
              <div class="mx-1">
                     <Divider class="my1" />
              </div>
       </header>
</template>

<script  lang="ts" setup>
import { RouterLink, useRoute } from 'vue-router';
import { Divider, message } from 'ant-design-vue';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, watch, onMounted } from 'vue';
import auth from '@/services/FirebaseConfig';
import { UserOutlined } from '@ant-design/icons-vue';
import router from '@/router';

// Add useRoute here
const route = useRoute();
const pageName = ref<string | unknown>('');
const isAuthenticated = ref(false);
const userProfilePicture = ref<string>('');
const username = ref<string>('');

const routeNameToTitle = [
       { path: 'login', title: 'Login' },
       { path: 'verifyEmail', title: 'Verify Email' },
       { path: 'profil', title: 'Profile' },
       { path: 'notes', title: 'My Notes' },
       { path: 'pinned', title: 'Pinned Notes' },
       { path: 'notesByTag', title: 'Notes by Tag' },
       { path: 'notesByFolder', title: 'Notes by Folder' },
       { path: 'note', title: 'Note Details' },
       { path: 'NotFound', title: 'Not Found' }
];

onAuthStateChanged(auth, (user) => {
       isAuthenticated.value = !!user;
       userProfilePicture.value = user && user.photoURL ? user.photoURL : '';
       username.value = user ? user.displayName || 'Anonymous' : '';
});
const logout = async () => {
       try {
              await signOut(auth);
              message.success('Logged out successfully');
              router.push('/login');
       } catch (error) {
              if (error instanceof Error) {
                     message.error(`Couldn't logout : ${error.message}`);
              }
              message.error("Logout failed");
       }
};
watch(route, () => {
       updatePageName();
});
const updatePageName = () => {
       pageName.value = routeNameToTitle.find(r => r.path === route.name)?.title;
       console.log("Page name:", pageName.value);
};
onMounted(() => {
       updatePageName();
});
</script>
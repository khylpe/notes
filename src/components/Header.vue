<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Divider, message } from 'ant-design-vue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref } from 'vue';
import auth from '@/services/FirebaseConfig';
import { UserOutlined } from '@ant-design/icons-vue';
import router from '@/router';

const isAuthenticated = ref(false);
const userProfilePicture = ref<string>('');
const username = ref<string>('');

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
              if(error instanceof Error){
                     message.error(`Couldn't logout : ${error.message}`);
              }
              message.error("Logout failed");
       }
};
</script>
<template>
       <header class="flex flex-column pl1 pt1">
              <div class="flex flex-row items-center justify-between">
                     <div class="flex flex-row items-center">
                            <RouterLink to="/">
                                   <img alt="Vue logo" class="logo" src="@/assets/logo_black.svg" width="75" height="auto" />
                            </RouterLink>
                            <span class="ml3 h1">Notes by Arthur CRAHE test</span>
                     </div>
                     <a-popover v-if="isAuthenticated" placement="bottomRight" trigger="click">
                            <template #content>
                                   <div class="flex flex-column">
                                          <span>{{ username }}</span>
                                          <RouterLink to="/profil">
                                                 <a-button class="mt1" style="width: 100%;">Profil</a-button>
                                          </RouterLink>
                                          <a-button danger @click="logout" class="mt1" style="width: 100%;">Logout</a-button>
                                   </div>
                            </template>
                            <a-avatar :size="36" class="mr2" v-if="userProfilePicture" :src="userProfilePicture" />
                            <a-avatar v-else :size="36" class="mr2">
                                   <UserOutlined width="65px" />
                            </a-avatar>
                     </a-popover>
              </div>
              <div class="mx1">
                     <Divider class="my1" />
              </div>
       </header>
</template>
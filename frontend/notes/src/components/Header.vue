<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { Divider, Avatar, Popover } from 'ant-design-vue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref } from 'vue';
import auth from '@/services/FirebaseConfig';
import { UserOutlined } from '@ant-design/icons-vue';

const isAuthenticated = ref(false);
const userProfilePicture = ref<string>(''); // Store user's profile picture URL
const username = ref<string>(''); // Store user's name

onAuthStateChanged(auth, (user) => {
       isAuthenticated.value = !!user;
       userProfilePicture.value = user && user.photoURL ? user.photoURL : '';
       username.value = user ? user.displayName || 'Anonymous' : ''; // Update the user's name
});

// Logout function
const logout = async () => {
       try {
              await signOut(auth);
              console.log("Logged out successfully");
              // Additional logout handling (e.g., redirecting to a login page)
       } catch (error) {
              console.error("Logout failed", error);
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
                            <span class="ml3 h1">Notes by Arthur CRAHE</span>
                     </div>
                     <a-popover v-if="isAuthenticated" placement="bottomRight" trigger="click">
                            <template #content>
                                   <div class="flex flex-column">
                                          <span>{{ username }}</span>
                                          <a-button class="mt1">Profil</a-button>
                                          <a-button danger @click="logout" class="mt1">Logout</a-button>
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
   
     
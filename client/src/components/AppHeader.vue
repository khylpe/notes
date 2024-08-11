<template>
       <header class="flex flex-col pt-1">
              <div class="flex flex-row items-center justify-between">
                     <!-- Plus Icon for New Note -->
                     <a-tooltip>
                            <template v-if="!isMobile" #title>New Note (Ctrl + M)</template>
                            <template v-else #title>New Note</template>

                            <a-button type="text" @click="toggleNewNote" class="flex items-center mx-2">
                                   <PlusOutlined style="font-size: 24px; color: #7a7878" />
                                   <Text v-if="!isMobile" class="ml-2 shortcut-indicator" code type="secondary">Ctrl +
                                          M</Text>
                            </a-button>
                     </a-tooltip>

                     <!-- Centered Logo and Page Name -->
                     <div class="flex flex-row items-center justify-center mx-auto">
                            <Text class="ml-2 text-2xl">{{ pageName }}</Text>
                     </div>

                     <!-- Right Side Icons -->
                     <div class="flex flex-row items-center">
                            <!-- Search Icon -->
                            <!-- Search Icon with Shortcut Indicator -->
                            <a-tooltip>
                                   <template v-if="!isMobile" #title>Search (Ctrl + K)</template>
                                   <template v-else #title>Search</template>

                                   <a-button type="text" @click="toggleSearchBar" class="flex items-center mr-2">
                                          <SearchOutlined style="font-size: 24px; color: #7a7878" />
                                          <Text v-if="!isMobile" class="ml-2 shortcut-indicator" code
                                                 type="secondary">Ctrl + K</Text>
                                   </a-button>
                            </a-tooltip>

                            <!-- Profile Avatar Dropdown -->
                            <a-popover v-if="!!userInformationStore.userInformation" placement="bottomRight"
                                   trigger="click">
                                   <template #content>
                                          <div class="flex flex-col">
                                                 <span>{{ userInformationStore.userInformation?.username }}</span>
                                                 <RouterLink to="/profil">
                                                        <a-button class="mt-1" style="width: 100%;">Profile</a-button>
                                                 </RouterLink>

                                                 <RouterLink v-if="invitationCount" to="/notes/invitations">
                                                        <a-button class="mt-1" style="width: 100%;">Invitations ({{
                                                               invitationCount }})</a-button>
                                                 </RouterLink>

                                                 <a-button danger @click="logout" class="mt-1"
                                                        style="width: 100%;">Logout</a-button>
                                          </div>
                                   </template>
                                   <a-avatar :size="36" class="mr-2"
                                          v-if="userInformationStore.userInformation.profilePictureUrl"
                                          :src="userInformationStore.userInformation.profilePictureUrl" />
                                   <a-avatar v-else :size="36" class="mr-2">
                                          <UserOutlined width="65px" />
                                   </a-avatar>
                            </a-popover>
                     </div>
              </div>
              <div class="mx-1">
                     <Divider class="my-3" />
              </div>

              <!-- Modal for Search Bar -->
              <a-modal v-model:open="isSearchBarVisible" title="Search Notes" footer=""
                     :width="isMobile ? '95%' : '60%'">
                     <SearchBar @close="toggleSearchBar" />
              </a-modal>

              <!-- Modal for New Note -->
              <a-modal v-model:open="isNewNoteVisible" title="New Note" :width="isMobile ? '95%' : '60%'" footer=""
                     wrapClassName="new-note-modal" :style="{ top: isMobile ? '10px' : '50px' }">
                     <NewNote @close="toggleNewNote" />
              </a-modal>
       </header>
</template>


<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { Divider, message, Typography } from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons-vue';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/FirebaseConfig';
import router from '@/router';
import { useUserInformationStore } from '@/stores/userInformationStore';
import SearchBar from '@/components/SearchBar.vue';
import NewNote from '@/components/NewNote.vue';
import { useInvitationStore } from '@/stores/invitationsStore';

const invitationStore = useInvitationStore();
const { Text } = Typography;
const route = useRoute();
const pageName = ref<string | unknown>('');
const userInformationStore = useUserInformationStore();
const isSearchBarVisible = ref(false);
const isNewNoteVisible = ref(false);
const isMobile = ref(window.innerWidth < 768);
const invitationCount = computed(() => invitationStore.countInvitations());

const handleResize = () => {
       isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
       window.addEventListener('resize', handleResize);
       updatePageName(); // Call updatePageName on mount to set the initial title
});

onUnmounted(() => {
       window.removeEventListener('resize', handleResize);
});

const routeNameToTitle = [
       { path: 'login', title: 'Login' },
       { path: 'verifyEmail', title: 'Verify Email' },
       { path: 'profil', title: 'Profile' },
       { path: 'notes', title: 'All Notes' },
       { path: 'pinned', title: 'Pinned Notes' },
       { path: 'note', title: 'Note Details' },
       { path: 'NotFound', title: 'Not Found' },
];

const logout = async () => {
       try {
              await signOut(auth);
              message.success('Logged out successfully');
              router.push('/login');
       } catch (error) {
              if (error instanceof Error) {
                     message.error(`Couldn't logout: ${error.message}`);
              }
              message.error('Logout failed');
       }
};

const updatePageName = () => {
       if (route.path.includes('/notes/tag/')) {
              const tagName = decodeURIComponent(route.path.split('/notes/tag/')[1]);
              pageName.value = tagName.charAt(0).toUpperCase() + tagName.slice(1);
       } else if (route.path.includes('/notes/folder/')) {
              const folderName = decodeURIComponent(route.path.split('/notes/folder/')[1]);
              pageName.value = folderName.charAt(0).toUpperCase() + folderName.slice(1);
       } else if (route.path === '/notes/deleted') {
              pageName.value = 'Deleted Notes';
       } else if (route.path === '/notes/archived') {
              pageName.value = 'Archived Notes';
       } else if (route.path === '/notes/invitations') {
              pageName.value = 'Invitations';
       } else {
              pageName.value = routeNameToTitle.find((r) => r.path === route.name)?.title || '';
       }
};


const toggleSearchBar = () => {
       isSearchBarVisible.value = !isSearchBarVisible.value;
};

const toggleNewNote = () => {
       isNewNoteVisible.value = !isNewNoteVisible.value;
};

onMounted(() => {
       const handleShortcut = (event: KeyboardEvent) => {
              if (event.ctrlKey && event.key === 'k') {
                     event.preventDefault();
                     toggleSearchBar();
              } else if (event.ctrlKey && event.key === 'm') {
                     event.preventDefault();
                     toggleNewNote();
              }
       };

       window.addEventListener('keydown', handleShortcut);

       return () => {
              window.removeEventListener('keydown', handleShortcut);
       };
});

watch(route, updatePageName);

</script>


<style scoped>
header {
       position: relative;
}

.logo {
       display: block;
}

.text-2xl {
       font-size: 1.5rem;
}

.mx-auto {
       margin-left: auto;
       margin-right: auto;
}
</style>
<template>
       <header class="flex flex-col pt-1">
              <div class="flex flex-row items-center justify-between">
                     <!-- Plus Icon for New Note -->
                     <a-tooltip>
                            <template #title>New Note</template>
                            <a-button type="text" @click="toggleNewNote" class="ml-2">
                                   <PlusOutlined style="font-size: 24px; color: #7a7878" />
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
                                   <template #title>Search (Ctrl + K)</template>
                                   <a-button type="text" @click="toggleSearchBar" class="flex items-center mr-2">
                                          <SearchOutlined style="font-size: 24px; color: #7a7878" />
                                          <Text class="ml-2 shortcut-indicator" code type="secondary">Ctrl + K</Text>
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
              <a-modal v-model:visible="isSearchBarVisible" title="Search Notes" footer="" width="60%">
                     <SearchBar @close="toggleSearchBar" />
              </a-modal>

              <!-- Modal for New Note -->
              <a-modal v-model:visible="isNewNoteVisible" title="New Note" :width="isMobile ? '95%' : '60%'" footer="">
                     <NewNote @close="toggleNewNote" />
              </a-modal>
       </header>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { Divider, message, Typography } from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons-vue';
import { signOut } from 'firebase/auth';
import auth from '@/services/FirebaseConfig';
import router from '@/router';
import { useUserInformationStore } from '@/stores/userInformationStore';
import SearchBar from '@/components/SearchBar.vue'; // Import the SearchBar component
import NewNote from '@/components/NewNote.vue'; // Import the NewNote component

const { Text } = Typography;
const route = useRoute();
const pageName = ref<string | unknown>('');
const userInformationStore = useUserInformationStore();
const isSearchBarVisible = ref(false); // State for search bar visibility
const isNewNoteVisible = ref(false); // State for new note visibility

const isMobile = ref(window.innerWidth < 768);


const handleResize = () => {
       // Update the isMobile ref based on the current window width
       isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
       window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
       window.removeEventListener('resize', handleResize);
});
const routeNameToTitle = [
       { path: 'login', title: 'Login' },
       { path: 'verifyEmail', title: 'Verify Email' },
       { path: 'profil', title: 'Profile' },
       { path: 'notes', title: 'My Notes' },
       { path: 'pinned', title: 'Pinned Notes' },
       { path: 'note', title: 'Note Details' },
       { path: 'NotFound', title: 'Not Found' }
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
              message.error("Logout failed");
       }
};

const updatePageName = () => {
       if (route.path.includes('/notes/tag/')) {
              const tagName = route.path.split('/notes/tag/')[1];
              pageName.value = tagName.charAt(0).toUpperCase() + tagName.slice(1);
       } else if (route.path.includes('/notes/folder/')) {
              const tagName = route.path.split('/notes/folder/')[1];
              pageName.value = tagName.charAt(0).toUpperCase() + tagName.slice(1);
       }
       else {
              pageName.value = routeNameToTitle.find(r => r.path === route.name)?.title || '';
       }
};

const toggleSearchBar = () => {
       isSearchBarVisible.value = !isSearchBarVisible.value;
};

const toggleNewNote = () => {
       isNewNoteVisible.value = !isNewNoteVisible.value;
};

// Function to handle the CTRL + K shortcut
const handleShortcut = (event: KeyboardEvent) => {
       if (event.ctrlKey && event.key === 'k') {
              event.preventDefault(); // Prevent the default browser behavior
              toggleSearchBar(); // Toggle the search bar visibility
       }
};

watch(route, updatePageName);
// Add event listener when the component is mounted and remove it when unmounted
onMounted(() => {
       window.addEventListener('keydown', handleShortcut);
       updatePageName();
});

onUnmounted(() => {
       window.removeEventListener('keydown', handleShortcut);
});
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
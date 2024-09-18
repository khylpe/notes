<template>
       <div class="mt-8 mx-4 text-white">
              <div key="information" tab="Main information" :class="isMobile ? 'flex flex-col items-center' : ''">
                     <span class="text-3xl">Information</span>
                     <div class="flex flex-col md:flex-row md:items-center mt-6">
                            <!-- maybe remove items-center if too much content-->
                            <div :class="isMobile ? 'flex flex-col items-center' : 'flex flex-row'">
                                   <a-avatar v-if="profilPicture" class="ml-3" style="width: 100px; height: 100px;"
                                          :src="profilPicture" />
                                   <a-avatar v-else :size="100">
                                          <template #icon>
                                                 <user-outlined />
                                          </template>
                                   </a-avatar>
                            </div>
                            <div class="flex flex-col md:ml-14">
                                   <div class="flex flex-col sm:flex-row sm:items-center mt-3">
                                          <span>Username</span>
                                          <div class="w-fit">
                                                 <a-input class="sm:ml-3 w-full" v-model:value="username"
                                                        placeholder="Your" />
                                          </div>

                                   </div>
                                   <div v-if="email" class="flex flex-col sm:flex-row sm:items-center mt-3">
                                          <span>Email</span>
                                          <a-input class="sm:ml-3" style="width: fit-content;" disabled
                                                 v-model:value="email" placeholder="Your email" />
                                   </div>
                            </div>
                     </div>
                     <a-button class="mt-20" :disabled="!isProfileModified" @click="onSaveProfile" type="primary">Save
                            profil</a-button>
              </div>
       </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useUserInformationStore } from '@/stores/userInformationStore';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { message } from 'ant-design-vue';
import { auth } from '@/services/FirebaseConfig';

const userInformationStore = useUserInformationStore();

const username = ref<string | null>(null);
const profilPicture = ref<string | null>(null);
const email = ref<string | null>(null);
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

const initialValues = ref<{ username: string | null; email: string | null }>({
       username: null,
       email: null,
});

const isProfileModified = computed(() => {
       return initialValues.value.username !== username.value || initialValues.value.email !== email.value;
});

const fetchUserData = async () => {
       await userInformationStore.initAuthObserver();

       // Wait for the store to fetch data, then update local state
       username.value = userInformationStore.userInformation?.username ?? null;
       profilPicture.value = userInformationStore.userInformation?.profilePictureUrl ?? null;
       email.value = userInformationStore.userInformation?.email ?? null;

       // Set initial values for comparison
       initialValues.value = {
              username: username.value,
              email: email.value,
       };
};

onMounted(async () => {
       // Fetch user data when component mounts
       await fetchUserData();
});

const onSaveProfile = async () => {
       if (username.value && auth.currentUser) {
              try {
                     // Update the Firestore document with the new username
                     const firestore = getFirestore();
                     const userRef = doc(firestore, 'users', auth.currentUser.uid);
                     await setDoc(userRef, { username: username.value }, { merge: true });

                     message.info('Profile updated');

                     // Update the store with the new user information
                     userInformationStore.setUser({
                            id: auth.currentUser.uid,
                            username: username.value,
                            email: auth.currentUser.email,
                            profilePictureUrl: auth.currentUser.photoURL,
                            providerType: auth.currentUser.providerData[0].providerId,
                     });

                     // Reflect the updated data in the component's state
                     profilPicture.value = userInformationStore.userInformation?.profilePictureUrl ?? '';
                     username.value = userInformationStore.userInformation?.username ?? '';
                     email.value = userInformationStore.userInformation?.email ?? '';

                     // Update initial values for change detection
                     initialValues.value = {
                            username: username.value,
                            email: email.value,
                     };
              } catch (error) {
                     console.error('Error while updating profile:', error);
                     message.error('Error while updating profile');
              }
       } else {
              message.warning('Username is empty');
       }
};

// Watch for changes in the store's user information
watch(
       () => userInformationStore.userInformation,
       (newUserInfo) => {
              if (newUserInfo) {
                     username.value = newUserInfo.username;
                     profilPicture.value = newUserInfo.profilePictureUrl;
                     email.value = newUserInfo.email;

                     // Update initial values for comparison
                     initialValues.value = {
                            username: username.value,
                            email: email.value,
                     };
              }
       },
       { immediate: true } // Execute the watcher immediately on component mount
);

</script>
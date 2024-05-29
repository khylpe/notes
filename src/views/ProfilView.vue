<template>
       <div class="mt-8 mx-4">
              <a-tabs v-model:activeKey="activeKey" size="large" tabPosition="right">
                     <a-tab-pane key="information" tab="Main information">
                            <span class="text-3xl">Information</span>
                            <div class="flex flex-col md:flex-row md:items-center mt-6">
                                   <!-- maybe remove items-center if too much content-->
                                   <div class="flex flex-row mt-3">
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
                     </a-tab-pane>
                     <a-tab-pane key="preferences" disabled tab="Preferences">
                            Preferences
                     </a-tab-pane>
                     <a-tab-pane key="account" disabled tab="Account">
                            Account
                     </a-tab-pane>
              </a-tabs>
       </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { updateProfile } from 'firebase/auth';
import auth from '@/services/FirebaseConfig';
import { UserOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useUserInformationStore } from '@/stores/userInformationStore';

const userInformationStore = useUserInformationStore();
const activeKey = ref('information');
const username = ref<string | null>(userInformationStore.userInformation?.username ?? null);
console.log("🚀 ~ username:", username);
const profilPicture = ref<string | null>(userInformationStore.userInformation?.profilePictureUrl ?? null);
const email = ref<string | null>(userInformationStore.userInformation?.email ?? null);
const providerType = ref<string | null>(userInformationStore.userInformation?.providerType ?? null);

const initialValues = ref({
       username: userInformationStore.userInformation?.username ?? null,
       email: userInformationStore.userInformation?.email ?? null
});
const isProfileModified = computed(() => {
       return initialValues.value.username !== username.value || initialValues.value.email !== email.value;
});

const onSaveProfile = async () => {
       if (username.value && auth.currentUser) {
              try {
                     await updateProfile(auth.currentUser, {
                            displayName: username.value,
                     });
                     message.info("Profile updated");

                     // Update the store with the new user information from firebase
                     userInformationStore.setUser({
                            id: auth.currentUser.uid,
                            username: auth.currentUser.displayName,
                            email: auth.currentUser.email,
                            profilePictureUrl: auth.currentUser.photoURL,
                            providerType: auth.currentUser.providerData[0].providerId,
                     });

                     // Update the component state with the store to reflect the new values
                     profilPicture.value = userInformationStore.userInformation?.profilePictureUrl ?? '';
                     username.value = userInformationStore.userInformation?.username ?? '';
                     email.value = userInformationStore.userInformation?.email ?? '';

                     // Update the initial values to reflect the new values (to be able to check if the user modified the profile)
                     initialValues.value = {
                            username: userInformationStore.userInformation?.username ?? null,
                            email: userInformationStore.userInformation?.email ?? null
                     };

              } catch (error) {
                     console.error("Error while updating profile:", error);
                     message.error("Error while updating profile");
              }
       } else {
              message.warning("Username is empty");
       }
};

</script>
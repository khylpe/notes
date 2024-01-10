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
                                                 <a-input class="sm:ml-3" style="width: fit-content;" v-model:value="username"
                                                        placeholder="Your username" />
                                          </div>
                                          <div v-if="email" class="flex flex-col sm:flex-row sm:items-center mt-3">
                                                 <span>Email</span>
                                                 <a-input class="sm:ml-3" style="width: fit-content;"
                                                        disabled
                                                        v-model:value="email"
                                                        placeholder="Your email" />
                                          </div>
                                   </div>
                            </div>
                            <a-button class="mt-20" :disabled="!isProfileModified" @click="onSaveProfile" type="primary">Save
                                   profil</a-button>
                     </a-tab-pane>
                     <a-tab-pane key="preferences" tab="Preferences" force-render>
                            Preferences
                     </a-tab-pane>
                     <a-tab-pane key="account" tab="Account">
                            Account
                     </a-tab-pane>
              </a-tabs>
       </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import auth from '@/services/FirebaseConfig';
import { UserOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const activeKey = ref('information');
const initialValues = ref<{ username: string | null, email: string | null }>({ username: null, email: null });
const username = ref<string | null>(null);
const profilPicture = ref<string | null>(null);
const email = ref<string | null>(null);
const providerType = ref<string | null>(null);

const isProfileModified = computed(() => {
       return initialValues.value.username !== username.value || initialValues.value.email !== email.value;
});
// Example of an authentication state change handler
onAuthStateChanged(auth, (user) => {
       if (user) {
              username.value = user.displayName;
              profilPicture.value = user.photoURL;
              email.value = user.email;
              providerType.value = user.providerData[0].providerId;
              initialValues.value = { username: user.displayName, email: user.email };
       } else {
              console.log('User is signed out');
       }
});
const onSaveProfile = async () => {
       if (username.value && auth.currentUser) {
              try {
                     await updateProfile(auth.currentUser, {
                            displayName: username.value,
                     });
                     message.info("Profile updated");

                     // Mettre à jour les valeurs réactives après le rechargement
                     profilPicture.value = auth.currentUser.photoURL;
                     username.value = auth.currentUser.displayName;
                     email.value = auth.currentUser.email;
                     initialValues.value = { username: auth.currentUser.displayName, email: auth.currentUser.email };
              } catch (error) {
                     console.error("Error while updating profile:", error);
                     message.error("Error while updating profile");
              }
       } else {
              message.warning("Username is empty");
       }
};

</script>
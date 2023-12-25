<script setup lang="ts">
import { RouterView } from 'vue-router'
import SideBar from '@/components/SideBar.vue';
import SearchBar from '@/components/SearchBar.vue';
import LoginForm from '@/components/LoginForm.vue';
import VeryEmail from './components/VeryEmail.vue';
import { onAuthStateChanged, getAuth, reload } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { ref } from 'vue';
import auth from '@/services/FirebaseConfig';
import Header from '@/components/Header.vue';

const isAuthenticated = ref(false);
const isEmailVerified = ref(false);
const signUpMethod = ref('');

const checkSignUpMethod = (user: User | null) => {
       if (user && user.providerData.length > 0) {
              // Assuming the first provider in the array is the sign-up method
              const provider = user.providerData[0];
              if (provider.providerId === 'password') {
                     signUpMethod.value = 'Email/Password';
              } else {
                     // Other providers like 'google.com', 'facebook.com', etc.
                     signUpMethod.value = provider.providerId;
              }
       } else {
              signUpMethod.value = '';
       }
};
onAuthStateChanged(auth, (user) => {
       isAuthenticated.value = !!user;
       isEmailVerified.value = user ? user.emailVerified : false;
       checkSignUpMethod(user); // Check the sign-up method when auth state changes
});
const checkEmailVerification = async () => {
       const currentUser = getAuth().currentUser;
       if (currentUser) {
              // Reload the user to get the latest data
              await reload(currentUser);
              isEmailVerified.value = currentUser.emailVerified;
       }
};
const refreshAppData = async () => {
       console.log("Refreshing App.vue data");
       await checkEmailVerification();
};

</script>
<template>
       <Header></Header>

       <!-- Not connected -->
       <main v-if="!isAuthenticated">
              <div class="col col-12 flex flex-row justify-center items-center h-100 rm-header-height">
                     <LoginForm />
              </div>
       </main>

       <!-- Connected but email not verified -->
       <main v-else-if="!isEmailVerified && signUpMethod=='Email/Password'">
              <div class="col col-12 flex flex-row justify-center items-center h-100 rm-header-height">
                     <VeryEmail @refreshApp="refreshAppData"></VeryEmail>
              </div>
       </main>

       <!-- Connected and email verified -->
       <main class="flex flex-row" v-else>
              <SideBar />
              <div class="content-page">
                     <SearchBar />
                     <RouterView />
              </div>
       </main>
</template>

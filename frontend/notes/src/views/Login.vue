<template>
       <div class="col col-12 flex flex-row justify-center items-center h-100 rm-header-height">
              <div class="flex flex-column items-center">
                     <span class="h1" v-if="state.iHaveAnAccount">Log in</span>
                     <span class="h1" v-else>Sign up</span>

                     <a-form :model="formState" name="normal_login" class="login-form mt3" @finish="onFinish"
                            @finishFailed="onFinishFailed">
                            <a-form-item name="username"
                                   :rules="[{ required: !state.iHaveAnAccount, message: 'Please input your username!' }]">
                                   <a-input v-model:value="formState.username" size="large"
                                          :disabled="state.submitting || state.iHaveAnAccount" placeholder="Username">
                                          <template #prefix>
                                                 <UserOutlined class="site-form-item-icon" />
                                          </template>
                                   </a-input>
                            </a-form-item>

                            <a-form-item name="email" :rules="[{ required: true, message: 'Please input your email!' }]">
                                   <a-auto-complete v-model:value="formState.email" size="large" :disabled="state.submitting"
                                          :options="emailOptions" @search="handleEmailSearch" style="width: 100%;">
                                          <a-input slot="input" :value="formState.email" placeholder="Mail" size="large">
                                                 <template #prefix>
                                                        <MailOutlined class="site-form-item-icon" />
                                                 </template>
                                          </a-input>
                                   </a-auto-complete>
                            </a-form-item>


                            <a-form-item name="password" :rules="[{ required: true, message: 'Please input your password!' }]">
                                   <a-input-password v-model:value="formState.password" size="large"
                                          :disabled="state.submitting" placeholder="Password">
                                          <template #prefix>
                                                 <LockOutlined class="site-form-item-icon" />
                                          </template>
                                   </a-input-password>
                            </a-form-item>

                            <a-form-item class="flex justify-center">
                                   <a-switch v-model:checked="state.iHaveAnAccount" checked-children="I have an account"
                                          un-checked-children="I don't have an account" />
                            </a-form-item>

                            <a-form-item class="flex justify-center">
                                   <a-button :disabled="isDisableSubmit" :loading="state.submitting" type="primary"
                                          html-type="submit" class="login-form-button">
                                          <span v-if="state.iHaveAnAccount">Log in</span>
                                          <span v-else>Sign up</span>
                                   </a-button>
                            </a-form-item>
                     </a-form>

                     <a-divider>Use a provider</a-divider>

                     <div class="flex flex-column" style="width: 100%;">
                            <a-button @click="signInWithGoogle" style="height: fit-content;">
                                   <div class="flex items-center justify-around">
                                          <img src="@/assets/google-color-icon.svg" alt="Google Icon" srcset="" width="25"
                                                 height="25">
                                          <span>Log in or Sign up with Google</span>
                                   </div>
                            </a-button>
                            <a-button @click="signInWithGithub" style="height: fit-content;" class="mt1">
                                   <div class="flex items-center justify-around">
                                          <GithubOutlined style="font-size: 25px;" />
                                          <span>Log in or Sign up with GitHub</span>
                                   </div>
                            </a-button>
                     </div>
              </div>
       </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import { UserOutlined, LockOutlined, GoogleOutlined, GithubOutlined, MailOutlined } from '@ant-design/icons-vue';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, GithubAuthProvider, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import auth from "@/services/FirebaseConfig"; // Adjust the path as necessary
import { message } from 'ant-design-vue';
import router from "@/router"; // Adjust the path as necessary
import { useNotesStore } from '@/stores/notesStore';

const emailOptions = ref<{ value: string }[]>([]);

const handleEmailSearch = (val: string) => {
       const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com', 'mail.com', 'yandex.com', 'live.com', 'msn.com'];

       // Split the input at '@'
       const [namePart, domainPart] = val.includes('@') ? val.split('@') : [val, ''];

       // Filter the domains based on the domain part of the input
       const filteredDomains = domainPart
              ? domains.filter(domain => domain.startsWith(domainPart))
              : domains;

       // Map the filtered domains to autocomplete options
       emailOptions.value = filteredDomains.map(domain => ({ value: `${namePart}@${domain}` }));
};




const state = reactive({
       iHaveAnAccount: true,
       submitting: false, // Add this property

});
interface FormState {
       email: string;
       username: string;
       password: string;
}
interface FirebaseAuthError {
       code: string;
       message: string;
}
const formState = reactive<FormState>({
       email: '',
       username: '',
       password: '',
});
const onFinish = async () => {
       state.submitting = true; // Start the submission process
       try {
              if (state.iHaveAnAccount) {
                     await login();
                     message.success('Login successful');
              } else {
                     await signUp();
                     message.success('Sign up successful');
              }
              const store = useNotesStore();
              await store.fetchAndStoreNotes();
              router.push('/notes');
       } catch (error: any) {
              console.error('Authentication failed:', error);
              const errorMessage = handleAuthError(error);
              message.error(errorMessage);
       }
       finally {
              state.submitting = false; // End the submission process
       }
};
const onFinishFailed = (errorInfo: any) => {
       console.log('Failed:', errorInfo);
       message.error(`Please fill in all the fields. Error: ${errorInfo}`);
};
const login = async () => {
       const userCredential = await signInWithEmailAndPassword(auth, formState.email, formState.password);
       // Return the user credential or throw an error
       return userCredential;
};
const signUp = async () => {
       const userCredential = await createUserWithEmailAndPassword(auth, formState.email, formState.password);
       await updateProfile(userCredential.user, { displayName: formState.username });

       // Send verification email
       await sendEmailVerification(userCredential.user)
              .then(() => {
                     console.log("Verification email sent.");
              })
              .catch((error) => {
                     console.error("Error sending verification email:", error);
              });

       // Return the user credential or throw an error
       return userCredential;
};
const handleAuthError = (error: FirebaseAuthError): string => {
       switch (error.code) {
              case 'auth/invalid-email':
                     return 'Invalid email format.';
              case 'auth/user-disabled':
                     return 'This account has been disabled.';
              case 'auth/user-not-found':
              case 'auth/wrong-password':
                     return 'Incorrect email or password.';
              case 'auth/email-already-in-use':
                     return 'This email is already in use.';
              // Add more cases as needed
              case 'auth/too-many-requests':
                     return 'Too many requests. Please try again later.';
              case 'auth/operation-not-allowed':
                     return 'Operation not allowed. Please contact support.';
              case 'auth/invalid-credential':
                     return 'Invalid credential. Please try again.';
              default:
                     return `An unexpected error occurred. Please try again. Error code : ${error.code}`;
       }
};
const signInWithGoogle = async () => {
       const provider = new GoogleAuthProvider();
       try {
              const result = await signInWithPopup(auth, provider);
              const credential = GoogleAuthProvider.credentialFromResult(result);
              if (credential === null) {
                     throw new Error('Credential is null');
              }
              const store = useNotesStore();
              await store.fetchAndStoreNotes();
              router.push('/notes');
       } catch (error) {
       }
};
const signInWithGithub = async () => {
       const provider = new GithubAuthProvider();
       try {
              const result = await signInWithPopup(auth, provider);
              const credential = GithubAuthProvider.credentialFromResult(result);
              if (credential === null) {
                     console.log('Credential is null');
                     throw new Error('Credential is null');
              }
              const store = useNotesStore();
              await store.fetchAndStoreNotes();
              router.push('/notes');
       } catch (error) {
       }
};
const isDisableSubmit = computed(() => {
       return !(formState.email && formState.password) || state.submitting;
});
</script>
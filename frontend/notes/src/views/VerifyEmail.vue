<template>
       <div class="col col-12 flex flex-row justify-center items-center h-100 rm-header-height">
              <a-card hoverable style="width: 300px">
                     <template #cover>
                            <img src="@/assets/mail.png" alt="Mail image by ChatGPT/DALL-E">
                     </template>
                     <template #actions>
                            <a-tooltip placement="bottom" color="cyan">
                                   <template #title>{{ userEmail }}</template>
                                   <InfoCircleOutlined />
                            </a-tooltip>

                            <a-popover placement="bottom" trigger="click" title="Profil settings">
                                   <template #content>
                                          <div class="flex flex-row items-center justify-between mt3">
                                                 <a-avatar :size="36" class="mr3" v-if="userProfilePicture"
                                                        :src="userProfilePicture" />
                                                 <a-avatar v-else :size="36" class="mr3">
                                                        <UserOutlined width="65px" />
                                                 </a-avatar>
                                                 <a-upload name="file" list-type="picture" class="flex flex-row items-center">
                                                        <a-button type="text">
                                                               <edit-outlined key="edit" />
                                                        </a-button>
                                                 </a-upload>
                                          </div>
                                          <Divider class="my1" />
                                          <a-form :model="formState" name="normal_login"
                                                 class="login-form flex flex-row items-center justify-between"
                                                 @finish="onFinish" @finishFailed="onFinishFailed">

                                                 <a-form-item name="username" :rules="usernameRules">
                                                        <a-input style="width: 110px;" :disabled="isInputUsernameDisabled"
                                                               v-model:value="formState.username"
                                                               :bordered="!isInputUsernameDisabled" />
                                                 </a-form-item>
                                                 <div class="flex justify-center">
                                                        <a-form-item v-if="isInputUsernameDisabled">
                                                               <a-button @click="handleEditUsername" type="text"><edit-outlined
                                                                             key="edit" /></a-button>
                                                        </a-form-item>

                                                        <a-form-item v-if="!isInputUsernameDisabled">
                                                               <a-button @click="handleEditUsername" type="text">
                                                                      <CloseOutlined style="color: red;" />
                                                               </a-button>
                                                        </a-form-item>

                                                        <a-form-item v-if="!isInputUsernameDisabled">
                                                               <a-button class="login-form-button" type="text"
                                                                      html-type="submit">
                                                                      <CheckOutlined style="color: green;" />
                                                               </a-button>
                                                        </a-form-item>
                                                 </div>
                                          </a-form>
                                   </template>
                                   <setting-outlined key="setting" />
                            </a-popover>
                            <a-tooltip placement="bottom" color="cyan" @click="onRefreshClicked">
                                   <template #title>Refresh</template>
                                   <a-badge :offset="[10, -5]" :count="remainingSeconds">
                                          <UndoOutlined :style="{ cursor: isRefreshDisabled ? 'not-allowed' : 'pointer' }" />
                                   </a-badge>
                            </a-tooltip>
                     </template>
                     <a-card-meta :title="title">
                            <template #avatar>
                                   <a-avatar :size="36" class="mr2" v-if="userProfilePicture" :src="userProfilePicture" />
                                   <a-avatar v-else :size="36" class="mr2">
                                          <UserOutlined width="65px" />
                                   </a-avatar>
                            </template>
                            <template #description>
                                   <div>Please check your mailbox and verify your address before using the website.</div>
                            </template>
                     </a-card-meta>
              </a-card>
       </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { SettingOutlined, EditOutlined, EllipsisOutlined, UserOutlined, InfoCircleOutlined, CheckOutlined, CloseOutlined, UndoOutlined } from '@ant-design/icons-vue';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { Divider, message } from 'ant-design-vue';
import auth from '@/services/FirebaseConfig';
import router from '@/router';

const isRefreshDisabled = ref(false); // New reactive property
const remainingSeconds = ref(0); // New reactive property for countdown

const onRefreshClicked = () => {
       if (isRefreshDisabled.value) {
              return; // Do nothing if the button is disabled
       }

       isRefreshDisabled.value = true;
       remainingSeconds.value = 5; // Start the countdown from 5 seconds
       const intervalId = setInterval(() => {
              remainingSeconds.value--;
              if (remainingSeconds.value === 0) {
                     clearInterval(intervalId); // Clear the interval when countdown is finished
                     isRefreshDisabled.value = false;
              }
       }, 1000);
       router.push('/notes');
       console.log("onRefreshClicked");
};

const userProfilePicture = ref<string>('');
const userEmail = ref<string>('');
const title = ref<string>('');
const isInputUsernameDisabled = ref<boolean>(true);

interface FormState {
       username: string;
}
const formState = reactive<FormState>({
       username: '',
});
const usernameRules = [
       { required: true, message: 'Please input your username!', trigger: 'blur' },
       { min: 3, message: 'Username must be at least 3 characters', trigger: 'blur' }
       // You can add more rules as needed
];
onAuthStateChanged(auth, (user) => {
       userProfilePicture.value = user?.photoURL || '';
       userEmail.value = user?.email || '';
       formState.username = user?.displayName || 'Anonymous';
       title.value = user?.displayName ? `Hi ${formState.username},` : "Mail verification";
});
const handleEditUsername = () => {
       isInputUsernameDisabled.value = !isInputUsernameDisabled.value;
};
const onFinish = async () => {
       console.log("onFinish")
       try {
              if (auth.currentUser && formState.username) {
                     await updateProfile(auth.currentUser, {
                            displayName: formState.username,
                     });
                     message.success('Username updated successfully');
                     handleEditUsername();
                     title.value = `Hi ${formState.username},`;
              } else {
                     message.error('No username provided');
              }
       } catch (error) {
              console.error('Username update failed', error);
              message.error('Username update failed');
       }
};
const onFinishFailed = (errorInfo: any) => {
       console.log('Failed:', errorInfo);
       message.error(`Please fill in all the fields. Error: ${errorInfo}`);
};
</script>
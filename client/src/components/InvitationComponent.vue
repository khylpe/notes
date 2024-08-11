<template>
       <a-card class="w-[300px] sm:w-[550px] md:w-[550px] lg:w-[750px] xl:w-[800px] 2xl:w-[1000px] p-0">
              <template #actions>
                     <a-tooltip title="Accept Invitation">
                            <CheckOutlined @click="acceptInvitation(invitation.noteId)"
                                   style="color: green; cursor: pointer;" />
                     </a-tooltip>

                     <a-tooltip title="Refuse Invitation">
                            <CloseCircleOutlined @click="refuseInvitation(invitation.noteId)"
                                   style="color: red; cursor: pointer;" />
                     </a-tooltip>
              </template>

              <template #title>
                     <div class="flex flex-row items-center">
                            <a-tooltip :title="`${invitation.owner.username} (${invitation.owner.email})`">
                                   <img v-if="invitation.owner.imageUrl" :src="invitation.owner.imageUrl"
                                          alt="Owner Image"
                                          style="width: 30px; height: 30px; border-radius: 50%; margin-right: 8px;" />
                            </a-tooltip>
                            <p class="mx-5">{{ invitation.noteTitle }}</p>
                     </div>
              </template>

              <a-card-meta style="min-height: 200px;">
                     <template #description>
                            <div>
                                   <div v-if="invitation.noteDescription.length > 250">
                                          <div v-html="truncatedMarkdown" class="!text-[#dfd9d9] markdowndiv">
                                          </div>
                                          <a v-if="!showFullContent" @click="toggleFullContent">Show More</a>
                                          <a v-if="showFullContent" @click="toggleFullContent">Show Less</a>
                                   </div>
                                   <div v-else>
                                          <div class="!text-[#dfd9d9] markdowndiv" v-html="invitation.noteDescription">
                                          </div>
                                   </div>
                            </div>
                     </template>
              </a-card-meta>

              <template #extra>
                     <a-tooltip class="ml-3" title="The note might have been modified since it was shared.">
                            <InfoCircleOutlined />
                     </a-tooltip>

                     <a-tooltip class="ml-3" :title="new Date(invitation.invitedDate).toLocaleDateString()">
                            <CalendarOutlined />
                     </a-tooltip>
              </template>
       </a-card>
</template>

<script setup lang="ts">
import { useInvitationStore } from '@/stores/invitationsStore';
import { onMounted, ref, computed } from 'vue';
import { CheckOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons-vue';
import { Spin, Tooltip, List, Card, message } from 'ant-design-vue';
import { getAuth } from 'firebase/auth';
import axios from 'axios'; // Import axios to make HTTP requests
import type { Invitation } from '@/types/Invitation';
import md from '@/markdown';
import { InfoCircleOutlined, CloseCircleOutlined } from '@ant-design/icons-vue';

const props = defineProps<{ note: Invitation }>();
const invitation = ref({ ...props.note });

const showFullContent = ref(false);

// Initialize the store
const sharedNotesStore = useInvitationStore();

// Method to accept an invitation
const acceptInvitation = async (noteId: string) => {
       const auth = getAuth();
       const user = auth.currentUser;

       if (!user) {
              message.error('You must be logged in to accept an invitation.');
              return;
       }

       try {
              // Get the ID token of the current user
              const idToken = await user.getIdToken();

              // Make the API call to accept the invitation
              const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/accept-invitation`, { noteId }, {
                     headers: {
                            Authorization: `Bearer ${idToken}`,
                     },
              });

              if (response.status === 200) {
                     message.success('Invitation accepted successfully!');
                     // Optionally, you can remove the accepted invitation from the local state
                     sharedNotesStore.fetchInitialInvitations(); // Refresh the invitations list
              } else {
                     message.error('Failed to accept the invitation.');
              }
       } catch (error) {
              console.error('Error accepting invitation:', error);
              message.error('An error occurred while accepting the invitation.');
       }
};

const refuseInvitation = async (noteId: string) => {
       const auth = getAuth();
       const user = auth.currentUser;

       if (!user) {
              message.error('You must be logged in to refuse an invitation.');
              return;
       }

       try {
              // Get the ID token of the current user
              const idToken = await user.getIdToken();

              // Make the API call to accept the invitation
              const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/refuse-invitation`, { noteId }, {
                     headers: {
                            Authorization: `Bearer ${idToken}`,
                     },
              });

              if (response.status === 200) {
                     message.success('Invitation refuse successfully!');
                     // Optionally, you can remove the accepted invitation from the local state
                     sharedNotesStore.fetchInitialInvitations(); // Refresh the invitations list
              } else {
                     message.error('Failed to refuse the invitation.');
              }
       } catch (error) {
              console.error('Error refusing invitation:', error);
              message.error('An error occurred while refusing the invitation.');
       }
};


const truncatedMarkdown = computed(() => {
       console.log('Rendering truncated markdown:', invitation.value.noteDescription);
       if (showFullContent.value || !invitation.value.noteDescription) {
              return compiledMarkdown.value;
       } else {
              // Truncate the content
              const truncatedContent = invitation.value.noteDescription.substring(0, 250) + (invitation.value.noteDescription.length > 250 ? '...' : '');
              return md.render(truncatedContent);
       }
});

const compiledMarkdown = computed(() => {
       console.log('Rendering markdown:', invitation.value.noteDescription);
       return md.render(invitation.value.noteDescription || '');
});

const toggleFullContent = () => {
       showFullContent.value = !showFullContent.value;
};
</script>

<style lang="less">
.full-modal {
       .ant-modal {
              max-width: 100%;
              top: 0;
              padding-bottom: 0;
              margin: 0;
       }

       .ant-modal-content {
              display: flex;
              flex-direction: column;
              height: 100vh;
              border-radius: 0;
       }

       .ant-modal-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              overflow-y: auto;
              /* Ensure content scrolls inside the modal */
              background-color: #3E3E3E;
              /* Ensures the background color covers the entire content area */
       }

       .full-screen-modal-content {
              flex: 1;
              padding: 16px;
              /* Add some padding for content spacing */
              overflow-y: auto;
       }

       .ant-modal-footer {
              padding: 16px;
              background-color: #3E3E3E;
              /* Match the background color */
       }

       .modal-footer {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;

              .anticon {
                     font-size: 20px;
                     cursor: pointer;
              }

              .ant-divider-vertical {
                     height: 24px;
                     margin: 0 16px;
              }

              .ant-tooltip-open {
                     display: inline-flex;
              }
       }
}

.textarea-container {
       height: calc(100vh - 200px);
       /* Adjust this value to ensure the textarea fits well with the footer */
       display: flex;
       flex-direction: column;
}

.full-height-textarea {
       flex: 1;
       resize: none;
       height: 100%;
}
</style>
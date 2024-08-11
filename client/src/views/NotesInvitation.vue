<script setup lang="ts">
import { useInvitationStore } from '@/stores/invitationsStore';
import { onMounted, ref, computed } from 'vue';
import { CheckOutlined, CalendarOutlined } from '@ant-design/icons-vue';
import InvitationComponent from '@/components/InvitationComponent.vue';
// Initialize the store
const sharedNotesStore = useInvitationStore();
const loading = ref(true);

// When the component is mounted, fetch the initial data and start listening for invitations
onMounted(() => {
       sharedNotesStore.fetchInitialInvitations(); // Fetch existing invitations
       loading.value = false;
});

// Use computed property to ensure reactivity
const invitations = computed(() => sharedNotesStore.invitations);
</script>


<template>
       <div class="flex flex-wrap justify-center mt-4">
              <div v-if="invitations.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">

                     <!-- Owned Notes -->
                     <div class="note flex justify-center" v-for="invitation in invitations" :key="invitation.noteId">
                            <InvitationComponent :note="invitation" />
                     </div>
              </div>

              <a-result v-else status="info" title="Create or access your notes"
                     sub-title="You currently have no notes. Create a new note or accept an invitation to access shared notes.">
              </a-result>
       </div>
</template>

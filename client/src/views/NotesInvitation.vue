<script setup lang="ts">
import { useInvitationStore } from '@/stores/invitationsStore';
import { onMounted, ref, computed } from 'vue';
import InvitationComponent from '@/components/InvitationComponent.vue';
import SkeletonNote from '@/components/SkeletonNote.vue'; // Assuming you have a SkeletonNote component for loading state

// Initialize the store
const invitationStore = useInvitationStore();
const loading = ref(true);

// When the component is mounted, fetch the initial data and start listening for invitations
onMounted(async () => {
       try {
              await invitationStore.fetchInitialInvitations(); // Fetch existing invitations
       } finally {
              loading.value = false;
       }
});

// Use computed property to ensure reactivity
const invitations = computed(() => invitationStore.invitations);
</script>

<template>
       <div class="flex flex-wrap justify-center mt-4">
              <!-- Display skeletons while loading -->
              <div v-if="loading"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div v-for="index in 3" :key="index" class="note flex justify-center">
                            <SkeletonNote />
                     </div>
              </div>

              <!-- Display invitations if available -->
              <div v-else-if="invitations.length > 0"
                     class="notes-list flex flex-row items-start justify-center flex-wrap gap-4 sm:gap-3 md:gap-5 lg:gap-10 pl-3 sm:pl-0">
                     <div class="note flex justify-center" v-for="invitation in invitations" :key="invitation.noteId">
                            <InvitationComponent :note="invitation" />
                     </div>
              </div>

              <!-- Display message if no invitations are available -->
              <a-result v-else status="info" title="No Invitations Available"
                     sub-title="You currently have no invitations. Check back later.">
              </a-result>
       </div>
</template>

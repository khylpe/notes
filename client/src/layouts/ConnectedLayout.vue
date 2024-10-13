<template>
       <a-config-provider :theme="customTheme">
              <main class="flex flex-row min-h-screen"
                     :style="{ backgroundColor: customTheme.token.colorBgBase }">
                     <SideBar isNotDrawer />
                     <div class="mb-20 flex flex-col w-full mt-3 ml-0 sm:ml-6 md:ml-8 lg:ml-10 xl:ml-14 2xl:ml-20 mr-2 sm:mr-4 md:mr-6 lg:mr-8 xl:mr-10 2xl:mr-14">
                            <Header/>
                            <router-view></router-view>
                     </div>
              </main>
       </a-config-provider>
</template>

<script setup lang="ts">
console.log("loading in layout")
import SideBar from '@/components/SideBar.vue';
import { theme } from 'ant-design-vue';
import Header from '@/components/AppHeader.vue';
import { useInvitationStore } from '@/stores/invitationsStore';
import { useSharedNotesStore } from '@/stores/sharedNotesStore';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const invitationStore = useInvitationStore();
const sharedNotesStore = useSharedNotesStore();
const router = useRouter();

onMounted(() => {
       invitationStore.listenForUserInvitations(router); // Start listening for real-time updates
       sharedNotesStore.listenForInvitationStatusChanges();
});

const customTheme = {
       algorithm: theme.darkAlgorithm,
       token: {
              borderRadius: 8, // Slightly rounded corners for a softer feel
              colorBgBase: '#1f1f1f', // Softer dark background color
              colorError: '#ff6b6b', // Softer error color
              colorInfo: '#409eff', // Softer info color
              colorPrimary: '#1677ff', // Softer primary color
              colorSuccess: '#52c41a', // Softer success color
              colorTextBase: '#e0e0e0', // Softer text color
              colorWarning: '#faad14', // Softer warning color
              controlHeight: 36, // Slightly larger control height for better accessibility
              fontSize: 14, // Default font size
              lineType: 'solid', // Default line type
              lineWidth: 1, // Default line width
              motionBase: 0, // No motion
              motionEaseInBack: 'cubic-bezier(0.71, -0.46, 0.88, 0.6)', // Default motion easing
              motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)', // Default motion easing
              motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)', // Default motion easing
              motionEaseInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)', // Default motion easing
              motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)', // Default motion easing
              motionEaseOutBack: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)', // Default motion easing
              motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)', // Default motion easing
              motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)', // Default motion easing
              motionUnit: 0.1, // Default motion unit
              opacityImage: 0.8, // Softer image opacity
              sizePopupArrow: 12, // Slightly smaller popup arrow
              sizeStep: 4, // Default size step
              sizeUnit: 4, // Default size unit
              wireframe: false, // Disable wireframe
              zIndexBase: 0, // Default z-index base
              zIndexPopupBase: 1000, // Default z-index for popups
       }
};

</script>

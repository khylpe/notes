import { defineStore } from 'pinia';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get, onValue } from 'firebase/database';
import type { Invitation } from '@/types/Invitation';
import { notification } from 'ant-design-vue';
import { h } from 'vue';  // Import Vue's h function for rendering JSX

export const useInvitationStore = defineStore('invitationStore', {
    state: () => ({
        invitations: [] as Invitation[],
        initialFetchDone: false,
        seenInvitations: new Set<string>(),
    }),
    actions: {
        async fetchInitialInvitations() {
            console.log('Fetching initial invitations');
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                const db = getDatabase();
                const invitationsRef = ref(db, `invitations/${user.uid}`);

                try {
                    const snapshot = await get(invitationsRef);
                    if (snapshot.exists()) {
                        const invitationsData = snapshot.val();
                        this.invitations = Object.keys(invitationsData).map(noteId => ({
                            noteId,
                            ...invitationsData[noteId],
                        }));
                        console.log('Initial invitations:', this.invitations);
                    } else {
                        this.invitations = [];
                        console.log('No initial invitations found for user:', user.uid);
                    }
                } catch (error) {
                    console.error('Error fetching initial invitations:', error);
                } finally {
                    this.initialFetchDone = true;
                }
            } else {
                console.error('User not logged in');
            }
        },

        listenForUserInvitations(router: any) {  // Accept router as an argument
            console.log('listenForUserInvitations action called');
            const auth = getAuth();
            auth.onAuthStateChanged((user) => {
                if (user) {
                    const db = getDatabase();
                    const invitationsRef = ref(db, `invitations/${user.uid}`);
                    console.log('Listening for invitations at path:', `invitations/${user.uid}`);

                    const seenInvitations = new Set(JSON.parse(localStorage.getItem(`seenInvitations_${user.uid}`) || '[]'));

                    onValue(invitationsRef, (snapshot) => {
                        if (snapshot.exists()) {
                            const invitationsData = snapshot.val();
                            const newInvitations = Object.keys(invitationsData).map(noteId => ({
                                noteId,
                                ...invitationsData[noteId],
                            }));

                            newInvitations.forEach(invitation => {
                                if (!seenInvitations.has(invitation.noteId)) {
                                    notification.info({
                                        message: 'New Invitation',
                                        description: h('div', [
                                            `You have been invited to collaborate on the note titled "${invitation.noteTitle}".`,
                                            h('br'),
                                            h('button', {
                                                style: {
                                                    marginTop: '10px',
                                                    border: 'none',
                                                    backgroundColor: '#1890ff',
                                                    color: 'white',
                                                    padding: '5px 10px',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px'
                                                },
                                                onClick: () => {
                                                    router.push('/notes/invitations');  // Use the passed router
                                                }
                                            }, 'View Invitation')
                                        ])
                                    });
                                    seenInvitations.add(invitation.noteId);
                                }
                            });

                            localStorage.setItem(`seenInvitations_${user.uid}`, JSON.stringify(Array.from(seenInvitations)));

                            this.invitations = newInvitations;
                            console.log('Processed invitations:', this.invitations);
                        } else {
                            this.invitations = [];
                            console.log('No invitations found for user:', user.uid);
                        }
                    }, (error) => {
                        console.error('Error while listening for invitations:', error);
                    });
                } else {
                    console.error('User not logged in');
                }
            }, (error) => {
                console.error('Error in onAuthStateChanged:', error);
            });
        },

        countInvitations() {
            return this.invitations.length;
        }
    },
});

import { defineStore } from 'pinia';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, update, get, set, remove } from 'firebase/database';
import type { SharedNoteType } from '@/types/SharedNote';
import { notification } from 'ant-design-vue';

export const useSharedNotesStore = defineStore('sharedNotes', {
       state: () => ({
              ownedNotes: [] as SharedNoteType[],        // Notes owned by the user
              allNotes: [] as SharedNoteType[],          // All notes accessible to the user (owned + shared)
              sharedWithMeNotes: [] as SharedNoteType[], // Notes shared with the user (excluding owned)
       }),
       actions: {
              async fetchOwnedNotes() {
                     console.log('Fetching owned notes');
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (user) {
                            const db = getDatabase();
                            const userNotesRef = ref(db, `userNotes/${user.uid}`);

                            try {
                                   const snapshot = await get(userNotesRef);
                                   if (snapshot.exists()) {
                                          const noteIds = snapshot.val();
                                          const notesPromises = noteIds.map(async (noteId: string) => {
                                                 const noteRef = ref(db, `notes/${noteId}`);
                                                 const noteSnapshot = await get(noteRef);
                                                 if (noteSnapshot.exists()) {
                                                        const note = noteSnapshot.val();
                                                        if (note.owner === user.uid) {
                                                               return { ...note, id: noteId };
                                                        }
                                                        return null;
                                                 }
                                                 return null;
                                          });

                                          const notes = await Promise.all(notesPromises);
                                          this.ownedNotes = notes.filter(note => note !== null) as SharedNoteType[];
                                          console.log('Owned notes:', this.ownedNotes);
                                   } else {
                                          this.ownedNotes = [];
                                          console.log('No owned notes found for user:', user.uid);
                                   }
                            } catch (error) {
                                   console.error('Error fetching owned notes:', error);
                            }
                     } else {
                            console.error('User not logged in');
                     }
              },

              async fetchSharedWithMeNotes() {
                     console.log('Fetching notes shared with me');
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (user) {
                            const db = getDatabase();
                            const userNotesRef = ref(db, `userNotes/${user.uid}`);

                            try {
                                   const snapshot = await get(userNotesRef);
                                   if (snapshot.exists()) {
                                          const noteIds = snapshot.val();
                                          const notesPromises = noteIds.map(async (noteId: string) => {
                                                 const noteRef = ref(db, `notes/${noteId}`);
                                                 const noteSnapshot = await get(noteRef);
                                                 if (noteSnapshot.exists()) {
                                                        const note = noteSnapshot.val();
                                                        if (note.owner !== user.uid && note.users && note.users[user.uid]) {
                                                               return { ...note, id: noteId };
                                                        }
                                                        return null;
                                                 }
                                                 return null;
                                          });

                                          const notes = await Promise.all(notesPromises);
                                          this.sharedWithMeNotes = notes.filter(note => note !== null) as SharedNoteType[];
                                          console.log('Notes shared with me:', this.sharedWithMeNotes);
                                   } else {
                                          this.sharedWithMeNotes = [];
                                          console.log('No shared notes found for user:', user.uid);
                                   }
                            } catch (error) {
                                   console.error('Error fetching notes shared with me:', error);
                            }
                     } else {
                            console.error('User not logged in');
                     }
              },

              async fetchAllNotes() {
                     console.log('Fetching all notes accessible to the user');
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (user) {
                            const db = getDatabase();
                            const userNotesRef = ref(db, `userNotes/${user.uid}`);

                            try {
                                   const snapshot = await get(userNotesRef);
                                   if (snapshot.exists()) {
                                          const noteIds = snapshot.val();
                                          const notesPromises = noteIds.map(async (noteId: string) => {
                                                 const noteRef = ref(db, `notes/${noteId}`);
                                                 const noteSnapshot = await get(noteRef);
                                                 if (noteSnapshot.exists()) {
                                                        const note = noteSnapshot.val();
                                                        if (note.owner === user.uid || (note.users && note.users[user.uid])) {
                                                               return { ...note, id: noteId };
                                                        }
                                                        return null;
                                                 }
                                                 return null;
                                          });

                                          const notes = await Promise.all(notesPromises);
                                          this.allNotes = notes.filter(note => note !== null) as SharedNoteType[];
                                          console.log('All accessible notes:', this.allNotes);
                                   } else {
                                          this.allNotes = [];
                                          console.log('No notes found for user:', user.uid);
                                   }
                            } catch (error) {
                                   console.error('Error fetching all notes:', error);
                            }
                     } else {
                            console.error('User not logged in');
                     }
              },

              // Listen for real-time updates on notes and user notes
              listenForUserNotes() {
                     console.log('listenForUserNotes action called');
                     const auth = getAuth();
                     auth.onAuthStateChanged((user) => {
                            if (user) {
                                   const db = getDatabase();
                                   const userNotesRef = ref(db, `userNotes/${user.uid}`);
                                   console.log('Listening for notes at path:', `userNotes/${user.uid}`);

                                   onValue(userNotesRef, (snapshot) => {
                                          if (snapshot.exists()) {
                                                 const noteIds = snapshot.val();
                                                 this.allNotes = []; // Clear the notes array before repopulating it

                                                 // Listen to changes for each note in the user's note list
                                                 noteIds.forEach((noteId: string) => {
                                                        const noteRef = ref(db, `notes/${noteId}`);
                                                        onValue(noteRef, (noteSnapshot) => {
                                                               if (noteSnapshot.exists()) {
                                                                      const note = noteSnapshot.val();
                                                                      const updatedNote = { ...note, id: noteId };

                                                                      this.updateStateWithNote(updatedNote, user.uid);
                                                                      console.log('Updated note:', this.allNotes);
                                                               } else {
                                                                      console.log(`Note with ID: ${noteId} does not exist`);
                                                               }
                                                        });
                                                 });
                                          } else {
                                                 this.clearAllStates();
                                                 console.log('No notes found for user:', user.uid);
                                          }
                                   }, (error) => {
                                          console.error('Error while listening for user notes:', error);
                                   });
                            } else {
                                   console.error('User not logged in');
                            }
                     }, (error) => {
                            console.error('Error in onAuthStateChanged:', error);
                     });
              },

              async pinNote(noteId: string) {
                     console.log(`Pinning note ID: ${noteId}`);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not authenticated');
                            return;
                     }

                     const userId = user.uid;
                     const db = getDatabase();
                     const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);

                     try {
                            await update(userNoteRef, { isPinned: true });
                            console.log(`Note ID: ${noteId} pinned successfully`);
                            await this.updateNoteState(noteId, userId, { isPinned: true });
                     } catch (error) {
                            console.error('Error pinning note:', error);
                     }
              },

              async unpinNote(noteId: string) {
                     console.log(`Unpinning note ID: ${noteId}`);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not authenticated');
                            return;
                     }

                     const userId = user.uid;
                     const db = getDatabase();
                     const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);

                     try {
                            await update(userNoteRef, { isPinned: false });
                            console.log(`Note ID: ${noteId} unpinned successfully`);
                            await this.updateNoteState(noteId, userId, { isPinned: false });
                     } catch (error) {
                            console.error('Error unpinning note:', error);
                     }
              },

              async updateNoteFolder(noteId: string, newFolderId: string | null) {
                     console.log(`Updating folder for note ID: ${noteId} to folder ID: ${newFolderId}`);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not authenticated');
                            return;
                     }

                     const userId = user.uid;
                     const db = getDatabase();
                     const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);

                     try {
                            await update(userNoteRef, { folderId: newFolderId });
                            console.log(`Folder for note ID: ${noteId} updated to folder ID: ${newFolderId}`);
                            await this.updateNoteState(noteId, userId, { folderId: newFolderId });
                     } catch (error) {
                            console.error('Error updating folder for note:', error);
                     }
              },

              // Helper function to update note state across all relevant arrays
              updateStateWithNote(updatedNote: SharedNoteType, userId: string) {
                     // Update ownedNotes if applicable
                     if (updatedNote.owner === userId) {
                            const ownedIndex = this.ownedNotes.findIndex(note => note.id === updatedNote.id);
                            if (ownedIndex !== -1) {
                                   this.ownedNotes[ownedIndex] = updatedNote;
                            } else {
                                   this.ownedNotes.push(updatedNote);
                            }
                     }

                     // Update sharedWithMeNotes if applicable
                     if (updatedNote.owner !== userId && updatedNote.users && updatedNote.users[userId]) {
                            const sharedIndex = this.sharedWithMeNotes.findIndex(note => note.id === updatedNote.id);
                            if (sharedIndex !== -1) {
                                   this.sharedWithMeNotes[sharedIndex] = updatedNote;
                            } else {
                                   this.sharedWithMeNotes.push(updatedNote);
                            }
                     }

                     // Update allNotes
                     const allIndex = this.allNotes.findIndex(note => note.id === updatedNote.id);
                     if (allIndex !== -1) {
                            this.allNotes[allIndex] = updatedNote;
                     } else {
                            this.allNotes.push(updatedNote);
                     }
              },

              async updateNoteState(noteId: string, userId: string, updates: Partial<SharedNoteType['users'][string]>) {
                     const noteIndex = this.allNotes.findIndex(note => note.id === noteId);
                     if (noteIndex !== -1) {
                            this.allNotes[noteIndex].users[userId] = {
                                   ...this.allNotes[noteIndex].users[userId],
                                   ...updates,
                            };

                            // Ensure the changes reflect in the respective state arrays
                            this.updateStateWithNote(this.allNotes[noteIndex], userId);
                     }
              },

              async updateNoteTags(noteId: string, newTags: string[]) {
                     console.log(`Updating tags for note ID: ${noteId} to tags: ${newTags}`);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not authenticated');
                            return;
                     }

                     const userId = user.uid;
                     const db = getDatabase();
                     const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);

                     try {
                            await update(userNoteRef, { tags: newTags });
                            console.log(`Tags for note ID: ${noteId} updated to: ${newTags}`);
                            await this.updateNoteState(noteId, userId, { tags: newTags });
                     } catch (error) {
                            console.error('Error updating tags for note:', error);
                     }
              },

              async moveToArchive(noteId: string) {
                     console.log(`Moving note ID: ${noteId} to archive`);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not authenticated');
                            return;
                     }

                     const userId = user.uid;
                     const db = getDatabase();
                     const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);

                     try {
                            await update(userNoteRef, { isArchived: true, isDeleted: false, isPinned: false });
                            console.log(`Note ID: ${noteId} moved to archive successfully`);
                            await this.updateNoteState(noteId, userId, { isArchived: true, isDeleted: false, isPinned: false });
                     } catch (error) {
                            console.error('Error moving note to archive:', error);
                     }
              },

              async moveToMyList(noteId: string) {
                     console.log(`Removing note ID: ${noteId} from archive`);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not authenticated');
                            return;
                     }

                     const userId = user.uid;
                     const db = getDatabase();
                     const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);

                     try {
                            await update(userNoteRef, { isArchived: false, isDeleted: false, isPinned: false });
                            console.log(`Note ID: ${noteId} removed from archive successfully`);
                            await this.updateNoteState(noteId, userId, { isArchived: false, isDeleted: false, isPinned: false });
                     } catch (error) {
                            console.error('Error removing note from archive:', error);
                     }
              },

              async moveToDeletedFolder(noteId: string) {
                     console.log(`Moving note ID: ${noteId} to deleted folder`);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not authenticated');
                            return;
                     }

                     const userId = user.uid;
                     const db = getDatabase();
                     const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);

                     try {
                            await update(userNoteRef, { isDeleted: true, isArchived: false, isPinned: false });
                            console.log(`Note ID: ${noteId} moved to deleted folder successfully`);
                            await this.updateNoteState(noteId, userId, { isDeleted: true, isArchived: false, isPinned: false });
                     } catch (error) {
                            console.error('Error moving note to deleted folder:', error);
                     }
              },

              // Helper function to clear all state arrays
              clearAllStates() {
                     this.ownedNotes = [];
                     this.sharedWithMeNotes = [];
                     this.allNotes = [];
              },

              async updateWritePermission(noteId: string, userId: string, canWrite: boolean) {
                     console.log(`Updating write permission for user ${userId} on note ${noteId} to ${canWrite ? 'write' : 'read'}`);
                     const db = getDatabase();
                     const noteRef = ref(db, `notes/${noteId}/users/${userId}`);

                     try {
                            await update(noteRef, { rule: canWrite ? 'write' : 'read' });
                            console.log(`Write permission updated for user ${userId} on note ${noteId}`);

                            // Optionally, update the local state to reflect the change
                            const noteIndex = this.allNotes.findIndex(note => note.id === noteId);
                            if (noteIndex !== -1) {
                                   this.allNotes[noteIndex].users[userId].rule = canWrite ? 'write' : 'read';

                                   // Ensure the changes reflect in the respective state arrays
                                   this.updateStateWithNote(this.allNotes[noteIndex], userId);
                            }
                     } catch (error) {
                            console.error('Error updating write permission:', error);
                     }
              },

              async updateTitle(noteId: string, newTitle: string) {
                     console.log(`Updating title for note ID: ${noteId} to "${newTitle}"`);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not authenticated');
                            return;
                     }

                     const db = getDatabase();
                     const noteRef = ref(db, `notes/${noteId}`);

                     try {
                            await update(noteRef, { title: newTitle });
                            console.log(`Title updated successfully for note ID: ${noteId}`);

                            // Update the local state to reflect the title change
                            const noteIndex = this.allNotes.findIndex(note => note.id === noteId);
                            if (noteIndex !== -1) {
                                   this.allNotes[noteIndex].title = newTitle;

                                   // Ensure the changes reflect in the respective state arrays
                                   this.updateStateWithNote(this.allNotes[noteIndex], user.uid);
                            }
                     } catch (error) {
                            console.error('Error updating title:', error);
                     }
              },

              async editContent(noteId: string, newContent: string) {
                     console.log(`Updating content for note ID: ${noteId}`);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not authenticated');
                            return;
                     }

                     const db = getDatabase();
                     const noteRef = ref(db, `notes/${noteId}`);

                     try {
                            await update(noteRef, { content: newContent });
                            console.log(`Content updated successfully for note ID: ${noteId}`);

                            // Update the local state to reflect the content change
                            const noteIndex = this.allNotes.findIndex(note => note.id === noteId);
                            if (noteIndex !== -1) {
                                   this.allNotes[noteIndex].content = newContent;

                                   // Ensure the changes reflect in the respective state arrays
                                   this.updateStateWithNote(this.allNotes[noteIndex], user.uid);
                            }
                     } catch (error) {
                            console.error('Error updating content:', error);
                     }
              },
              async updateWatchingStatus(noteId: string, userId: string, isWatching: boolean) {
                     console.log(`Updating watching status for user ${userId} on note ${noteId} to ${isWatching}`);
                     const db = getDatabase();
                     const noteRef = ref(db, `notes/${noteId}`);

                     try {
                            // Check if the note exists
                            const noteSnapshot = await get(noteRef);
                            if (!noteSnapshot.exists()) {
                                   console.error(`Note ${noteId} does not exist, cannot update watching status.`);
                                   return;
                            }

                            const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);
                            await update(userNoteRef, { isWatching: isWatching });
                            console.log(`Watching status updated successfully for user ${userId} on note ${noteId}`);

                            // Update the local state to reflect the watching status change
                            const noteIndex = this.allNotes.findIndex(note => note.id === noteId);
                            if (noteIndex !== -1) {
                                   this.allNotes[noteIndex].users[userId].isWatching = isWatching;

                                   // Ensure the changes reflect in the respective state arrays
                                   this.updateStateWithNote(this.allNotes[noteIndex], userId);
                            }
                     } catch (error) {
                            console.error('Error updating watching status:', error);
                     }
              },

              async updateWritingStatus(noteId: string, userId: string, isWriting: boolean) {
                     console.log(`Updating writing status for user ${userId} on note ${noteId} to ${isWriting}`);
                     const db = getDatabase();
                     const noteRef = ref(db, `notes/${noteId}`);

                     try {
                            // Check if the note exists
                            const noteSnapshot = await get(noteRef);
                            if (!noteSnapshot.exists()) {
                                   console.error(`Note ${noteId} does not exist, cannot update writing status.`);
                                   return;
                            }

                            const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);
                            await update(userNoteRef, { isWriting: isWriting });
                            console.log(`Writing status updated successfully for user ${userId} on note ${noteId}`);

                            // Update the local state to reflect the writing status change
                            const noteIndex = this.allNotes.findIndex(note => note.id === noteId);
                            if (noteIndex !== -1) {
                                   this.allNotes[noteIndex].users[userId].isWriting = isWriting;

                                   // Ensure the changes reflect in the respective state arrays
                                   this.updateStateWithNote(this.allNotes[noteIndex], userId);
                            }
                     } catch (error) {
                            console.error('Error updating writing status:', error);
                     }
              },
              listenForInvitationStatusChanges() {
                     console.log('Listening for invitation status changes');
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user) {
                            console.error('User not logged in');
                            return;
                     }

                     const db = getDatabase();
                     const userNotesRef = ref(db, `userNotes/${user.uid}`);

                     onValue(userNotesRef, (snapshot) => {
                            if (snapshot.exists()) {
                                   const noteIds = snapshot.val();

                                   noteIds.forEach((noteId: string) => {
                                          const noteRef = ref(db, `notes/${noteId}`);
                                          onValue(noteRef, (noteSnapshot) => {
                                                 if (noteSnapshot.exists()) {
                                                        const note = noteSnapshot.val();
                                                        const ownerId = note.owner;

                                                        if (ownerId === user.uid) {
                                                               this.checkForInvitationStatusChanges(note);
                                                        }
                                                 }
                                          });
                                   });
                            }
                     });
              },

              async checkForInvitationStatusChanges(note: SharedNoteType) {
                     for (const [userId, userNoteData] of Object.entries(note.users)) {
                            if (userNoteData.inviteStatus === 'accepted' && !userNoteData.notificationSent) {
                                   await this.notifyInvitationStatus(note.title, userNoteData.username, 'accepted', note.id, userId);
                            } else if (userNoteData.inviteStatus === 'refused' && !userNoteData.notificationSent) {
                                   await this.notifyInvitationStatus(note.title, userNoteData.username, 'refused', note.id, userId);
                            }
                     }
              },

              async notifyInvitationStatus(noteTitle: string, username: string, status: 'accepted' | 'refused', noteId: string, userId: string) {
                     if (status === 'accepted') {
                            notification.success({
                                   message: 'Invitation Accepted',
                                   description: `${username} accepted your invitation to collaborate on "${noteTitle}".`,
                            });
                     } else if (status === 'refused') {
                            notification.error({
                                   message: 'Invitation Refused',
                                   description: `${username} refused your invitation to collaborate on "${noteTitle}".`,
                            });
                     }

                     // Mark the notification as sent in the database
                     const db = getDatabase();
                     const userNoteRef = ref(db, `notes/${noteId}/users/${userId}`);
                     await update(userNoteRef, { notificationSent: true });
              },
       },
});

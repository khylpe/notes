import { defineStore } from 'pinia';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, addDoc, deleteDoc, Timestamp, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { NoteType } from '@/types/Note';
import { isEqual } from 'lodash';

export const useNotesStore = defineStore('notes', {
       state: () => ({
              notes: [] as NoteType[],
       }),
       actions: {
              async fetchAndStoreNotes() {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     const userRef = doc(db, `users/${user.uid}`);
                     const userDoc = await getDoc(userRef);

                     if (!userDoc.exists()) {
                            await setDoc(userRef, { username: user.displayName || 'Anonymous', id: user.uid });
                     }

                     const notesCollectionRef = collection(db, `users/${user.uid}/notes`);
                     let querySnapshot = await getDocs(notesCollectionRef);

                     this.notes = querySnapshot.docs.map(doc => {
                            const noteData = doc.data() as Partial<NoteType>;
                            noteData.isPinned = noteData.isPinned ?? false;
                            if (noteData.createdDate && noteData.createdDate instanceof Timestamp) {
                                   return { id: doc.id, ...noteData, createdDate: noteData.createdDate.toDate() } as NoteType;
                            }
                            return { id: doc.id, ...noteData } as NoteType;
                     });
              },
              async moveToDeletedFolder(noteId: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);
                     const noteDoc = await getDoc(noteRef);

                     if (noteDoc.exists()) {
                            // Update the note's folderId to 'Deleted'
                            const updatedNote = { ...noteDoc.data(), folderId: 'deleted' } as NoteType;
                            await setDoc(noteRef, updatedNote);

                            // Update the note in the local store
                            const noteIndex = this.notes.findIndex(n => n.id === noteId);
                            if (noteIndex !== -1) {
                                   this.notes[noteIndex] = updatedNote;
                            }
                     } else {
                            console.error("Note not found:", noteId);
                     }
              },
              async moveToArchiveFolder(noteId: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);
                     const noteDoc = await getDoc(noteRef);

                     if (noteDoc.exists()) {
                            // Update the note's folderId to 'archive'
                            const updatedNote = { ...noteDoc.data(), folderId: 'archive' } as NoteType;
                            await setDoc(noteRef, updatedNote);

                            // Update the note in the local store
                            const noteIndex = this.notes.findIndex(n => n.id === noteId);
                            if (noteIndex !== -1) {
                                   this.notes[noteIndex] = updatedNote;
                            }
                     } else {
                            console.error("Note not found:", noteId);
                     }
              },
              async moveToMyNotes(noteId: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);
                     const noteDoc = await getDoc(noteRef);

                     if (noteDoc.exists()) {
                            // Update the note's folderId to 'archive'
                            const updatedNote = { ...noteDoc.data(), folderId: null } as NoteType;
                            await setDoc(noteRef, updatedNote);

                            // Update the note in the local store
                            const noteIndex = this.notes.findIndex(n => n.id === noteId);
                            if (noteIndex !== -1) {
                                   this.notes[noteIndex] = updatedNote;
                            }
                     } else {
                            console.error("Note not found:", noteId);
                     }
              },
              async updateStoreAndFirestore(note: NoteType) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return; // No user logged in

                     // Default isPinned to false if undefined
                     if (note.isPinned === undefined) {
                            note.isPinned = false;
                     }

                     // Find and update the note in the store if it's different
                     const noteIndex = this.notes.findIndex(n => n.id === note.id);
                     if (noteIndex !== -1 && !isEqual(this.notes[noteIndex], note)) {
                            this.notes[noteIndex] = note;

                            // Update Firestore
                            const db = getFirestore();
                            const noteRef = doc(db, `users/${user.uid}/notes/${note.id}`);
                            await setDoc(noteRef, note);
                     }
              },
              async addNoteToFirestore(newNote: Omit<NoteType, 'id'>) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     const notesCollectionRef = collection(db, `users/${user.uid}/notes`);

                     const fullNewNote: NoteType = { ...newNote, id: '', folderId: null, isPinned: false }; // Setting folderId to null by default
                     const docRef = await addDoc(notesCollectionRef, fullNewNote);

                     fullNewNote.id = docRef.id; // Assigning the generated id
                     await setDoc(docRef, fullNewNote);
                     this.notes.push(fullNewNote);
              },
              async deleteNote(noteId: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);

                     try {
                            await deleteDoc(noteRef);
                            this.notes = this.notes.filter(note => note.id !== noteId);
                     } catch (error) {
                            console.error('Error deleting note:', error);
                     }
              },
              async fetchFilteredNotes(titleOrContentValue: string | null, tagId: string | null, folderIds: (string | null)[], dateRange: [Date, Date] | null) {
                     // Fetch all notes if they haven't been fetched already
                     if (this.notes.length === 0) {
                            await this.fetchAndStoreNotes();
                     }

                     return this.notes.filter(note => {
                            // Check if note matches the tag criteria
                            const matchesTag = tagId ? note.tagId === tagId : true;

                            // Check if note matches the folder criteria
                            const matchesFolder = folderIds.length === 0 ? true :
                                   folderIds.includes(null) && note.folderId === null || folderIds.includes(note.folderId);

                            // Check if note matches the title or content criteria
                            const matchesTitleOrContent = !titleOrContentValue ? true :
                                   note.title.toLowerCase().includes(titleOrContentValue.toLowerCase()) ||
                                   note.content.toLowerCase().includes(titleOrContentValue.toLowerCase());


                            // Date range filter
                            let matchesDateRange = true;
                            if (dateRange) {
                                   const [startDate, endDate] = dateRange;
                                   const noteDate = new Date(note.createdDate); // Convert to Date object

                                   // Adjust for same day range
                                   if (startDate.toDateString() === endDate.toDateString()) {
                                          matchesDateRange = noteDate.toDateString() === startDate.toDateString();
                                   } else {
                                          matchesDateRange = noteDate >= startDate && noteDate <= endDate;
                                   }
                            }

                            return matchesTag && matchesFolder && matchesTitleOrContent && matchesDateRange;
                     });
              },
              async getNoteById(noteId: string) {
                     // Fetch all notes if they haven't been fetched already or if the note isn't in the store
                     if (this.notes.length === 0 || !this.notes.find(note => note.id === noteId)) {
                            await this.fetchAndStoreNotes();
                     }
                     return this.notes.find(note => note.id === noteId);
              },
              async pinNote(noteId: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return; // No user logged in

                     // Find the note in the store
                     const noteIndex = this.notes.findIndex(n => n.id === noteId);
                     if (noteIndex !== -1) {
                            // Update the isPinned property locally
                            this.notes[noteIndex].isPinned = true;

                            // Update Firestore
                            const db = getFirestore();
                            const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);
                            await setDoc(noteRef, { ...this.notes[noteIndex] });
                     } else {
                            console.error("Note not found:", noteId);
                     }
              },
              async unpinNote(noteId: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return; // No user logged in

                     // Find the note in the store
                     const noteIndex = this.notes.findIndex(n => n.id === noteId);
                     if (noteIndex !== -1) {
                            // Update the isPinned property locally
                            this.notes[noteIndex].isPinned = false;

                            // Update Firestore
                            const db = getFirestore();
                            const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);
                            await setDoc(noteRef, { ...this.notes[noteIndex] });
                     } else {
                            console.error("Note not found:", noteId);
                     }
              },
              async countPinnedNotes() {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return 0; // Return 0 if no user is logged in

                     const db = getFirestore();
                     const notesCollectionRef = collection(db, `users/${user.uid}/notes`);
                     const pinnedNotesQuery = query(notesCollectionRef, where('isPinned', '==', true));

                     try {
                            const querySnapshot = await getDocs(pinnedNotesQuery);
                            return querySnapshot.docs.length; // This is the count of pinned notes
                     } catch (error) {
                            console.error("Error fetching pinned notes:", error);
                            return 0; // Return 0 in case of error
                     }
              },
       },
},
);

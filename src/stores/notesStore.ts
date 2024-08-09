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
                     const querySnapshot = await getDocs(notesCollectionRef);

                     this.notes = querySnapshot.docs.map(doc => {
                            const noteData = doc.data() as Partial<NoteType>;
                            noteData.isPinned = noteData.isPinned ?? false;
                            noteData.isDeleted = noteData.isDeleted ?? false;
                            noteData.isArchived = noteData.isArchived ?? false;

                            if (noteData.createdDate && noteData.createdDate instanceof Timestamp) {
                                   noteData.createdDate = noteData.createdDate.toDate();
                            }
                            if (noteData.updatedDate && noteData.updatedDate instanceof Timestamp) {
                                   noteData.updatedDate = noteData.updatedDate.toDate();
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
                            const updatedNote = {
                                   ...noteDoc.data(),
                                   isDeleted: true,
                                   isArchived: false,  // Ensure it's not archived
                                   folderId: null,
                                   updatedDate: new Date()  // Update the updatedDate
                            } as NoteType;
                            await setDoc(noteRef, updatedNote);

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
                            const updatedNote = {
                                   ...noteDoc.data(),
                                   isArchived: true,
                                   isDeleted: false,  // Ensure it's not deleted
                                   folderId: null,
                                   updatedDate: new Date()  // Update the updatedDate
                            } as NoteType;
                            await setDoc(noteRef, updatedNote);

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
                            const updatedNote = {
                                   ...noteDoc.data(),
                                   isDeleted: false,
                                   isArchived: false,
                                   folderId: null,
                                   updatedDate: new Date()  // Update the updatedDate
                            } as NoteType;
                            await setDoc(noteRef, updatedNote);

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
                     if (!user) return;

                     note.updatedDate = new Date();  // Update the updatedDate before saving

                     if (note.isPinned === undefined) {
                            note.isPinned = false;
                     }
                     if (note.isDeleted === undefined) {
                            note.isDeleted = false;
                     }
                     if (note.isArchived === undefined) {
                            note.isArchived = false;
                     }

                     // Ensure a note cannot be both archived and deleted
                     if (note.isDeleted) {
                            note.isArchived = false;
                     } else if (note.isArchived) {
                            note.isDeleted = false;
                     }

                     const noteIndex = this.notes.findIndex(n => n.id === note.id);
                     if (noteIndex !== -1 && !isEqual(this.notes[noteIndex], note)) {
                            this.notes[noteIndex] = note;

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

                     const fullNewNote: NoteType = {
                            ...newNote,
                            id: '',
                            folderId: null,
                            isPinned: false,
                            isDeleted: false,
                            isArchived: false,
                            createdDate: new Date(),
                            updatedDate: new Date()  // Initialize with the current date
                     };
                     const docRef = await addDoc(notesCollectionRef, fullNewNote);

                     fullNewNote.id = docRef.id;
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
              async fetchFilteredNotes(
                     titleOrContentValue: string | null,
                     tagIds: (string | null)[],
                     folderIds: (string | null)[],
                     dateRange: [Date, Date] | null
              ) {
                     console.log(tagIds);
                     console.log(folderIds);

                     // Ensure notes are loaded
                     if (this.notes.length === 0) {
                            await this.fetchAndStoreNotes();
                     }

                     // Filter notes based on the provided criteria
                     return this.notes.filter(note => {
                            // Filter by title or content
                            const matchesTitleOrContent = titleOrContentValue
                                   ? note.title.toLowerCase().includes(titleOrContentValue.toLowerCase()) ||
                                   note.content.toLowerCase().includes(titleOrContentValue.toLowerCase())
                                   : true;

                            // Filter by tags
                            const matchesTags = tagIds.length > 0
                                   ? tagIds.some(tagId => note.tagIds?.includes(tagId ?? ''))
                                   : true;

                            // Filter by folders
                            const matchesFolders = folderIds.length > 0
                                   ? folderIds.includes(note.folderId)
                                   : true;

                            // Filter by date range
                            let matchesDateRange = true;
                            if (dateRange) {
                                   const [startDate, endDate] = dateRange;
                                   const noteDate = new Date(note.createdDate);

                                   matchesDateRange = noteDate >= startDate && noteDate <= endDate;
                            }

                            return matchesTitleOrContent && matchesTags && matchesFolders && matchesDateRange;
                     });
              },

              async getNoteById(noteId: string) {
                     if (this.notes.length === 0 || !this.notes.find(note => note.id === noteId)) {
                            await this.fetchAndStoreNotes();
                     }
                     return this.notes.find(note => note.id === noteId);
              },
              async pinNote(noteId: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const noteIndex = this.notes.findIndex(n => n.id === noteId);
                     if (noteIndex !== -1) {
                            this.notes[noteIndex].isPinned = true;
                            this.notes[noteIndex].updatedDate = new Date(); // Update the updatedDate

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
                     if (!user) return;

                     const noteIndex = this.notes.findIndex(n => n.id === noteId);
                     if (noteIndex !== -1) {
                            this.notes[noteIndex].isPinned = false;
                            this.notes[noteIndex].updatedDate = new Date(); // Update the updatedDate

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
                     if (!user) return 0;

                     const db = getFirestore();
                     const notesCollectionRef = collection(db, `users/${user.uid}/notes`);
                     const pinnedNotesQuery = query(notesCollectionRef, where('isPinned', '==', true));

                     try {
                            const querySnapshot = await getDocs(pinnedNotesQuery);
                            return querySnapshot.docs.length;
                     } catch (error) {
                            console.error("Error fetching pinned notes:", error);
                            return 0;
                     }
              },
       },
});

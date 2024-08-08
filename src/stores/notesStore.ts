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
                                   folderId: 'deleted',
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
                                   folderId: 'archived',
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
              async fetchFilteredNotes(titleOrContentValue: string | null, tagId: string | null, folderIds: (string | null)[], dateRange: [Date, Date] | null) {
                     if (this.notes.length === 0) {
                            await this.fetchAndStoreNotes();
                     }

                     return this.notes.filter(note => {
                            const matchesTag = tagId ? note.tagId === tagId : true;
                            const matchesFolder = folderIds.length === 0 ? true :
                                   (folderIds.includes(null) && note.folderId === null) || folderIds.includes(note.folderId);
                            const matchesTitleOrContent = !titleOrContentValue ? true :
                                   note.title.toLowerCase().includes(titleOrContentValue.toLowerCase()) ||
                                   note.content.toLowerCase().includes(titleOrContentValue.toLowerCase());

                            let matchesDateRange = true;
                            if (dateRange) {
                                   const [startDate, endDate] = dateRange;
                                   const noteDate = new Date(note.createdDate);

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

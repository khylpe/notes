import { defineStore } from 'pinia';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { NoteType } from '@/types/Note';
import { Timestamp } from 'firebase/firestore';
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

                     const fullNewNote: NoteType = { ...newNote, id: '', folderId: null }; // Setting folderId to null by default
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
       },
},
);

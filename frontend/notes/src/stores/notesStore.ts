import { defineStore } from 'pinia';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, addDoc } from 'firebase/firestore';
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

                     if (!user) return; // No user logged in

                     const db = getFirestore();
                     const userRef = doc(db, `users/${user.uid}`);
                     const userDoc = await getDoc(userRef);

                     if (!userDoc.exists()) {
                            await setDoc(userRef, { username: user.displayName || 'Anonymous', id: user.uid });
                     }

                     const defaultTagDocRef = doc(db, `users/${user.uid}/tags/${user.uid}`);
                     const defaultTagDoc = await getDoc(defaultTagDocRef);

                     if (!defaultTagDoc.exists()) {
                            // Create a default tag if the specific default tag is not found
                            await this.createDefaultTag(user.uid);
                     }

                     const notesCollectionRef = collection(db, `users/${user.uid}/notes`);
                     let querySnapshot = await getDocs(notesCollectionRef);

                     this.notes = querySnapshot.docs.map(doc => {
                            const noteData = doc.data() as Partial<NoteType>;

                            // Check if `createdDate` is a Firestore Timestamp and convert it to a JavaScript Date
                            if (noteData.createdDate && noteData.createdDate instanceof Timestamp) {
                                   return { id: doc.id, ...noteData, createdDate: noteData.createdDate.toDate() } as NoteType;
                            }
                            return { id: doc.id, ...noteData } as NoteType;
                     });
              },
              async createDefaultTag(userId: string) {
                     const db = getFirestore();
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (!user || !user.displayName) return; // Ensure the user and username are available

                     const tagId = userId; // Use userId as the document ID
                     const tagRef = doc(db, `users/${userId}/tags/${tagId}`); // Document path with userId as the ID

                     const defaultTagName = `${user.displayName}'s notes`; // Format the tag name with the user's display name

                     const defaultTag = {
                            id: tagId, // Include the tagId in the document data
                            name: defaultTagName, // Use the formatted tag name
                            color: '#000000', // Default color
                            createdDate: new Date(),
                            numberOfNotes: 0,
                     };
                     await setDoc(tagRef, defaultTag);
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

                     // Add the note to Firestore, which returns a reference to the new document
                     const docRef = await addDoc(notesCollectionRef, newNote);

                     // Update the new document with its generated id and add it to the store
                     const fullNote: NoteType = { ...newNote, id: docRef.id };
                     await setDoc(docRef, fullNote);
                     this.notes.push(fullNote);
              },
       },
},
);

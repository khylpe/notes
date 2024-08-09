import { defineStore } from 'pinia';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import type { FolderType } from '@/types/Folder';

export const useFoldersStore = defineStore('folders', {
       state: () => ({
              folders: [] as FolderType[],
       }),
       actions: {
              async fetchFolders() {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     try {
                            const foldersCollectionRef = collection(db, `users/${user.uid}/folders`);
                            const querySnapshot = await getDocs(foldersCollectionRef);
                            this.folders = querySnapshot.docs.map(doc => ({
                                   id: doc.id,
                                   name: doc.data().name,
                                   color: doc.data().color,
                                   createdDate: doc.data().createdDate,
                                   updatedDate: doc.data().updatedDate,
                                   numberOfNotes: doc.data().numberOfNotes,
                            }));
                     } catch (error) {
                            console.error('Error fetching folders:', error);
                     }
              },
              async addFolder(newFolder: FolderType) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     try {
                            const folderRef = doc(db, `users/${user.uid}/folders/${newFolder.id}`);
                            await setDoc(folderRef, newFolder);
                            this.folders.push(newFolder);
                     } catch (error) {
                            console.error('Error adding folder:', error);
                     }
              },
              async updateFolder(updatedFolder: FolderType) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     try {
                            const folderRef = doc(db, `users/${user.uid}/folders/${updatedFolder.id}`);
                            await setDoc(folderRef, updatedFolder);
                            const index = this.folders.findIndex(folder => folder.id === updatedFolder.id);
                            if (index !== -1) {
                                   this.folders[index] = updatedFolder;
                            }
                     } catch (error) {
                            console.error('Error updating folder:', error);
                     }
              },
              async deleteFolder(folderId: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     try {
                            const notesCollectionRef = collection(db, `users/${user.uid}/notes`);
                            const notesQuery = query(notesCollectionRef, where('folderId', '==', folderId));
                            const notesSnapshot = await getDocs(notesQuery);

                            // Initialize a batch operation
                            const batch = writeBatch(db);

                            // Update all notes in the folder to have folderId set to null
                            notesSnapshot.forEach(noteDoc => {
                                   const noteRef = noteDoc.ref;
                                   batch.update(noteRef, { folderId: null });
                            });
                            await batch.commit();

                            // Delete the folder
                            await deleteDoc(doc(db, `users/${user.uid}/folders/${folderId}`));
                            this.folders = this.folders.filter(folder => folder.id !== folderId);
                     } catch (error) {
                            console.error('Error deleting folder:', error);
                     }
              },
       },
});

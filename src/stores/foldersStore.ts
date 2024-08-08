// foldersStore.ts
import { defineStore } from 'pinia';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
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
                            await setDoc(doc(db, `users/${user.uid}/folders/${newFolder.name}`), newFolder);
                            console.log('newFolder:', newFolder);
                            this.folders.push(newFolder);
                     } catch (error) {
                            console.error('Error adding folder:', error);
                     }
              },
              async deleteFolder(folderName: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     try {
                            await deleteDoc(doc(db, `users/${user.uid}/folders/${folderName}`));
                            this.folders = this.folders.filter(folder => folder.name !== folderName);
                     } catch (error) {
                            console.error('Error deleting folder:', error);
                     }
              },
       },
});

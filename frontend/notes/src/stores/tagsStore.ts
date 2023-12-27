// tagsStore.ts
import { defineStore } from 'pinia';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import type { TagType } from '@/types/Tag';

export const useTagsStore = defineStore('tags', {
       state: () => ({
              tags: [] as TagType[],
       }),
       actions: {
              async fetchTags() {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     try {
                            const tagsCollectionRef = collection(db, `users/${user.uid}/tags`);
                            const querySnapshot = await getDocs(tagsCollectionRef);
                            this.tags = querySnapshot.docs.map(doc => ({
                                   ...doc.data(),
                                   id: doc.id,
                            } as TagType));
                     } catch (error) {
                            console.error('Error fetching tags:', error);
                     }
              },
              async addTag(newTag: TagType) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     try {
                            await setDoc(doc(db, `users/${user.uid}/tags/${newTag.id}`), newTag);
                            this.tags.push(newTag);
                     } catch (error) {
                            console.error('Error adding tag:', error);
                     }
              },
              async deleteTag(tagId: string) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     try {
                            await deleteDoc(doc(db, `users/${user.uid}/tags/${tagId}`));
                            this.tags = this.tags.filter(tag => tag.id !== tagId);
                     } catch (error) {
                            console.error('Error deleting tag:', error);
                     }
              },
       },
});

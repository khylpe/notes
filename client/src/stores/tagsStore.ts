import { defineStore } from 'pinia';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
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
                            // Fetch all notes containing the tagId
                            const notesCollectionRef = collection(db, `users/${user.uid}/notes`);
                            const notesSnapshot = await getDocs(notesCollectionRef);
                            const batch = writeBatch(db);

                            notesSnapshot.docs.forEach(noteDoc => {
                                   const noteData = noteDoc.data();
                                   if (noteData.tagIds && noteData.tagIds.includes(tagId)) {
                                          // Remove the tagId from the tagIds array
                                          const updatedtagIds = noteData.tagIds.filter((id: string) => id !== tagId);
                                          const noteRef = noteDoc.ref;
                                          batch.update(noteRef, { tagIds: updatedtagIds });
                                   }
                            });

                            // Commit the batch operation
                            await batch.commit();

                            // Delete the tag
                            await deleteDoc(doc(db, `users/${user.uid}/tags/${tagId}`));
                            this.tags = this.tags.filter(tag => tag.id !== tagId);
                     } catch (error) {
                            console.error('Error deleting tag:', error);
                     }
              },
              async updateTag(updatedTag: TagType) {
                     const auth = getAuth();
                     const user = auth.currentUser;
                     if (!user) return;

                     const db = getFirestore();
                     try {
                            const tagDocRef = doc(db, `users/${user.uid}/tags/${updatedTag.id}`);
                            await setDoc(tagDocRef, updatedTag, { merge: true });
                            const index = this.tags.findIndex(tag => tag.id === updatedTag.id);
                            if (index !== -1) {
                                   this.tags[index] = updatedTag;
                            }
                     } catch (error) {
                            console.error('Error updating tag:', error);
                     }
              },
       },
});

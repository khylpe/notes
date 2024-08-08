// tagsStore.ts
import { defineStore } from 'pinia';
import { onAuthStateChanged } from 'firebase/auth';
import type { UserType } from '@/types/User';
import auth from '@/services/FirebaseConfig';

export const useUserInformationStore = defineStore('userInformation', {
       state: () => ({
              userInformation: null as UserType | null,
       }),
       actions: {
              // Initialize the observer for auth state changes
              initAuthObserver() {
                     onAuthStateChanged(auth, (firebaseUser) => {
                            if (firebaseUser) {
                                   const user: UserType = {
                                          id: firebaseUser.uid,
                                          email: firebaseUser.email,
                                          username: firebaseUser.displayName,
                                          profilePictureUrl: firebaseUser.photoURL,
                                          providerType: firebaseUser.providerData[0].providerId,
                                   };
                                   this.setUser(user);
                            } else {
                                   // User is signed out
                                   this.setUser(null);
                            }
                     });
              },
              setUser(user: UserType | null) {
                     this.userInformation = user;
              }
       }
});
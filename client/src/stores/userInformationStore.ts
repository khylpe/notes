import { defineStore } from 'pinia';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/services/FirebaseConfig';
import type { UserType } from '@/types/User';

export const useUserInformationStore = defineStore('userInformation', {
       state: () => ({
              userInformation: null as UserType | null,
       }),
       actions: {
              async initAuthObserver() {
                     onAuthStateChanged(auth, async (firebaseUser) => {
                            if (firebaseUser) {
                                   // Fetch username from Firestore instead of using displayName from Firebase Auth
                                   const firestore = getFirestore();
                                   const userRef = doc(firestore, 'users', firebaseUser.uid);
                                   const userDoc = await getDoc(userRef);
                                   console.log("🚀 ~ onAuthStateChanged ~ userDoc:", userDoc);

                                   // Console log to check what data is fetched
                                   console.log('Firestore data:', userDoc.data());

                                   const username = userDoc.exists() ? userDoc.data()?.username : null;

                                   const user: UserType = {
                                          id: firebaseUser.uid,
                                          email: firebaseUser.email,
                                          username: username || '', // Use username from Firestore, fallback to empty string if not found
                                          profilePictureUrl: firebaseUser.photoURL,
                                          providerType: firebaseUser.providerData[0].providerId,
                                   };
                                   this.setUser(user);

                                   console.log('Final user info set in store:', user.username);
                            } else {
                                   // User is signed out
                                   this.setUser(null);
                            }
                     });
              },
              setUser(user: UserType | null) {
                     this.userInformation = user;
              },
       },
});

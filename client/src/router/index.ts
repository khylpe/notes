import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged, reload, type User } from 'firebase/auth';
import ConnectedLayout from '@/layouts/ConnectedLayout.vue';
import NotConnectedLayout from '@/layouts/NotConnectedLayout.vue';
import Profil from './../views/ProfilView.vue';
import AllNotes from '../views/AllNotes.vue';
import LoginForm from '../views/LoginView.vue';
import VerifyEmail from './../views/VerifyEmail.vue';
import NotesByTag from './../views/NotesByTag.vue';
import NotesByFolder from './../views/NotesByFolder.vue';
import PinnedNotes from '../views/PinnedNotes.vue';
import ArchivedNotes from './../views/ArchivedNotes.vue'; // Import the ArchivedNotes component
import DeletedNotes from './../views/DeletedNotes.vue'; // Import the DeletedNotes component
import NotesInvitation from '@/views/NotesInvitation.vue';
import PrivateNotes from '@/views/PrivateNotes.vue';
import AllSharedNotes from '@/views/AllSharedNotes.vue';
import MySharedNotes from '@/views/MySharedNotes.vue';
import NotesSharedWithMe from '@/views/NotesSharedWithMe.vue';
import { useUserInformationStore } from '@/stores/userInformationStore';
let startTime;

const checkSignUpMethod = (user: User | null) => {
       if (user && user.providerData.length > 0) {
              const provider = user.providerData[0].providerId;
              // Email/Password sign-up method
              if (provider === 'password') {
                     return 'Email/Password';
              } else {
                     // Other providers like 'google.com', 'facebook.com', etc.
                     return provider;
              }
       }
       return '';
};

const router = createRouter({
       history: createWebHistory(import.meta.env.BASE_URL),
       routes: [
              {
                     path: '/',
                     redirect: () => {
                            const auth = getAuth();
                            return auth.currentUser ? '/notes' : '/login';
                     },
              },
              {
                     path: '/login',
                     component: NotConnectedLayout,
                     children: [
                            {
                                   path: '',
                                   name: 'login',
                                   component: LoginForm
                            },
                            {
                                   path: 'verify-email',
                                   name: 'verifyEmail',
                                   component: VerifyEmail
                            }
                     ]
              },
              {
                     path: '/',
                     component: ConnectedLayout,
                     meta: { requiresAuth: true },
                     children: [
                            {
                                   path: 'profil',
                                   name: 'profil',
                                   component: Profil
                            },
                            {
                                   path: 'notes',
                                   name: 'notes',
                                   component: AllNotes
                            },
                            {
                                   path: 'notes/private',
                                   name: 'private',
                                   component: PrivateNotes
                            },
                            {
                                   path: 'notes/pinned',
                                   name: 'pinned',
                                   component: PinnedNotes
                            },
                            {
                                   path: 'notes/tag/:tagName',
                                   name: 'notesByTag',
                                   component: NotesByTag,
                            },
                            {
                                   path: 'notes/folder/:folderName',
                                   name: 'notesByFolder',
                                   component: NotesByFolder,
                            },
                            {
                                   path: 'notes/archived',
                                   name: 'archivedNotes',
                                   component: ArchivedNotes
                            },
                            {
                                   path: 'notes/deleted',
                                   name: 'deletedNotes',
                                   component: DeletedNotes
                            },
                            {
                                   path: 'notes/invitations',
                                   name: 'invitations',
                                   component: NotesInvitation
                            },
                            {
                                   path: 'notes/all-shared-notes',
                                   name: 'all-shared-notes',
                                   component: AllSharedNotes
                            },
                            {
                                   path: 'notes/my-shared-notes',
                                   name: 'my-shared-notes',
                                   component: MySharedNotes
                            },
                            {
                                   path: 'notes/notes-shared-with-me',
                                   name: 'notes-shared-with-me',
                                   component: NotesSharedWithMe
                            },
                     ]
              },
              { path: '/:pathMatch(.*)*', name: 'NotFound', component: AllNotes },
       ]
});

router.beforeEach(async (to, from, next) => {
       const userInformationStore = useUserInformationStore();
       startTime = performance.now();
       console.log('beforeEach', to, from);

       try {
              const auth = getAuth();
              const user = await new Promise<User | null>((resolve, reject) => {
                     onAuthStateChanged(auth, (user) => {
                            if (user) {
                                   // Reload user to get the latest status
                                   reload(user).then(() => {
                                          userInformationStore.setUser({
                                                 id: user.uid,
                                                 username: user.displayName,
                                                 email: user.email,
                                                 profilePictureUrl: user.photoURL,
                                                 providerType: user.providerData[0]?.providerId
                                          });
                                          userInformationStore.initAuthObserver();
                                          resolve(user);
                                   }).catch(reject);
                            } else {
                                   resolve(null);
                            }
                     }, reject);
              });

              const signUpMethod = user ? checkSignUpMethod(user) : '';

              if (to.matched.some(record => record.meta.requiresAuth)) {
                     if (!user) {
                            next({ name: 'login' });
                     } else if (signUpMethod === 'Email/Password' && !user.emailVerified) {
                            next({ name: 'verifyEmail' });
                     } else {
                            next(); // Proceed if authenticated
                            console.log("Authenticated");
                            const endTime = performance.now();
                            const timeTaken = endTime - startTime;
                            console.log(`Time taken from beforeEach to Authenticated: ${timeTaken}ms`);

                     }
              } else {
                     // Redirect unauthenticated users trying to access verify-email route
                     if (to.path === '/login/verify-email' && !user) {
                            next({ name: 'login' });
                     }
                     // Redirect authenticated users trying to access login or verify-email with a provider
                     else if (user && (to.path === '/login/verify-email' && signUpMethod !== 'Email/Password' || to.name === 'login')) {
                            next({ name: 'notes' });
                     } else {
                            next(); // Proceed for other cases
                            console.log("Not Authenticated");
                     }
              }
       } catch (error) {
              console.error('Auth check failed', error);
              next(false);
       }
});

export default router;

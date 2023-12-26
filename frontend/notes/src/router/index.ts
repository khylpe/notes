import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged, reload, type User } from 'firebase/auth';
import ConnectedLayout from '@/layouts/ConnectedLayout.vue';
import NotConnectedLayout from '@/layouts/NotConnectedLayout.vue';
import Profil from './../views/Profil.vue';
import MyNotes from './../views/MyNotes.vue';
import LoginForm from './../views/Login.vue';
// import Home from './../views/Home.vue';
import VerifyEmail from './../views/VerifyEmail.vue'; // Import a view for email verification
import NotFound from './../views/NotFound.vue';

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
                                   component: MyNotes
                            }
                     ]
              },
              { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
       ]
});
router.beforeEach(async (to, from, next) => {
       try {
              const auth = getAuth();
              const user = await new Promise<User | null>((resolve, reject) => {
                     onAuthStateChanged(auth, (user) => {
                            if (user) {
                                   // Reload user to get the latest status
                                   reload(user).then(() => {
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
                     }
              }
       } catch (error) {
              console.error('Auth check failed', error);
              next(false);
       }
});


export default router;

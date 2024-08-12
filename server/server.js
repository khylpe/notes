const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
       credential: admin.credential.cert(serviceAccount),
       databaseURL: "",
});

const app = express();
const port = 0;

const allowedOrigins = ['']; // Array of allowed origins

const corsOptions = {
       origin: function (origin, callback) {
              if (!origin) {
                     // If origin is not provided (e.g., in non-browser tools), you can decide to allow or block it
                     console.log(`Request with no origin (likely from a non-browser tool)`);
                     return callback(new Error('Not allowed by CORS 1'), false);
              }

              if (allowedOrigins.indexOf(origin) !== -1) {
                     // Allow requests from allowed origins
                     callback(null, true);
              } else {
                     // Log and block unauthorized origins
                     console.log(`Unauthorized CORS request from origin: ${origin}`);
                     callback(new Error('Not allowed by CORS 2'), false);
              }
       },
       optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions)); // Apply the CORS configuration
app.use(express.json());
// Rate limiting middleware
const limiter = rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutes
       max: 500, // Limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Middleware to authenticate requests
async function authenticate(req, res, next) {
       const idToken = req.headers.authorization && req.headers.authorization.split('Bearer ')[1];

       if (!idToken) {
              return res.status(401).send('Unauthorized');
       }

       try {
              const decodedToken = await admin.auth().verifyIdToken(idToken);
              req.user = decodedToken;
              next();
       } catch (error) {
              console.error('Authentication error:', error);
              return res.status(401).send('Unauthorized');
       }
}

app.post('/create-note', authenticate, async (req, res) => {
       console.log('Received request to /create-note with data:', req.body);
       const { noteDetails, invitedEmails } = req.body;

       if (!noteDetails || !invitedEmails) {
              console.error('Invalid input data:', req.body);
              return res.status(400).send('Invalid input');
       }

       try {
              const db = admin.database();
              const notesRef = db.ref('notes');
              const newNoteRef = notesRef.push();

              // Fetch owner information
              const ownerRecord = await admin.auth().getUser(noteDetails.owner);
              const ownerUsername = await getUsernameFromFirestore(ownerRecord.uid);
              let ownerEmail = ownerRecord.email || '';

              if (!ownerEmail) {
                     const githubProvider = ownerRecord.providerData.find(provider => provider.providerId === 'github.com');
                     if (githubProvider) {
                            ownerEmail = githubProvider.email || '';
                     }
              }

              const ownerInfo = {
                     username: ownerUsername || ownerRecord.displayName || '',
                     email: ownerEmail,
                     uuid: ownerRecord.uid,
                     imageUrl: ownerRecord.photoURL || '',
              };

              // Initialize the users object with the owner, including all necessary fields
              const usersWithMetadata = {
                     [noteDetails.owner]: {
                            email: ownerInfo.email,
                            inviteDate: Date.now(),
                            inviteAcceptedDate: null,
                            inviteStatus: 'accepted',
                            isArchived: false,
                            isDeleted: false,
                            isPinned: false,
                            isWatching: false,
                            isWriting: false,
                            rule: 'write',
                            username: ownerInfo.username,
                            tags: noteDetails.users[noteDetails.owner].tags || [],
                            folderId: noteDetails.users[noteDetails.owner].folderId || null,
                            uuid: ownerInfo.uuid,
                            imageUrl: ownerInfo.imageUrl,
                            notificationSent: true,
                     },
              };

              // Initialize the notFoundUsers array
              const notFoundUsers = [];

              // Process invited emails and add to users object with specified rules
              for (const { email, rule } of invitedEmails) {
                     const userRecord = await getUserRecordByEmail(email);
                     if (userRecord) {
                            const username = await getUsernameFromFirestore(userRecord.uid);
                            const providerInfo = userRecord.providerData.find(provider => provider.email === email);

                            const userInfo = {
                                   username: username || (providerInfo && providerInfo.displayName) || userRecord.displayName || '',
                                   email: providerInfo ? providerInfo.email : userRecord.email || '',
                                   uuid: userRecord.uid,
                                   rule: rule, // Use the specified rule (read/write)
                                   tags: [],
                                   folderId: null,
                                   isArchived: false,
                                   isDeleted: false,
                                   isPinned: false,
                                   inviteStatus: 'pending',
                                   inviteDate: Date.now(),
                                   isWatching: false,
                                   isWriting: false,
                                   imageUrl: userRecord.photoURL || '',
                                   notificationSent: false,
                            };

                            if (userInfo.username && userInfo.email && userInfo.uuid) {
                                   usersWithMetadata[userRecord.uid] = userInfo;
                            } else {
                                   console.warn(`Incomplete user info for email: ${email}, skipping.`);
                            }
                     } else {
                            console.warn(`User record not found for email: ${email}`);
                            notFoundUsers.push({ email, inviteDate: Date.now(), rule });
                     }
              }

              const noteToSave = {
                     ...noteDetails,
                     id: newNoteRef.key,
                     users: usersWithMetadata,
                     createdDate: Date.now(),
                     updatedDate: Date.now(),
                     notFoundUsers, // Add the notFoundUsers array to the note details
              };

              await newNoteRef.set(noteToSave);

              // Update the owner's note list in /userNotes/uuid
              const userNotesRef = db.ref(`userNotes/${noteDetails.owner}`);
              await userNotesRef.transaction(currentNotes => {
                     if (currentNotes) {
                            return [...currentNotes, newNoteRef.key];
                     } else {
                            return [newNoteRef.key];
                     }
              });

              console.log(`Note created with ID: ${newNoteRef.key}`);

              // Process and send invitations
              for (const { email } of invitedEmails) {
                     const userRecord = await getUserRecordByEmail(email);
                     if (userRecord) {
                            await createInvitation(userRecord.uid, noteToSave, ownerInfo);
                            console.log(`Invitation created for user ${userRecord.uid}`);
                     } else {
                            console.warn(`User record not found for email: ${email}`);
                     }
              }

              res.status(200).send('Note created and invitations sent successfully');
       } catch (error) {
              console.error('Error creating note and invitations:', error);
              res.status(500).send('Internal server error');
       }
});


app.post('/accept-invitation', authenticate, async (req, res) => {
       const { noteId } = req.body;
       const userId = req.user.uid;

       if (!noteId) {
              console.error('Note ID is missing:', req.body);
              return res.status(400).send('Note ID is required');
       }

       try {
              const db = admin.database();

              // Reference to the user in the note's users array
              const userNoteRef = db.ref(`notes/${noteId}/users/${userId}`);
              const userSnapshot = await userNoteRef.once('value');

              if (!userSnapshot.exists()) {
                     console.error(`User ${userId} does not exist in note ${noteId}`);
                     return res.status(404).send('User not found in the note');
              }

              // Get the existing user data
              const existingUserData = userSnapshot.val();

              // Update inviteStatus to 'accepted'
              await userNoteRef.update({
                     inviteStatus: 'accepted',
                     isArchived: existingUserData.isArchived || false, // Preserve existing flags, just ensuring they're defined
                     isDeleted: existingUserData.isDeleted || false,
                     isPinned: existingUserData.isPinned || false,
                     isWatching: existingUserData.isWatching || false,
                     isWriting: existingUserData.isWriting || false,
                     inviteAcceptedDate: Date.now(),
              });
              console.log(`User ${userId} accepted the invitation for note ${noteId}`);

              // Remove the invitation
              const invitationRef = db.ref(`invitations/${userId}/${noteId}`);
              await invitationRef.remove();
              console.log(`Invitation for note ${noteId} removed for user ${userId}`);

              // Add the note ID to the user's notes list
              const userNotesRef = db.ref(`userNotes/${userId}`);
              await userNotesRef.transaction(currentNotes => {
                     if (currentNotes) {
                            if (!currentNotes.includes(noteId)) {
                                   return [...currentNotes, noteId];
                            }
                            return currentNotes;
                     } else {
                            return [noteId];
                     }
              });
              console.log(`Note ID ${noteId} added to user ${userId}'s userNotes`);

              res.status(200).send('Invitation accepted successfully');
       } catch (error) {
              console.error('Error accepting invitation:', error);
              res.status(500).send('Internal server error');
       }
});

app.post('/delete-note', authenticate, async (req, res) => {
       console.log('Received request to /delete-note with data:', req.body);
       const { noteId } = req.body;
       const userId = req.user.uid;

       if (!noteId) {
              console.error('Note ID is missing:', req.body);
              return res.status(400).send('Note ID is required');
       }

       try {
              const db = admin.database();
              const noteRef = db.ref(`notes/${noteId}`);
              const noteSnapshot = await noteRef.once('value');

              if (!noteSnapshot.exists()) {
                     console.error('Note not found:', noteId);
                     return res.status(404).send('Note not found');
              }

              const noteData = noteSnapshot.val();

              if (noteData.owner === userId) {
                     // If the requester is the owner, delete the note
                     await noteRef.remove();
                     console.log(`Note ${noteId} deleted by owner`);

                     // Remove noteId from the userNotes list of all users who were part of the note
                     const userIds = Object.keys(noteData.users);
                     for (const uid of userIds) {
                            const userNotesRef = db.ref(`userNotes/${uid}`);
                            await userNotesRef.once('value', (snapshot) => {
                                   const noteIdList = snapshot.val() || [];
                                   const updatedNoteIdList = noteIdList.filter(id => id !== noteId);
                                   userNotesRef.set(updatedNoteIdList);
                            });
                            console.log(`Note ID ${noteId} removed from user ${uid}'s noteIdList`);
                     }

                     // Remove all invitations related to this note
                     const invitationsRef = db.ref('invitations');
                     const invitationsSnapshot = await invitationsRef.once('value');
                     invitationsSnapshot.forEach((childSnapshot) => {
                            const invitationData = childSnapshot.val();
                            // If invitation data contains the noteId, remove the child
                            if (invitationData[noteId]) {
                                   childSnapshot.ref.remove();
                                   console.log(`Invitation for note ${noteId} removed for user ${childSnapshot.key}`);
                            }
                     });

                     res.status(200).send('Note and related data deleted successfully');
              } else if (noteData.users && noteData.users[userId]) {
                     // If the requester is not the owner, remove them from the note's users list
                     await noteRef.child(`users/${userId}`).remove();
                     console.log(`User ${userId} removed from note ${noteId}`);

                     // Remove noteId from user's userNotes list
                     const userNotesRef = db.ref(`userNotes/${userId}`);
                     await userNotesRef.once('value', (snapshot) => {
                            const noteIdList = snapshot.val() || [];
                            const updatedNoteIdList = noteIdList.filter(id => id !== noteId);
                            userNotesRef.set(updatedNoteIdList);
                     });
                     console.log(`Note ID ${noteId} removed from user ${userId}'s noteIdList`);

                     // Delete the user's invitation for this note
                     const userInvitationRef = db.ref(`invitations/${userId}/${noteId}`);
                     await userInvitationRef.remove();
                     console.log(`Invitation for user ${userId} removed for note ${noteId}`);

                     res.status(200).send('User removed from note successfully');
              } else {
                     console.error(`User ${userId} is not authorized to modify note ${noteId}`);
                     res.status(403).send('Forbidden');
              }
       } catch (error) {
              console.error('Error deleting note:', error);
              res.status(500).send('Internal server error');
       }
});

app.post('/refuse-invitation', authenticate, async (req, res) => {
       const { noteId } = req.body;
       const userId = req.user.uid;

       if (!noteId) {
              console.error('Note ID is missing:', req.body);
              return res.status(400).send('Note ID is required');
       }

       try {
              const db = admin.database();

              // Reference to the user in the note's users array
              const userNoteRef = db.ref(`notes/${noteId}/users/${userId}`);
              const userSnapshot = await userNoteRef.once('value');

              if (!userSnapshot.exists()) {
                     console.error(`User ${userId} does not exist in note ${noteId}`);
                     return res.status(404).send('User not found in the note');
              }

              // Update inviteStatus to 'refused'
              await userNoteRef.update({
                     inviteStatus: 'refused',
                     inviteRefusedDate: Date.now(),
              });
              console.log(`User ${userId} refused the invitation for note ${noteId}`);

              // Remove the invitation
              const invitationRef = db.ref(`invitations/${userId}/${noteId}`);
              await invitationRef.remove();
              console.log(`Invitation for note ${noteId} removed for user ${userId}`);

              res.status(200).send('Invitation refused successfully');
       } catch (error) {
              console.error('Error refusing invitation:', error);
              res.status(500).send('Internal server error');
       }
});

app.post('/resend-invite', authenticate, async (req, res) => {
       const { email, noteId } = req.body;

       if (!email || !noteId) {
              console.error('Email or note ID is missing:', req.body);
              return res.status(400).send('Email and note ID are required');
       }

       try {
              const db = admin.database();
              const noteRef = db.ref(`notes/${noteId}`);
              const noteSnapshot = await noteRef.once('value');

              if (!noteSnapshot.exists()) {
                     console.error('Note not found:', noteId);
                     return res.status(404).send('Note not found');
              }

              const noteData = noteSnapshot.val();

              // Check if the email is in the notFoundUsers array of the note
              const notFoundUser = noteData.notFoundUsers.find(user => user.email === email);
              if (!notFoundUser) {
                     console.error(`Email ${email} not found in the notFoundUsers array for note ${noteId}`);
                     return res.status(404).send('User not found for resending invite');
              }

              // Attempt to find the user in Firebase Authentication
              const userRecord = await getUserRecordByEmail(email);
              if (!userRecord) {
                     console.error(`No user found with email ${email}`);
                     return res.status(404).send('No user found with the provided email');
              }

              // Create invitation for the found user
              const ownerInfo = {
                     username: noteData.users[noteData.owner].username,
                     email: noteData.users[noteData.owner].email,
                     uuid: noteData.owner,
                     imageUrl: noteData.users[noteData.owner].imageUrl || '',
              };
              await createInvitation(userRecord.uid, noteData, ownerInfo);

              // Remove the user from the notFoundUsers array
              noteData.notFoundUsers = noteData.notFoundUsers.filter(user => user.email !== email);

              // Add the user to the note's users object
              noteData.users[userRecord.uid] = {
                     ...notFoundUser,
                     username: userRecord.displayName || userRecord.email.split('@')[0],
                     uuid: userRecord.uid,
                     inviteStatus: 'pending',
                     isArchived: false,
                     isDeleted: false,
                     isPinned: false,
                     isWatching: false,
                     isWriting: false,
                     notificationSent: false,
                     imageUrl: userRecord.photoURL || '',
              };

              // Save the updated note data back to the database
              await noteRef.set(noteData);

              console.log(`Invitation resent to ${email} for note ${noteId}`);
              res.status(200).send('Invitation resent successfully');
       } catch (error) {
              console.error('Error resending invitation:', error);
              res.status(500).send('Internal server error');
       }
});



async function getUserRecordByEmail(email) {
       try {
              console.log(`Fetching user record for email: ${email}`);

              try {
                     const userRecord = await admin.auth().getUserByEmail(email);
                     return userRecord;
              } catch (error) {
                     if (error.code === 'auth/user-not-found') {
                            console.warn(`User not found for email: ${email}`);
                     } else {
                            throw error;
                     }
              }

              const githubUserRecord = await searchUUIDInGitHubAccounts(email);
              return githubUserRecord;

       } catch (error) {
              console.error(`Error fetching user by email: ${email}`, error);
              throw error;
       }
}

async function searchUUIDInGitHubAccounts(email) {
       try {
              let nextPageToken;
              do {
                     const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
                     for (const userRecord of listUsersResult.users) {
                            const providerData = userRecord.providerData;
                            for (const provider of providerData) {
                                   if (provider.providerId === 'github.com' && provider.email === email) {
                                          console.log(`UUID found in GitHub account: ${userRecord.uid}`);
                                          return userRecord;
                                   }
                            }
                     }
                     nextPageToken = listUsersResult.pageToken;
              } while (nextPageToken);

              console.log(`UUID not found for email: ${email} in GitHub accounts.`);
              return null;
       } catch (error) {
              console.error('Error searching GitHub accounts:', error);
              return null;
       }
}

async function getUsernameFromFirestore(uid) {
       const firestore = admin.firestore();
       try {
              const userDoc = await firestore.collection('users').doc(uid).get();
              if (userDoc.exists) { // This will work correctly in Admin SDK for Firestore
                     const userData = userDoc.data();
                     console.log("🚀 ~ getUsernameFromFirestore ~ userData:", userData);
                     return userData?.username || null;
              } else {
                     console.warn(`No username found in Firestore for UID: ${uid}`);
                     return null;
              }
       } catch (error) {
              console.error(`Error fetching username from Firestore for UID: ${uid}`, error);
              return null;
       }
}


async function createInvitation(invitedUserUid, noteDetails, ownerInfo) {
       const db = admin.database();

       const invitationRef = db.ref(`/invitations/${invitedUserUid}/${noteDetails.id}`);

       const invitation = {
              noteId: noteDetails.id,
              noteTitle: noteDetails.title,
              noteDescription: noteDetails.content,
              status: 'pending',
              invitedDate: Date.now(),
              owner: ownerInfo,
       };

       try {
              await invitationRef.set(invitation);
              console.log(`Invitation created for user ${invitedUserUid} with note ID ${noteDetails.id}`);
       } catch (error) {
              console.error(`Error creating invitation for user ${invitedUserUid} with note ID ${noteDetails.id}`, error);
       }
}

app.listen(port, () => {
       console.log(`Server is running on http://localhost:${port}`);
});

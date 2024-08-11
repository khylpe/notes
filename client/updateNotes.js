const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
// Initialize the Firebase Admin SDK
admin.initializeApp({
       credential: admin.credential.cert(serviceAccount),
       databaseURL: "https://<YOUR-FIREBASE-PROJECT-ID>.firebaseio.com",
});

const db = admin.firestore();

async function updateNotesBasedOnFolderId() {
       try {
              const usersSnapshot = await db.collection('users').get();
              const userIds = usersSnapshot.docs.map(doc => doc.id);

              for (const userId of userIds) {
                     const notesCollectionRef = db.collection(`users/${userId}/notes`);
                     const notesSnapshot = await notesCollectionRef.get();

                     const batch = db.batch();
                     notesSnapshot.docs.forEach(noteDoc => {
                            const noteData = noteDoc.data();

                            let isDeleted = false;
                            let isArchived = false;

                            if (noteData.folderId === 'deleted') {
                                   isDeleted = true;
                            } else if (noteData.folderId === 'archived') {
                                   isArchived = true;
                            }

                            const updatedNote = {
                                   ...noteData,
                                   isDeleted,
                                   isArchived,
                                   folderId: null,
                            };

                            batch.set(noteDoc.ref, updatedNote, { merge: true });
                     });

                     await batch.commit();
              }

              console.log('Database update completed successfully.');
       } catch (error) {
              console.error('Error updating notes:', error);
       }
}

// Run the function
updateNotesBasedOnFolderId();

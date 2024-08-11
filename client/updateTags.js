const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
       credential: admin.credential.cert(serviceAccount),
       databaseURL: "https://<YOUR-FIREBASE-PROJECT-ID>.firebaseio.com",
});

const db = admin.firestore();

async function updateNotesWithTagIds() {
       try {
              const usersSnapshot = await db.collection('users').get();
              const userIds = usersSnapshot.docs.map(doc => doc.id);

              for (const userId of userIds) {
                     const notesCollectionRef = db.collection(`users/${userId}/notes`);
                     const notesSnapshot = await notesCollectionRef.get();

                     const batch = db.batch();
                     notesSnapshot.docs.forEach(noteDoc => {
                            const noteData = noteDoc.data();

                            // Create the new tagIds array
                            let tagIds = [];
                            if (noteData.tagId) {
                                   tagIds.push(noteData.tagId);
                            }

                            const updatedNote = {
                                   ...noteData,
                                   tagIds: tagIds, // Set the new tagIds array
                            };

                            // Remove the old tagId field
                            delete updatedNote.tagId;

                            batch.set(noteDoc.ref, updatedNote, { merge: true });
                     });

                     await batch.commit();
              }

              console.log('TagId to TagIds update completed successfully.');
       } catch (error) {
              console.error('Error updating notes with tagIds:', error);
       }
}

// Run the function
updateNotesWithTagIds();

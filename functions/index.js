const functions = require('firebase-functions');

// Access to admin functionality in firebase:
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Function to create a new activity Object:
const newActivity = (type, event, id) => {
   return {
      type: type,
      eventDate: event.date,
      hostedBy: event.hostedBy,
      title: event.title,
      photoURL: event.hostPhotoURL,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      hostUid: event.hostUid,
      eventId: id
   }
}

// Main function to create a New activity:
exports.createActivity = functions.firestore
   .document('events/{eventId}')
   .onCreate(event => {

      // Create a new Event:
      let newEvent = event.data();
      console.log(newEvent);

      // Create a new activity Object:
      const activity = newActivity('newEvent', newEvent, event.id);
      console.log(activity);

      // Add it to new activity collection: 
      return admin.firestore().collection('activity')
         .add(activity)
         .then((docRef) => {
            return console.log('Activity created with ID: ', docRef.id);
         })
         .catch((err) => {
            return console.log('Error adding activity', err);
         })
   })

// Main function to delete an activity:
exports.cancelActivity = functions.firestore
   .document('events/{eventId}')
   .onUpdate((event, context) => {
      let updatedEvent = event.after.data();
      let previousEventData = event.before.data();
      console.log({
         event
      });
      console.log({
         context
      });
      console.log({
         updatedEvent
      });
      console.log({
         previousEventData
      });

      if (!updatedEvent.cancelled || updatedEvent.cancelled === previousEventData.cancelled)
         return false;

      const activity = newActivity('cancelledEvent', updatedEvent, context.params.eventId);
      console.log({
         activity
      });

      return admin
         .firestore()
         .collection('activity')
         .add(activity)
         .then((docRef) => {
            return console.log('Activity cancelled with ID: ', docRef.id);
         })
         .catch((err) => {
            return console.log('Error cancelling activity', err);
         })
   })

// Update profile of a user went follow them:
exports.userFollowing = functions.firestore
   .document('users/{followerUid}/following/{followingUid}')
   .onCreate((event, context) => {
      console.log('v1');
      const followerUid = context.params.followerUid;
      const followingUid = context.params.followingUid;

      const followerDoc = admin
         .firestore()
         .collection('users')
         .doc(followerUid);

      console.log(followerDoc);

      return followerDoc.get().then(doc => {
         let userData = doc.data();
         console.log({
            userData
         });
         let follower = {
            displayName: userData.displayName,
            photoURL: userData.photoURL || '/assets/user.png',
            city: userData.city || 'unknown city'
         };
         return admin
            .firestore()
            .collection('users')
            .doc(followingUid)
            .collection('followers')
            .doc(followerUid)
            .set(follower);
      });
   });

// Update profile of a user went unfollow them:
exports.unfollowUser = functions.firestore
   .document('users/{followerUid}/following/{followingUid}')
   .onDelete((event, context) => {
      return admin
         .firestore()
         .collection('users')
         .doc(context.params.followingUid)
         .collection('followers')
         .doc(context.params.followerUid)
         .delete()
         .then(() => {
            return console.log('doc deleted');
         })
         .catch(err => {
            return console.log(err);
         });
   });
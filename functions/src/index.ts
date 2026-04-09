import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { 
  User, 
  CreateUserRequest, 
  CreateUserResponse,
  Trip,
  CreateTripRequest,
  CreateTripResponse,
  DeleteTripRequest,
  DeleteTripResponse,
} from '../../src/types';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * HTTP Cloud Function (v2) to create or retrieve a user
 * POST /createUser
 * Body: { username: string, email: string }
 */
export const createUser = onCall<CreateUserRequest, Promise<CreateUserResponse>>(
  { 
    region: 'europe-west1',
    cors: true, // Enable CORS for all origins
  },
  async (request): Promise<CreateUserResponse> => {
    const data = request.data;
    try {
      const { username, email } = data;

      // Validate input
      if (!username || !email) {
        return {
          success: false,
          message: 'Username and email are required',
        };
      }

      // Check if user already exists by email
      const existingUserSnapshot = await db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      const now = admin.firestore.Timestamp.now();

      // If user exists, update lastLoggedInAt and return user
      if (!existingUserSnapshot.empty) {
        const existingUserDoc = existingUserSnapshot.docs[0];
        const existingUserRef = db.collection('users').doc(existingUserDoc.id);
        
        // Update lastLoggedInAt
        await existingUserRef.update({
          lastLoggedInAt: now,
        });
        
        // Get updated user data
        const updatedUserDoc = await existingUserRef.get();
        const userData = updatedUserDoc.data() as User;
        
        return {
          success: true,
          user: userData,
          message: 'User login updated',
        };
      }

      // Create new user
      const userRef = db.collection('users').doc();
      const newUser: User = {
        id: userRef.id,
        username,
        email,
        registeredAt: now.toDate().toISOString(),
        lastLoggedInAt: now.toDate().toISOString(),
      };

      await userRef.set(newUser);

      return {
        success: true,
        user: newUser,
        message: 'User created successfully',
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
);

/**
 * HTTP Cloud Function (v2) to create a trip
 * POST /createTrip
 * Body: { name: string, startDate: string, isRoundTrip: boolean, endDate?: string }
 */
export const createTrip = onCall<CreateTripRequest, Promise<CreateTripResponse>>(
  { 
    region: 'europe-west1',
    cors: true, // Enable CORS for all origins
  },
  async (request): Promise<CreateTripResponse> => {
    const data = request.data;
    
    try {
      // Ensure user is authenticated
      if (!request.auth) {
        return {
          success: false,
          message: 'Authentication required',
        };
      }

      const { name, startDate, fromCountryId, toCountryId, isRoundTrip, endDate } = data;

      // Validate input
      if (!name || !startDate) {
        return {
          success: false,
          message: 'Trip name and start date are required',
        };
      }

      if (!fromCountryId || !toCountryId) {
        return {
          success: false,
          message: 'From and to countries are required',
        };
      }

      // Fetch country names
      const fromCountryDoc = await db.collection('countries').doc(fromCountryId).get();
      const toCountryDoc = await db.collection('countries').doc(toCountryId).get();

      if (!fromCountryDoc.exists || !toCountryDoc.exists) {
        return {
          success: false,
          message: 'Invalid country IDs',
        };
      }

      const fromCountryName = (fromCountryDoc.data() as any).name;
      const toCountryName = (toCountryDoc.data() as any).name;

      if (isRoundTrip && !endDate) {
        return {
          success: false,
          message: 'End date is required for round trips',
        };
      }

      const userId = request.auth.uid;
      const now = admin.firestore.Timestamp.now();

      // Convert ISO date strings to Timestamps with time set to 00:00:00
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);
      const startDateTimestamp = admin.firestore.Timestamp.fromDate(startDateObj);
      
      let endDateTimestamp = null;
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(0, 0, 0, 0);
        endDateTimestamp = admin.firestore.Timestamp.fromDate(endDateObj);
      }

      // Create the PARENT trip
      const parentTripRef = db.collection('trips').doc();
      const parentTripData = {
        id: parentTripRef.id,
        userId,
        tripType: 'PARENT',
        name,
        startDate: startDateTimestamp,
        fromCountryId,
        fromCountryName,
        toCountryId,
        toCountryName,
        createdAt: now,
      };

      await parentTripRef.set(parentTripData);

      // Prepare response with ISO strings
      const parentTrip: Trip = {
        id: parentTripRef.id,
        userId,
        tripType: 'PARENT',
        name,
        startDate: startDateTimestamp.toDate().toISOString(),
        fromCountryId,
        fromCountryName,
        toCountryId,
        toCountryName,
        createdAt: now.toDate().toISOString(),
      };

      let returnTrip: Trip | undefined;

      // If round trip, create the CHILD trip with reversed countries
      if (isRoundTrip && endDateTimestamp) {
        const childTripRef = db.collection('trips').doc();
        const childTripData = {
          id: childTripRef.id,
          userId,
          tripType: 'CHILD',
          startDate: endDateTimestamp,
          fromCountryId: toCountryId, // Reversed
          fromCountryName: toCountryName, // Reversed
          toCountryId: fromCountryId,  // Reversed
          toCountryName: fromCountryName,  // Reversed
          parentTripId: parentTrip.id,
          createdAt: now,
        };

        await childTripRef.set(childTripData);

        returnTrip = {
          id: childTripRef.id,
          userId,
          tripType: 'CHILD',
          startDate: endDateTimestamp.toDate().toISOString(),
          fromCountryId: toCountryId, // Reversed
          fromCountryName: toCountryName, // Reversed
          toCountryId: fromCountryId,  // Reversed
          toCountryName: fromCountryName,  // Reversed
          parentTripId: parentTrip.id,
          createdAt: now.toDate().toISOString(),
        };
      }

      return {
        success: true,
        trip: parentTrip,
        returnTrip,
        message: 'Trip created successfully',
      };
    } catch (error) {
      console.error('Error creating trip:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
);

/**
 * HTTP Cloud Function (v2) to delete a trip and its associated child trips
 * POST /deleteTrip
 * Body: { tripId: string }
 */
export const deleteTrip = onCall<DeleteTripRequest, Promise<DeleteTripResponse>>(
  { 
    region: 'europe-west1',
    cors: true, // Enable CORS for all origins
  },
  async (request): Promise<DeleteTripResponse> => {
    const data = request.data;
    
    try {
      // Ensure user is authenticated
      if (!request.auth) {
        return {
          success: false,
          message: 'Authentication required',
        };
      }

      const { tripId } = data;

      // Validate input
      if (!tripId) {
        return {
          success: false,
          message: 'Trip ID is required',
        };
      }

      const userId = request.auth.uid;

      // Get the trip document
      const tripRef = db.collection('trips').doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return {
          success: false,
          message: 'Trip not found',
        };
      }

      const tripData = tripDoc.data();

      // Verify the trip belongs to the authenticated user
      if (tripData?.userId !== userId) {
        return {
          success: false,
          message: 'Unauthorized: Trip does not belong to this user',
        };
      }

      let deletedCount = 0;

      // If this is a PARENT trip, also delete associated CHILD trips
      if (tripData.tripType === 'PARENT') {
        const childTripsQuery = await db
          .collection('trips')
          .where('parentTripId', '==', tripId)
          .get();

        // Delete all child trips
        const deletePromises = childTripsQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        deletedCount += childTripsQuery.docs.length;
      }

      // Delete the main trip
      await tripRef.delete();
      deletedCount += 1;

      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} trip(s)`,
      };
    } catch (error) {
      console.error('Error deleting trip:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
);

import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { 
  User, 
  CreateUserRequest, 
  CreateUserResponse,
  Trip,
  CreateTripRequest,
  CreateTripResponse,
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
  { region: 'europe-west1' },
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
  { region: 'europe-west1' },
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
        toCountryId,
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
        toCountryId,
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
          toCountryId: fromCountryId,  // Reversed
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
          toCountryId: fromCountryId,  // Reversed
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

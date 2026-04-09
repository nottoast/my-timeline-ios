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

      // If user exists, return existing user
      if (!existingUserSnapshot.empty) {
        const existingUser = existingUserSnapshot.docs[0];
        const userData = existingUser.data() as User;
        
        return {
          success: true,
          user: userData,
          message: 'User already exists',
        };
      }

      // Create new user
      const userRef = db.collection('users').doc();
      const newUser: User = {
        id: userRef.id,
        username,
        email,
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

      const { name, startDate, isRoundTrip, endDate } = data;

      // Validate input
      if (!name || !startDate) {
        return {
          success: false,
          message: 'Trip name and start date are required',
        };
      }

      if (isRoundTrip && !endDate) {
        return {
          success: false,
          message: 'End date is required for round trips',
        };
      }

      const userId = request.auth.uid;
      const now = new Date().toISOString();

      // Create the PARENT trip
      const parentTripRef = db.collection('trips').doc();
      const parentTrip: Trip = {
        id: parentTripRef.id,
        userId,
        tripType: 'PARENT',
        name,
        startDate,
        createdAt: now,
      };

      await parentTripRef.set(parentTrip);

      let returnTrip: Trip | undefined;

      // If round trip, create the CHILD trip
      if (isRoundTrip && endDate) {
        const childTripRef = db.collection('trips').doc();
        returnTrip = {
          id: childTripRef.id,
          userId,
          tripType: 'CHILD',
          startDate: endDate,
          parentTripId: parentTrip.id,
          createdAt: now,
        };

        await childTripRef.set(returnTrip);
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

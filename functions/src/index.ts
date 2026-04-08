import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { User, CreateUserRequest, CreateUserResponse } from '../../types';
import type { CallableContext } from 'firebase-functions/v1/https';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * HTTP Cloud Function to create or retrieve a user
 * POST /createUser
 * Body: { username: string, email: string }
 */
export const createUser = functions.https.onCall(
  async (data: CreateUserRequest, context: CallableContext): Promise<CreateUserResponse> => {
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

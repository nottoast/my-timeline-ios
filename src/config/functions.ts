import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import app from './firebase';
import { CreateUserRequest, CreateUserResponse } from '@/types';

// Initialize Firebase Functions
const functions = getFunctions(app);

/**
 * Call the createUser Firebase Function
 * @param username - The username for the new user
 * @param email - The email for the new user
 * @returns Promise with the response containing user data
 */
export const createUser = async (
  username: string,
  email: string
): Promise<CreateUserResponse> => {
  try {
    const createUserFn = httpsCallable<CreateUserRequest, CreateUserResponse>(
      functions,
      'createUser'
    );
    
    const result = await createUserFn({ username, email });
    return result.data;
  } catch (error) {
    console.error('Error calling createUser function:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
};

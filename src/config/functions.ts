import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import app from './firebase';
import { UpdateUserRequest, UpdateUserResponse, CreateTripRequest, CreateTripResponse, DeleteTripRequest, DeleteTripResponse } from '@/types';

// Initialize Firebase Functions with Europe region
const functions = getFunctions(app, 'europe-west1');

/**
 * Call the updateUser Firebase Function
 * @param username - Optional username for creating a new user
 * @param email - Optional email for creating a new user
 * @param countryOfResidenceId - Optional country of residence ID
 * @returns Promise with the response containing user data
 */
export const updateUser = async (
  username?: string,
  email?: string,
  countryOfResidenceId?: string
): Promise<UpdateUserResponse> => {
  try {
    const updateUserFn = httpsCallable<UpdateUserRequest, UpdateUserResponse>(
      functions,
      'updateUser'
    );
    
    const result = await updateUserFn({ username, email, countryOfResidenceId });
    return result.data;
  } catch (error) {
    console.error('Error calling updateUser function:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user',
    };
  }
};

/**
 * Call the createTrip Firebase Function
 * @param tripData - The trip data
 * @returns Promise with the response containing trip data
 */
export const createTrip = async (
  tripData: CreateTripRequest
): Promise<CreateTripResponse> => {
  try {
    const createTripFn = httpsCallable<CreateTripRequest, CreateTripResponse>(
      functions,
      'createTrip'
    );
    
    const result = await createTripFn(tripData);
    return result.data;
  } catch (error) {
    console.error('Error calling createTrip function:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create trip',
    };
  }
};

/**
 * Call the deleteTrip Firebase Function
 * @param tripId - The ID of the trip to delete
 * @returns Promise with the response indicating success
 */
export const deleteTrip = async (
  tripId: string
): Promise<DeleteTripResponse> => {
  try {
    const deleteTripFn = httpsCallable<DeleteTripRequest, DeleteTripResponse>(
      functions,
      'deleteTrip'
    );
    
    const result = await deleteTripFn({ tripId });
    return result.data;
  } catch (error) {
    console.error('Error calling deleteTrip function:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete trip',
    };
  }
};

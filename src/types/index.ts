/**
 * Shared types for the app and Firebase functions
 */

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
}

export interface CreateUserResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export type TripType = 'PARENT' | 'CHILD';

export interface Trip {
  id: string;
  userId: string;
  tripType: TripType;
  name?: string; // Only set on PARENT trip
  startDate: string; // ISO date string
  parentTripId?: string; // Set on CHILD trip, references the PARENT trip
  createdAt: string;
}

export interface CreateTripRequest {
  name: string;
  startDate: string; // ISO date string
  isRoundTrip: boolean;
  endDate?: string; // ISO date string, required if isRoundTrip is true
}

export interface CreateTripResponse {
  success: boolean;
  trip?: Trip;
  returnTrip?: Trip;
  message?: string;
}

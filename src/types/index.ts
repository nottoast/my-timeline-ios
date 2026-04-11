/**
 * Shared types for the app and Firebase functions
 */

export interface User {
  id: string;
  username: string;
  email: string;
  countryOfResidenceId?: string;
  enableSchengenCalculations?: boolean;
  registeredAt: string; // ISO timestamp
  lastLoggedInAt: string; // ISO timestamp
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  countryOfResidenceId?: string;
  enableSchengenCalculations?: boolean;
}

export interface UpdateUserResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export type TripType = 'PARENT' | 'CHILD';

export interface Country {
  id: string;
  name: string;
  shortName?: string;
  code: string;
  isSchengen?: boolean;
}

export type TripVisaStatus = 'ENTERED_SCHENGEN' | 'LEFT_SCHENGEN';

export interface Trip {
  id: string;
  userId: string;
  tripType: TripType;
  name?: string; // Only set on PARENT trip
  tripDate: string; // ISO date string
  fromCountryId: string;
  fromCountryName: string;
  toCountryId: string;
  toCountryName: string;
  parentTripId?: string; // Set on CHILD trip, references the PARENT trip
  tripVisaStatus?: TripVisaStatus; // Set when crossing Schengen border
  createdAt: string;
}

export interface CreateTripRequest {
  name?: string; // Optional for CHILD trips
  tripDate: string; // ISO date string
  fromCountryId: string;
  toCountryId: string;
  isRoundTrip: boolean;
  endDate?: string; // ISO date string, required if isRoundTrip is true
  tripType?: 'PARENT' | 'CHILD'; // Optional, defaults to PARENT
  parentTripId?: string; // Required if tripType is CHILD
}

export interface CreateTripResponse {
  success: boolean;
  trip?: Trip;
  returnTrip?: Trip;
  message?: string;
}

export interface DeleteTripRequest {
  tripId: string;
}

export interface DeleteTripResponse {
  success: boolean;
  message?: string;
  deletedCount?: number;
}

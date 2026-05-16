/**
 * Shared types for the app and Firebase functions
 */

export interface User {
  id: string;
  username: string;
  email: string;
  countryOfResidenceId?: string;
  enableSchengenCalculations?: 'enable' | 'disable';
  registeredAt: string; // ISO timestamp
  lastLoggedInAt: string; // ISO timestamp
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  countryOfResidenceId?: string;
  enableSchengenCalculations?: 'enable' | 'disable';
}

export interface UpdateUserResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export type TripType = 'PARENT' | 'CHILD';
export type TransportType = 'plane' | 'boat' | 'train' | 'bus' | 'car';
export type PlaceType = 'AIRPORT' | 'PLACE';

export interface Country {
  id: string;
  name: string;
  shortName?: string;
  code: string;
  isSchengen?: boolean;
  flagEmoji?: string;
}

export type TripVisaStatus = 'ENTERED_SCHENGEN' | 'LEFT_SCHENGEN';

export interface TripPlace {
  type: PlaceType;
  name: string;
  city?: string;
  address?: string;
  googlePlaceId?: string;
  googleMapsUri?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  googlePlace?: Record<string, unknown>;
  source?: 'AIRPORT_SEED' | 'GOOGLE' | 'MANUAL';
}

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
  transportType?: TransportType;
  placeFrom?: TripPlace;
  placeTo?: TripPlace;
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
  transportType?: TransportType;
  placeFrom?: TripPlace;
  placeTo?: TripPlace;
}

export interface CreateTripResponse {
  success: boolean;
  trip?: Trip;
  returnTrip?: Trip;
  message?: string;
}

export interface UpdateTripRequest {
  tripId: string;
  name?: string;
  tripDate: string;
  fromCountryId: string;
  toCountryId: string;
  transportType?: TransportType | null;
  placeFrom?: TripPlace | null;
  placeTo?: TripPlace | null;
}

export interface UpdateTripResponse {
  success: boolean;
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

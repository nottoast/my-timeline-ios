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

# Firebase Functions
# Example usage in your React components

## Calling the createUser function

```typescript
import { createUser } from '@/config/functions';

// In your component or service
const handleCreateUser = async () => {
  const response = await createUser('john_doe', 'john@example.com');
  
  if (response.success) {
    console.log('User created or retrieved:', response.user);
  } else {
    console.error('Error:', response.message);
  }
};
```

## Setting up Firebase Functions locally

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init functions
   ```
   - Select your Firebase project
   - Choose TypeScript
   - Use the existing functions directory structure

4. Install function dependencies:
   ```bash
   cd functions
   npm install
   ```

5. Build the functions:
   ```bash
   npm run build
   ```

6. Deploy functions to Firebase:
   ```bash
   npm run deploy
   ```

## Testing locally with emulators

Run the Firebase emulators:
```bash
cd functions
npm run serve
```

## Available Functions

### createUser
- **Type:** Callable HTTPS function
- **Parameters:** 
  - `username` (string): User's username
  - `email` (string): User's email
- **Returns:** `CreateUserResponse` with user data
- **Behavior:** 
  - Checks if user with email already exists
  - If exists: returns existing user
  - If not: creates new user and returns it

# Deploying Firestore Security Rules

## Updated Security Rules

The Firestore security rules have been updated to ensure proper data isolation:

### ✅ Security Changes

**Users Collection (`/users/{userId}`)**
- ✅ Users can **only read their own profile** (must match auth.uid)
- ✅ Users can **only create/update their own profile**
- ✅ Users can **only delete their own profile**
- ❌ **No access** if not authenticated

**Trips Collection (`/trips/{tripId}`)**
- ✅ Users can **only read their own trips** (where trip.userId matches auth.uid)
- ✅ Users can **only create trips for themselves**
- ✅ Users can **only update/delete their own trips**
- ❌ **No access** if not authenticated

**Countries Collection (`/countries/{countryId}`)**
- ✅ **Public read access** (reference data)
- ❌ **No write access** (admin only via Firebase Console)

## Deploy the Rules

To deploy these updated security rules to Firebase:

```bash
# Deploy only the Firestore rules
firebase deploy --only firestore:rules

# Or deploy all Firebase resources (including rules)
firebase deploy
```

## Test the Rules

After deployment, you can test the rules in the Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Click "Rules Playground" tab
3. Simulate authenticated reads/writes to verify security

## Important Notes

- **Breaking Change**: If you had shared data between users, this will now be restricted
- **Required**: Each trip MUST have a `userId` field matching the authenticated user's UID
- **Required**: Each user document ID MUST match the authenticated user's UID
- **Countries**: Still publicly readable as reference data (no authentication required)

## Verification

After deploying, verify that:
- ✅ Users cannot read other users' trips
- ✅ Users cannot read other users' profiles
- ✅ Unauthenticated users cannot access any data (except countries)
- ✅ Users can still read and write their own data

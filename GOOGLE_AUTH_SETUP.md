# Google Authentication Setup Guide

This guide will help you set up Google authentication for your My Travel Guru app.

## Prerequisites

1. Firebase project created (already done ✅)
2. Firebase Authentication enabled
3. Google Cloud Console access

## Step 1: Enable Google Sign-In in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `my-timeline-36b06`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Click **Enable**
6. Set a support email
7. Click **Save**

## Step 2: Get Your OAuth Client IDs

### Web Client ID (Auto-created by Firebase)

1. In the Google provider settings, you'll see **Web SDK configuration**
2. Copy the **Web client ID** - it looks like: `123456789-abc123.apps.googleusercontent.com`
3. Add this to your `.env` file as `GOOGLE_WEB_CLIENT_ID`

### iOS Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **iOS** as application type
6. Enter your **Bundle ID**: `com.yourcompany.myapp` (or get it from `app.json`)
7. Click **Create**
8. Copy the **Client ID** and add to `.env` as `GOOGLE_IOS_CLIENT_ID`

### Android Client ID

1. In the same **Credentials** page
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Android** as application type
4. Enter your **Package name**: gets from `app.json` (usually same as bundle ID)
5. Get your **SHA-1 certificate fingerprint**:
   ```bash
   # For debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
6. Enter the SHA-1 fingerprint
7. Click **Create**
8. Copy the **Client ID** and add to `.env` as `GOOGLE_ANDROID_CLIENT_ID`

## Step 3: Update Your .env File

Edit `/Users/mark/code/my-timeline-expo/.env` and replace the placeholder values:

```bash
GOOGLE_IOS_CLIENT_ID=your_actual_ios_client_id.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=your_actual_android_client_id.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=your_actual_web_client_id.apps.googleusercontent.com
```

## Step 4: Update app.json with Your Bundle ID

Edit `app.json` and add your bundle identifier:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.mytimeline"
    },
    "android": {
      "package": "com.yourcompany.mytimeline"
    }
  }
}
```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Run the App

### On iOS (requires Mac)

```bash
npm run ios
```

### On Android

```bash
npm run android
```

### Using Expo Go App

1. Install Expo Go on your phone from App Store or Google Play
2. Start the development server:
   ```bash
   npm start
   ```
3. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)

**Note:** Google Sign-In might not work properly in Expo Go. For full functionality, you'll need to build a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for iOS
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

## Troubleshooting

### "Google Sign-In failed"
- Verify all three Client IDs are correct in `.env`
- Make sure you've enabled Google authentication in Firebase Console
- Check that your bundle ID matches in Google Cloud Console

### "Invalid OAuth client"
- The bundle ID in your app must match the one registered in Google Cloud Console
- For development builds, use the debug keystore SHA-1
- For production, use your release keystore SHA-1

### Can't see changes after updating .env
- Restart the Expo development server
- Clear the bundler cache: `npm start -- --clear`

## Testing on Physical Device

The easiest way to test on your phone:

1. **Install Expo Go** from your phone's app store
2. **Start the server**: `npm start`
3. **Scan the QR code** shown in the terminal
4. The app will load on your phone

For Google Sign-In to work on a physical device, you'll eventually need to create a development build (see instructions above), as Expo Go has limitations with native authentication.

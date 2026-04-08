# Quick Start Guide - My Travel Guru

Your My Travel Guru app with Google authentication is ready! Follow these steps to run it on your phone.

## ✅ What's Been Set Up

- ✅ Login screen with Google authentication
- ✅ Firebase integration
- ✅ User authentication flow
- ✅ Home and Profile screens
- ✅ Tab navigation

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google OAuth (Required)

You need to get your Google OAuth Client IDs from Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **my-timeline-36b06**
3. Go to **Authentication** → **Sign-in method**
4. Enable **Google** provider
5. Click on the **Web SDK configuration** to see your Web Client ID

**For detailed instructions**, see [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md)

Edit your `.env` file and add the Client IDs:

```bash
# Replace these with your actual Client IDs from Google Cloud Console
GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

### 3. Run the App

#### Option A: Using Expo Go (Easiest for Preview)

1. Install **Expo Go** on your phone from App Store or Google Play
2. Start the development server:
   ```bash
   npm start
   ```
3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

⚠️ **Note**: Google Sign-In may not work fully in Expo Go. For full authentication, use Option B.

#### Option B: Development Build (Full Functionality)

For Google Sign-In to work properly, create a development build:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure your project
eas build:configure

# Build for your device
eas build --profile development --platform ios    # for iPhone
eas build --profile development --platform android # for Android
```

Once built, install the app on your device and it will have full Google authentication.

## 📱 App Structure

```
app/
├── _layout.tsx          # Root layout with AuthProvider
├── index.tsx            # Entry point (shows login or redirects to home)
└── (tabs)/
    ├── _layout.tsx      # Tab navigation
    ├── index.tsx        # Home screen
    └── profile.tsx      # Profile screen

src/
├── components/
│   └── LoginScreen.tsx  # Login UI component
├── contexts/
│   └── AuthContext.tsx  # Authentication logic
├── config/
│   ├── firebase.ts      # Firebase initialization
│   └── functions.ts     # Firebase Functions helpers
├── types/
│   └── index.ts         # Shared TypeScript types
├── constants/           # App constants
└── hooks/               # Custom React hooks

functions/               # Firebase Functions (backend)
assets/                  # Images, fonts, etc.
```

## 🎨 What You'll See

1. **Login Screen**
   - "Trip Timeline" title
   - "Login or Register" subtitle
   - Google sign-in button

2. **Home Screen** (after login)
   - Welcome message with user's email
   - Tab navigation

3. **Profile Screen**
   - User avatar and info
   - Sign out button

## 🔧 Development Tips

### Clear Cache
If you see stale data:
```bash
npm start -- --clear
```

### Check Real-Time Logs
```bash
# Press 'j' in terminal to open debugger
# Or use React Native Debugger
```

### Test on iOS Simulator (Mac only)
```bash
npm run ios
```

### Test on Android Emulator
```bash
npm run android
```

## 🆘 Troubleshooting

### "Cannot find module" errors
Run `npm install` to install all dependencies.

### Google Sign-In doesn't work
1. Make sure you've set up the OAuth Client IDs in `.env`
2. Verify Google authentication is enabled in Firebase Console
3. For physical devices, you need a development build (not Expo Go)

### App won't load on phone
1. Make sure your phone and computer are on the same WiFi network
2. Try restarting the development server: `npm start`
3. Clear the cache: `npm start -- --clear`

## 📚 Next Steps

- [ ] Set up Google OAuth Client IDs (see [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md))
- [ ] Install dependencies
- [ ] Run on your phone
- [ ] Start building your travel features!

## 🎯 Features Ready to Build

Now that authentication is set up, you can:
- Create trips/timelines
- Add events to timeline
- Upload photos
- Share trips with friends
- Sync data with Firebase

Happy coding! 🚀

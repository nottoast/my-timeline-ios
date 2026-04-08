# Firebase Setup Guide

This project is configured to use Firebase. Follow these steps to complete the setup:

## 1. Install Dependencies

Run the following command to install Firebase and other dependencies:

```bash
npm install
```

Note: If you encounter permission errors, try:
```bash
chmod -R +x node_modules/.bin
npm install
```

## 2. Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Register your app (iOS/Android/Web) to get configuration values
4. Enable the Firebase services you need (Authentication, Firestore, Storage, etc.)

## 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the dummy values with your actual Firebase configuration:
   - Find your config values in Firebase Console → Project Settings → General → Your apps
   - Copy each value into the corresponding environment variable

## 4. Using Firebase in Your App

Firebase is initialized in `config/firebase.ts`. Import the services you need:

```typescript
import { auth, db, storage } from '@/config/firebase';

// Use Firebase Authentication
import { signInWithEmailAndPassword } from 'firebase/auth';

// Use Firestore
import { collection, addDoc } from 'firebase/firestore';

// Use Storage
import { ref, uploadBytes } from 'firebase/storage';
```

## Security Notes

- **Never commit `.env` to version control** - it's already in `.gitignore`
- The `.env.example` file is safe to commit (it only shows the structure, not real values)
- Keep your Firebase API keys secure
- Set up Firebase Security Rules for production apps

## Available Firebase Services

The configuration includes:
- **Authentication** (`auth`) - User authentication
- **Firestore** (`db`) - NoSQL database
- **Storage** (`storage`) - File storage

Add more services as needed by importing from their respective Firebase packages.

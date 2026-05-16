import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { AuthProvider } from '@/contexts/AuthContext';
import { CountriesProvider } from '@/contexts/CountriesContext';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { en, registerTranslation } from 'react-native-paper-dates';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Register date picker localization
registerTranslation('en-GB', en);

// Custom theme with our blue color
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#007AFF',
    primaryContainer: '#007AFF',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#ffffff',
  },
};

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const horizontalPadding = 0; //width > 800 ? Math.round(width * 0.1) : 0;

  const [loaded, error] = useFonts({
    ...Ionicons.font,
    'DMSerifText-Regular': require('../assets/fonts/DMSerifText-Regular.ttf'),
  });

  // Load Ionicons font for web from CDN (client-side only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: 'Ionicons';
          src: url('https://unpkg.com/@expo/vector-icons@15.0.3/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <Head>
        <title>YourTrips</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <CountriesProvider>
            <View style={{ flex: 1, paddingHorizontal: horizontalPadding, backgroundColor: '#1a1a1a !important' }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="view-trips" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="add-trip" />
                <Stack.Screen name="trip/[id]" />
              </Stack>
            </View>
          </CountriesProvider>
        </AuthProvider>
      </PaperProvider>
    </>
  );
}

import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="view-trips" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="add-trip" />
        <Stack.Screen name="trip/[id]" />
      </Stack>
    </AuthProvider>
  );
}

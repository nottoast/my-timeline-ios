import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCountries } from '@/contexts/CountriesContext';
import CountryAutocomplete from '@/components/CountryAutocomplete';
import CustomHeader from '@/components/CustomHeader';
import TripTimeline, { TimelineItem } from '@/components/TripTimeline';
import { FONTS } from '@/constants/typography';
import { Trip } from '@/types';

type AuthMode = 'initial' | 'login' | 'register';

function buildDemoTrip(
  id: string,
  name: string,
  tripDate: Date,
  fromCountryId: string,
  fromCountryName: string,
  toCountryId: string,
  toCountryName: string,
): Trip {
  return {
    id,
    userId: 'demo',
    tripType: 'PARENT',
    name,
    tripDate: tripDate.toISOString(),
    fromCountryId,
    fromCountryName,
    toCountryId,
    toCountryName,
    createdAt: tripDate.toISOString(),
  };
}

function buildDemoChild(
  id: string,
  parentTripId: string,
  tripDate: Date,
  fromCountryId: string,
  fromCountryName: string,
  toCountryId: string,
  toCountryName: string,
): Trip {
  return {
    id,
    userId: 'demo',
    tripType: 'CHILD',
    tripDate: tripDate.toISOString(),
    fromCountryId,
    fromCountryName,
    toCountryId,
    toCountryName,
    parentTripId,
    createdAt: tripDate.toISOString(),
  };
}

function buildDemoTimelineItems(): TimelineItem[] {
  const year = new Date().getFullYear();

  // Past trip: April of last year (UK → France, round trip)
  const pastOutbound = new Date(year - 1, 3, 10); // April 10 last year
  const pastReturn = new Date(year - 1, 3, 17);   // April 17 last year

  // Mystery future trip: two years from now
  const mysteryDate = new Date(year + 2, 5, 1); // June 1 in two years

  // Future trip: September of next year (UK → Italy, round trip)
  const futureOutbound = new Date(year + 1, 8, 5);  // September 5 next year
  const futureReturn = new Date(year + 1, 8, 12);   // September 12 next year

  const mysteryParent = buildDemoTrip(
    'demo-mystery', 'Your next adventure?', mysteryDate,
    'GB', 'United Kingdom', '?', '?',
  );

  const pastParent = buildDemoTrip(
    'demo-paris', 'Paris Trip', pastOutbound,
    'GB', 'United Kingdom', 'FR', 'France',
  );
  const pastChild = buildDemoChild(
    'demo-paris-return', 'demo-paris', pastReturn,
    'FR', 'France', 'GB', 'United Kingdom',
  );

  const futureParent = buildDemoTrip(
    'demo-rome', 'Rome Adventure', futureOutbound,
    'GB', 'United Kingdom', 'IT', 'Italy',
  );
  const futureChild = buildDemoChild(
    'demo-rome-return', 'demo-rome', futureReturn,
    'IT', 'Italy', 'GB', 'United Kingdom',
  );

  return [
    { trip: mysteryParent, children: [] },
    { trip: futureParent, children: [futureChild] },
    { trip: pastParent, children: [pastChild] },
  ];
}

const DEMO_TIMELINE_ITEMS = buildDemoTimelineItems();

export default function LoginScreen() {
  const { signInWithEmail, registerWithEmail, loading } = useAuth();
  const { countries, loading: loadingCountries, getCountryFullName } = useCountries();
  const [authMode, setAuthMode] = useState<AuthMode>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [countryOfResidenceId, setCountryOfResidenceId] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsProcessing(true);
      await signInWithEmail(email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsProcessing(true);
      await registerWithEmail(email, password, countryOfResidenceId || undefined);
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'Failed to register. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setCountryOfResidenceId('');
    setAuthMode('initial');
  };

  const renderLoginForm = () => (
    <ScrollView
      contentContainerStyle={styles.formScrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.formTitle}>Welcome back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isProcessing}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isProcessing}
      />

      <TouchableOpacity
        style={[styles.primaryButton, isProcessing && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={resetForm}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRegisterForm = () => (
    <ScrollView
      contentContainerStyle={styles.formScrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.formTitle}>Create account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isProcessing}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isProcessing}
      />

      <View style={styles.countryFieldContainer}>
        <Text style={styles.countryLabel}>Country of Residence (Optional)</Text>
        <CountryAutocomplete
          countries={countries}
          value={countryOfResidenceId}
          onSelect={setCountryOfResidenceId}
          placeholder="Start typing country name..."
          disabled={loadingCountries || isProcessing}
          getCountryName={getCountryFullName}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, styles.registerButtonColor, isProcessing && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={resetForm}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (authMode === 'login' || authMode === 'register') {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="YourTrips" showProfileBadge={false} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          {authMode === 'login' ? renderLoginForm() : renderRegisterForm()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="YourTrips" showProfileBadge={false} />

      {/* Demo timeline preview */}
      <View style={styles.timelineContainer}>
        <TripTimeline
          timelineItems={DEMO_TIMELINE_ITEMS}
          scrollEnabled={false}
        />
        <View style={styles.timelineFade} pointerEvents="none" />
      </View>

      {/* Auth action area */}
      <View style={styles.authCard}>
        <Text style={styles.tagline}>Track every journey, past and future.</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.authButton, styles.loginButton]}
            onPress={() => setAuthMode('login')}
          >
            <Text style={styles.authButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authButton, styles.registerButton]}
            onPress={() => setAuthMode('register')}
          >
            <Text style={styles.authButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  timelineContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  timelineFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'transparent',
    // Simulate a fade using a semi-transparent overlay at the bottom
    borderBottomWidth: 0,
    // We use a gradient-like effect with nested views:
  },
  authCard: {
    backgroundColor: '#222222',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
  },
  tagline: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
  },
  registerButton: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  // Form styles
  formContainer: {
    flex: 1,
  },
  formScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 16,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  registerButtonColor: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  countryFieldContainer: {
    gap: 8,
  },
  countryLabel: {
    fontSize: 14,
    color: '#999',
  },
});

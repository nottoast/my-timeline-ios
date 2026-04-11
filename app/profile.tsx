import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCountries } from '@/contexts/CountriesContext';
import { useRouter } from 'expo-router';
import CustomHeader from '@/components/CustomHeader';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User as AppUser } from '@/types';
import { updateUser } from '@/config/functions';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { countries, loading: loadingCountries, getCountryFullName } = useCountries();
  const router = useRouter();
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [countryOfResidenceId, setCountryOfResidenceId] = useState('');
  const [enableSchengenCalculations, setEnableSchengenCalculations] = useState<'enable' | 'disable'>('disable');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoadingUser(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const data = userDoc.data() as AppUser;
          setUserData(data);
          setCountryOfResidenceId(data.countryOfResidenceId || '');
          setEnableSchengenCalculations(data.enableSchengenCalculations || 'disable');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('Saving profile with countryOfResidenceId:', countryOfResidenceId);
      console.log('Saving profile with enableSchengenCalculations:', enableSchengenCalculations);
      const response = await updateUser(
        undefined,
        undefined,
        countryOfResidenceId || undefined,
        enableSchengenCalculations
      );
      console.log('Update response:', response);
      
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        if (response.user) {
          setUserData(response.user);
          setCountryOfResidenceId(response.user.countryOfResidenceId || '');
          setEnableSchengenCalculations(response.user.enableSchengenCalculations || 'disable');
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Sign out initiated');
      await signOut();
      console.log('Sign out complete');
      // Force navigation back to root
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Profile" showBackButton={true} onBackPress={() => router.push('/view-trips')} />
      
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </Text>
          </View>
          
          <Text style={styles.name}>
            {user?.displayName || 'User'}
          </Text>
          
          <Text style={styles.email}>
            {user?.email || 'No email'}
          </Text>
        </View>

        {loadingUser ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <>
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Country of Residence</Text>
              <TouchableOpacity
                style={styles.countryButton}
                onPress={() => setShowCountryPicker(true)}
                disabled={loadingCountries}
              >
                <Text style={[styles.countryButtonText, !countryOfResidenceId && styles.placeholderText]}>
                  {loadingCountries ? 'Loading...' : (countryOfResidenceId ? getCountryFullName(countryOfResidenceId) : 'Not set')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldSection}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={styles.fieldLabel}>Enable Schengen Calculations</Text>
                  <Text style={styles.toggleDescription}>Automatically count Schengen days remaining</Text>
                </View>
                <Switch
                  value={enableSchengenCalculations === 'enable'}
                  onValueChange={(value) => setEnableSchengenCalculations(value ? 'enable' : 'disable')}
                  trackColor={{ false: '#3a3a3a', true: '#007AFF' }}
                  thumbColor={enableSchengenCalculations === 'enable' ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.signOutButton]}
                onPress={() => {
                  console.log('Button pressed!');
                  handleSignOut();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Sign Out</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country of Residence</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={countries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setCountryOfResidenceId(item.id);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#cccccc',
  },
  loader: {
    marginTop: 40,
  },
  fieldSection: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  countryButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  countryButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  placeholderText: {
    color: '#666',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalClose: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
  countryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  countryItemText: {
    fontSize: 16,
    color: '#ffffff',
  },
});

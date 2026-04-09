import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createTrip } from '@/config/functions';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Country } from '@/types';
import CustomHeader from '@/components/CustomHeader';

export default function AddTripScreen() {
  const router = useRouter();
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Country selection state
  const [countries, setCountries] = useState<Country[]>([]);
  const [fromCountryId, setFromCountryId] = useState('');
  const [toCountryId, setToCountryId] = useState('');
  const [showFromCountryPicker, setShowFromCountryPicker] = useState(false);
  const [showToCountryPicker, setShowToCountryPicker] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(true);

  // Fetch countries from Firestore
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        console.log('Fetching countries...');
        const countriesRef = collection(db, 'countries');
        const querySnapshot = await getDocs(countriesRef);
        
        console.log('Countries query complete. Docs found:', querySnapshot.size);
        
        const fetchedCountries: Country[] = [];
        querySnapshot.forEach((doc) => {
          console.log('Country doc:', doc.id, doc.data());
          fetchedCountries.push({
            id: doc.id,
            ...doc.data(),
          } as Country);
        });
        
        // Sort client-side instead
        fetchedCountries.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('Total countries loaded:', fetchedCountries.length);
        setCountries(fetchedCountries);
      } catch (error) {
        console.error('Error fetching countries:', error);
        Alert.alert('Error', 'Failed to load countries: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
      // If start date is now after end date, update end date to match start date
      if (isRoundTrip && selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleRoundTripToggle = (value: boolean) => {
    setIsRoundTrip(value);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const handleSave = async () => {
    console.log('handleSave called');
    console.log('Trip data:', { tripName, fromCountryId, toCountryId, isRoundTrip, startDate, endDate });
    
    if (!tripName.trim()) {
      console.log('Validation failed: No trip name');
      Alert.alert('Error', 'Please enter a trip name');
      return;
    }

    if (!fromCountryId) {
      console.log('Validation failed: No from country');
      Alert.alert('Error', 'Please select a from country');
      return;
    }

    if (!toCountryId) {
      console.log('Validation failed: No to country');
      Alert.alert('Error', 'Please select a to country');
      return;
    }

    if (isRoundTrip && endDate <= startDate) {
      console.log('Validation failed: End date before start date');
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    const tripData = {
      name: tripName,
      startDate: startDate.toISOString(),
      fromCountryId,
      toCountryId,
      isRoundTrip,
      ...(isRoundTrip && { endDate: endDate.toISOString() }),
    };

    console.log('Calling createTrip with:', tripData);
    setIsSaving(true);
    
    try {
      const response = await createTrip(tripData);
      console.log('createTrip response:', response);
      
      if (response.success && response.trip) {
        Alert.alert('Success', 'Trip created successfully!');
        router.push(`/trip/${response.trip.id}`);
      } else {
        Alert.alert('Error', response.message || 'Failed to create trip');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCountryName = (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : 'Select Country';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Add Trip" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trip Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Paris Adventure"
                placeholderTextColor="#666"
                value={tripName}
                onChangeText={setTripName}
                onFocus={() => {
                  setShowStartDatePicker(false);
                  setShowEndDatePicker(false);
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>From Country</Text>
              <TouchableOpacity
                style={styles.countryButton}
                onPress={() => setShowFromCountryPicker(true)}
                disabled={loadingCountries}
              >
                <Text style={[styles.countryButtonText, !fromCountryId && styles.placeholderText]}>
                  {loadingCountries ? 'Loading...' : getCountryName(fromCountryId)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>To Country</Text>
              <TouchableOpacity
                style={styles.countryButton}
                onPress={() => setShowToCountryPicker(true)}
                disabled={loadingCountries}
              >
                <Text style={[styles.countryButtonText, !toCountryId && styles.placeholderText]}>
                  {loadingCountries ? 'Loading...' : getCountryName(toCountryId)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    if (!isNaN(selectedDate.getTime())) {
                      setStartDate(selectedDate);
                      // If start date is now after end date, update end date to match start date
                      if (isRoundTrip && selectedDate > endDate) {
                        setEndDate(selectedDate);
                      }
                    }
                  }}
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: '#ffffff',
                    border: '1px solid #3a3a3a',
                    width: '100%',
                    boxSizing: 'border-box',
                    colorScheme: 'dark',
                  }}
                />
              ) : (
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setShowStartDatePicker(true);
                    setShowEndDatePicker(false);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDate(startDate)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {Platform.OS !== 'web' && showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartDateChange}
              />
            )}

            <View style={styles.inputGroup}>
              <View style={styles.toggleRow}>
                <Text style={styles.label}>Round Trip?</Text>
                <Switch
                  value={isRoundTrip}
                  onValueChange={handleRoundTripToggle}
                  trackColor={{ false: '#3a3a3a', true: '#007AFF' }}
                  thumbColor={isRoundTrip ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </View>

            {isRoundTrip && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Date</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={endDate.toISOString().split('T')[0]}
                    min={startDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      if (!isNaN(selectedDate.getTime())) {
                        setEndDate(selectedDate);
                      }
                    }}
                    style={{
                      backgroundColor: '#2a2a2a',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      color: '#ffffff',
                      border: '1px solid #3a3a3a',
                      width: '100%',
                      boxSizing: 'border-box',
                      colorScheme: 'dark',
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(endDate)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {Platform.OS !== 'web' && isRoundTrip && showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={startDate}
                onChange={handleEndDateChange}
              />
            )}

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Trip'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* From Country Picker Modal */}
      <Modal
        visible={showFromCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFromCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select From Country</Text>
              <TouchableOpacity onPress={() => setShowFromCountryPicker(false)}>
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
                    setFromCountryId(item.id);
                    setShowFromCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* To Country Picker Modal */}
      <Modal
        visible={showToCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowToCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select To Country</Text>
              <TouchableOpacity onPress={() => setShowToCountryPicker(false)}>
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
                    setToCountryId(item.id);
                    setShowToCountryPicker(false);
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
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
  dateButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
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
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
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

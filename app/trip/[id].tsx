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
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Country, Trip } from '@/types';
import { deleteTrip } from '@/config/functions';
import CustomHeader from '@/components/CustomHeader';

export default function TripDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Country selection state
  const [countries, setCountries] = useState<Country[]>([]);
  const [fromCountryId, setFromCountryId] = useState('');
  const [toCountryId, setToCountryId] = useState('');
  const [showFromCountryPicker, setShowFromCountryPicker] = useState(false);
  const [showToCountryPicker, setShowToCountryPicker] = useState(false);

  // Load trip data and countries
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load countries
        const countriesRef = collection(db, 'countries');
        const countriesSnapshot = await getDocs(countriesRef);
        const fetchedCountries: Country[] = [];
        countriesSnapshot.forEach((doc) => {
          fetchedCountries.push({ id: doc.id, ...doc.data() } as Country);
        });
        fetchedCountries.sort((a, b) => a.name.localeCompare(b.name));
        setCountries(fetchedCountries);

        // Load trip data
        const tripRef = doc(db, 'trips', id);
        const tripDoc = await getDoc(tripRef);
        
        if (tripDoc.exists()) {
          const tripData = tripDoc.data();
          console.log('Loaded trip data:', tripData);
          console.log('Start date type:', typeof tripData.startDate, tripData.startDate);
          
          setTripName(tripData.name || '');
          
          // Handle Firestore Timestamp or ISO string
          let startDateValue: Date;
          if (tripData.startDate?.toDate) {
            // Firestore Timestamp
            startDateValue = tripData.startDate.toDate();
          } else if (typeof tripData.startDate === 'string') {
            // ISO string
            startDateValue = new Date(tripData.startDate);
          } else {
            // Fallback to current date
            console.warn('Invalid startDate format, using current date');
            startDateValue = new Date();
          }
          
          console.log('Converted start date:', startDateValue);
          
          if (isNaN(startDateValue.getTime())) {
            console.error('Invalid date after conversion');
            startDateValue = new Date();
          }
          
          setStartDate(startDateValue);
          setFromCountryId(tripData.fromCountryId || '');
          setToCountryId(tripData.toCountryId || '');
          
          // Check if there's a return trip
          // For now, we'll just use the single trip data
          // TODO: Check for return trip if needed
          setIsRoundTrip(false);
        } else {
          Alert.alert('Error', 'Trip not found');
          router.back();
        }
      } catch (error) {
        console.error('Error loading trip:', error);
        Alert.alert('Error', 'Failed to load trip data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
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

  const handleSave = async () => {
    if (!tripName.trim()) {
      Alert.alert('Error', 'Please enter a trip name');
      return;
    }

    if (!fromCountryId) {
      Alert.alert('Error', 'Please select a from country');
      return;
    }

    if (!toCountryId) {
      Alert.alert('Error', 'Please select a to country');
      return;
    }

    if (isRoundTrip && endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    setIsSaving(true);
    
    try {
      const tripRef = doc(db, 'trips', id);
      const updateData: any = {
        name: tripName,
        startDate: startDate.toISOString(),
        fromCountryId,
        toCountryId,
        fromCountryName: countries.find(c => c.id === fromCountryId)?.name || '',
        toCountryName: countries.find(c => c.id === toCountryId)?.name || '',
      };

      await updateDoc(tripRef, updateData);
      
      Alert.alert('Success', 'Trip updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating trip:', error);
      Alert.alert('Error', 'Failed to update trip. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDelete = () => {
    console.log('handleDelete called');
    console.log('Platform.OS:', Platform.OS);
    console.log('typeof window:', typeof window);
    console.log('typeof window.confirm:', typeof window?.confirm);
    
    // Simple direct approach
    const confirmed = confirm('Are you sure you want to delete this trip? This will also delete any associated return trips. This action cannot be undone.');
    
    console.log('Confirmation result:', confirmed);
    
    if (!confirmed) {
      console.log('User cancelled deletion');
      return;
    }
    
    console.log('Delete confirmed, calling deleteTrip with id:', id);
    setIsDeleting(true);
    
    deleteTrip(id)
      .then((response) => {
        console.log('Delete response:', response);
        
        if (response.success) {
          alert(`Trip deleted successfully. ${response.deletedCount || 1} trip(s) removed.`);
          router.back();
        } else {
          alert(response.message || 'Failed to delete trip');
        }
      })
      .catch((error) => {
        console.error('Error deleting trip:', error);
        alert('Failed to delete trip. Please try again.');
      })
      .finally(() => {
        setIsDeleting(false);
      });
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Trip Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading trip...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Trip Details" />
      
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
              >
                <Text style={[styles.countryButtonText, !fromCountryId && styles.placeholderText]}>
                  {getCountryName(fromCountryId)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>To Country</Text>
              <TouchableOpacity
                style={styles.countryButton}
                onPress={() => setShowToCountryPicker(true)}
              >
                <Text style={[styles.countryButtonText, !toCountryId && styles.placeholderText]}>
                  {getCountryName(toCountryId)}
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
          </View>

          {/* Delete Section */}
          <View style={styles.deleteSection}>
            <View style={styles.deleteTextContainer}>
              <Text style={styles.deleteLabel}>Would you like to delete this trip?</Text>
            </View>
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={() => {
                console.log('Delete button pressed!');
                handleDelete();
              }}
              disabled={isDeleting || isSaving}
            >
              <Text style={styles.deleteButtonText}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom buttons */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save'}
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  countryButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  countryButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  placeholderText: {
    color: '#666',
  },
  dateButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
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
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalClose: {
    fontSize: 24,
    color: '#fff',
  },
  countryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  countryItemText: {
    fontSize: 16,
    color: '#fff',
  },
  deleteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  deleteTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  deleteLabel: {
    fontSize: 16,
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

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
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Country, Trip } from '@/types';
import { deleteTrip } from '@/config/functions';
import CustomHeader from '@/components/CustomHeader';
import { Ionicons } from '@expo/vector-icons';

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

  // Child trips state
  const [childTrips, setChildTrips] = useState<Trip[]>([]);
  const [isChildTripsExpanded, setIsChildTripsExpanded] = useState(false);
  const [isChildTrip, setIsChildTrip] = useState(false);
  const [parentTripName, setParentTripName] = useState('');
  const [parentTripId, setParentTripId] = useState('');
  const [tripType, setTripType] = useState<'PARENT' | 'CHILD'>('PARENT');

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
          setTripType(tripData.tripType || 'PARENT');
          setIsChildTrip(tripData.tripType === 'CHILD');
          
          // If this is a child trip, fetch parent trip name
          if (tripData.tripType === 'CHILD' && tripData.parentTripId) {
            setParentTripId(tripData.parentTripId);
            const parentTripRef = doc(db, 'trips', tripData.parentTripId);
            const parentTripDoc = await getDoc(parentTripRef);
            if (parentTripDoc.exists()) {
              setParentTripName(parentTripDoc.data().name || '');
            }
          }
          
          // If this is a parent trip, fetch child trips
          if (tripData.tripType === 'PARENT') {
            const childTripsRef = collection(db, 'trips');
            const childTripsQuery = query(
              childTripsRef,
              where('parentTripId', '==', id),
              where('tripType', '==', 'CHILD')
            );
            const childTripsSnapshot = await getDocs(childTripsQuery);
            const fetchedChildTrips: Trip[] = [];
            childTripsSnapshot.forEach((doc) => {
              const data = doc.data();
              fetchedChildTrips.push({
                id: doc.id,
                userId: data.userId,
                tripType: data.tripType,
                name: data.name,
                startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
                fromCountryId: data.fromCountryId,
                fromCountryName: data.fromCountryName,
                toCountryId: data.toCountryId,
                toCountryName: data.toCountryName,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                parentTripId: data.parentTripId,
              } as Trip);
            });
            setChildTrips(fetchedChildTrips);
          }
          
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
          
          setIsRoundTrip(false);
        } else {
          router.back();
        }
      } catch (error) {
        console.error('Error loading trip:', error);
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
    // Only validate trip name for parent trips
    if (!isChildTrip && !tripName.trim()) {
      console.log('Error: Please enter a trip name');
      return;
    }

    if (!fromCountryId) {
      console.log('Error: Please select a from country');
      return;
    }

    if (!toCountryId) {
      console.log('Error: Please select a to country');
      return;
    }

    if (isRoundTrip && endDate <= startDate) {
      console.log('Error: End date must be after start date');
      return;
    }

    setIsSaving(true);
    
    try {
      const tripRef = doc(db, 'trips', id);
      const updateData: any = {
        startDate: startDate.toISOString(),
        fromCountryId,
        toCountryId,
        fromCountryName: countries.find(c => c.id === fromCountryId)?.name || '',
        toCountryName: countries.find(c => c.id === toCountryId)?.name || '',
      };

      // Only update name for parent trips
      if (!isChildTrip) {
        updateData.name = tripName;
      }

      await updateDoc(tripRef, updateData);
      
      router.back();
    } catch (error) {
      console.error('Error updating trip:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDelete = () => {
    setIsDeleting(true);
    
    deleteTrip(id)
      .then((response) => {
        if (response.success) {
          router.back();
        }
      })
      .catch((error) => {
        console.error('Error deleting trip:', error);
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
        <CustomHeader title="Trip Details" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading trip...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Trip Details" showBackButton={true} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Trip Name Input - Read-only for child trips showing parent name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                 Trip Name
              </Text>
              {isChildTrip ? (
                <View style={[styles.input, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>{parentTripName}</Text>
                </View>
              ) : (
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
              )}
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
              <Text style={styles.label}>Date</Text>
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

          {/* Parent Trip Card - Only show for CHILD trips */}
          {tripType === 'CHILD' && parentTripId && (
            <View style={styles.parentTripCard}>
              <TouchableOpacity
                style={styles.parentTripButton}
                onPress={() => router.push(`/trip/${parentTripId}`)}
                activeOpacity={0.7}
              >
                <View style={styles.parentTripContent}>
                  <Text style={styles.parentTripLabel}>Part of trip</Text>
                  <Text style={styles.parentTripName}>{parentTripName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Child Trips Card - Only show for PARENT trips */}
          {tripType === 'PARENT' && childTrips.length > 0 && (
            <View style={styles.childTripsCard}>
              <View style={styles.childTripsHeaderRow}>
                <TouchableOpacity
                  style={styles.childTripsHeaderButton}
                  onPress={() => setIsChildTripsExpanded(!isChildTripsExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.childTripsTitle}>
                    There {childTrips.length === 1 ? 'is' : 'are'} {childTrips.length} related trip{childTrips.length !== 1 ? 's' : ''}, click to view
                  </Text>
                  <Ionicons 
                    name={isChildTripsExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addTripButton}
                  onPress={() => router.push(`/add-trip?parentTripId=${id}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              
              {isChildTripsExpanded && (
                <View style={styles.childTripsList}>
                  {childTrips.map((childTrip, index) => (
                    <TouchableOpacity
                      key={childTrip.id}
                      style={[
                        styles.childTripRow,
                        index === childTrips.length - 1 && styles.childTripRowLast
                      ]}
                      onPress={() => router.push(`/trip/${childTrip.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.childTripInfo}>
                        <Text style={styles.childTripDate}>
                          {formatDate(new Date(childTrip.startDate))}
                        </Text>
                        <Text style={styles.childTripRoute}>
                          {childTrip.fromCountryName} → {childTrip.toCountryName}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Add First Trip Card - Show for PARENT trips with no children */}
          {tripType === 'PARENT' && childTrips.length === 0 && (
            <View style={styles.childTripsCard}>
              <View style={styles.childTripsHeaderRow}>
                <Text style={styles.childTripsTitle}>
                  No related trips yet
                </Text>
                <TouchableOpacity
                  style={styles.addTripButton}
                  onPress={() => router.push(`/add-trip?parentTripId=${id}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom buttons */}
          <View style={styles.bottomButtons}>
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
    paddingHorizontal: 20,
    paddingTop: 20,
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
  readOnlyInput: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#888',
  },
  parentTripCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    overflow: 'hidden',
  },
  parentTripButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  parentTripContent: {
    flex: 1,
  },
  parentTripLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  parentTripName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  childTripsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    overflow: 'hidden',
  },
  childTripsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
  },
  childTripsHeaderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  addTripButton: {
    padding: 4,
    marginLeft: 8,
  },
  childTripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  childTripsTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  childTripsList: {
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  childTripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  childTripRowLast: {
    borderBottomWidth: 0,
  },
  childTripInfo: {
    flex: 1,
  },
  childTripDate: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  childTripRoute: {
    fontSize: 13,
    color: '#4CAF50',
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
  deleteButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
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
});

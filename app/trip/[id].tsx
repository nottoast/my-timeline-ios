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
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { TransportType, Trip } from '@/types';
import { deleteTrip, updateTrip } from '@/config/functions';
import CustomHeader from '@/components/CustomHeader';
import PaperDatePicker from '@/components/PaperDatePicker';
import CountryAutocomplete from '@/components/CountryAutocomplete';
import GooglePlaceAutocomplete from '@/components/GooglePlaceAutocomplete';
import { Ionicons } from '@expo/vector-icons';
import { useCountries } from '@/contexts/CountriesContext';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeTripPlace } from '@/utils/places';

const TRANSPORT_OPTIONS: { value: TransportType; label: string }[] = [
  { value: 'plane', label: 'Plane' },
  { value: 'boat', label: 'Boat' },
  { value: 'train', label: 'Train' },
];

const MORE_TRANSPORT_OPTIONS: { value: TransportType; label: string }[] = [
  { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car' },
];

export default function TripDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { countries, loading: loadingCountries, getCountryFullName, getCountryName } = useCountries();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [transportType, setTransportType] = useState<TransportType | undefined>();
  const [showMoreTransportOptions, setShowMoreTransportOptions] = useState(false);
  const [placeFrom, setPlaceFrom] = useState<Trip['placeFrom']>();
  const [placeTo, setPlaceTo] = useState<Trip['placeTo']>();
  const isPlaneTrip = transportType === 'plane';
  const showPlaceFields = !!transportType && transportType !== 'plane';
  
  // Country selection state
  const [fromCountryId, setFromCountryId] = useState('');
  const [toCountryId, setToCountryId] = useState('');

  // Child trips state
  const [childTrips, setChildTrips] = useState<Trip[]>([]);
  const [isChildTripsExpanded, setIsChildTripsExpanded] = useState(false);
  const [isChildTrip, setIsChildTrip] = useState(false);
  const [parentTripName, setParentTripName] = useState('');
  const [parentTripId, setParentTripId] = useState('');
  const [tripType, setTripType] = useState<'PARENT' | 'CHILD'>('PARENT');

  // Load trip data
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) {
        return;
      }

      if (!id) {
        setLoadError('Trip not found');
        setLoading(false);
        return;
      }

      if (!user) {
        setLoadError('Please sign in to view this trip');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);
        setTripName('');
        setChildTrips([]);
        setIsChildTripsExpanded(false);
        setIsChildTrip(false);
        setParentTripName('');
        setParentTripId('');
        setTripType('PARENT');
        setTransportType(undefined);
        setShowMoreTransportOptions(false);
        setPlaceFrom(undefined);
        setPlaceTo(undefined);

        // Load trip data
        const tripRef = doc(db, 'trips', id);
        const tripDoc = await getDoc(tripRef);
        
        if (tripDoc.exists()) {
          const tripData = tripDoc.data();
          
          setTripName(tripData.name || '');
          setTripType(tripData.tripType || 'PARENT');
          setIsChildTrip(tripData.tripType === 'CHILD');
          setTransportType(tripData.transportType);
          setShowMoreTransportOptions(tripData.transportType === 'bus' || tripData.transportType === 'car');
          setPlaceFrom(normalizeTripPlace(tripData.placeFrom || tripData.fromAirport, tripData.transportType === 'plane' ? 'AIRPORT' : 'PLACE'));
          setPlaceTo(normalizeTripPlace(tripData.placeTo || tripData.toAirport, tripData.transportType === 'plane' ? 'AIRPORT' : 'PLACE'));
          
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
              where('userId', '==', user.uid),
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
                tripDate: data.tripDate?.toDate ? data.tripDate.toDate().toISOString() : data.tripDate,
                fromCountryId: data.fromCountryId,
                fromCountryName: data.fromCountryName,
                toCountryId: data.toCountryId,
                toCountryName: data.toCountryName,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                parentTripId: data.parentTripId,
                transportType: data.transportType,
                placeFrom: normalizeTripPlace(data.placeFrom || data.fromAirport, data.transportType === 'plane' ? 'AIRPORT' : 'PLACE'),
                placeTo: normalizeTripPlace(data.placeTo || data.toAirport, data.transportType === 'plane' ? 'AIRPORT' : 'PLACE'),
              } as Trip);
            });
            // Sort child trips by tripDate ascending (oldest first)
            fetchedChildTrips.sort((a, b) => new Date(a.tripDate).getTime() - new Date(b.tripDate).getTime());
            setChildTrips(fetchedChildTrips);
            // Auto-expand if 3 or fewer related trips
            setIsChildTripsExpanded(fetchedChildTrips.length <= 3);
          }
          
          // Handle Firestore Timestamp or ISO string
          let tripDateValue: Date;
          if (tripData.tripDate?.toDate) {
            // Firestore Timestamp
            tripDateValue = tripData.tripDate.toDate();
          } else if (typeof tripData.tripDate === 'string') {
            // ISO string
            tripDateValue = new Date(tripData.tripDate);
          } else {
            // Fallback to current date
            console.warn('Invalid tripDate format, using current date');
            tripDateValue = new Date();
          }
          
          if (isNaN(tripDateValue.getTime())) {
            console.error('Invalid date after conversion');
            tripDateValue = new Date();
          }
          
          setStartDate(tripDateValue);
          setFromCountryId(tripData.fromCountryId || '');
          setToCountryId(tripData.toCountryId || '');
          
          setIsRoundTrip(false);
        } else {
          setLoadError('Trip not found');
        }
      } catch (error) {
        console.error('Error loading trip:', error);
        setLoadError('Failed to load trip');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user, authLoading]);

  const handleSave = async () => {
    // Only validate trip name for parent trips
    if (!isChildTrip && !tripName.trim()) {
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
      const response = await updateTrip({
        tripId: id,
        tripDate: startDate.toISOString(),
        fromCountryId,
        toCountryId,
        transportType: transportType ?? null,
        placeFrom: transportType && placeFrom ? placeFrom : null,
        placeTo: transportType && placeTo ? placeTo : null,
        ...(!isChildTrip && { name: tripName }),
      });

      if (!response.success) {
        Alert.alert('Error', response.message || 'Failed to update trip');
        return;
      }
      
      // Navigate to parent trip if this is a child trip, otherwise to timeline
      if (isChildTrip && parentTripId) {
        router.replace(`/trip/${parentTripId}`);
      } else {
        router.push('/view-trips');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await deleteTrip(id);

      if (response.success) {
        if (isChildTrip && parentTripId) {
          router.replace({
            pathname: '/trip/[id]',
            params: {
              id: parentTripId,
              deletedTripId: id,
            },
          });
        } else {
          router.replace({
            pathname: '/view-trips',
            params: {
              deletedTripId: id,
              deletedParentTripId: id,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleBackPress = () => {
    // Parent trips should always go back to timeline, not to any child trip
    if (tripType === 'PARENT') {
      router.push('/view-trips');
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Trip Details" showBackButton={true} onBackPress={handleBackPress} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading trip...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Trip Details" showBackButton={true} onBackPress={handleBackPress} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Trip Details" showBackButton={true} onBackPress={handleBackPress} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Main Details</Text>
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
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>From Country</Text>
                <CountryAutocomplete
                  countries={countries}
                  value={fromCountryId}
                  onSelect={setFromCountryId}
                  placeholder="Start typing country name..."
                  disabled={loadingCountries}
                  getCountryName={getCountryFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>To Country</Text>
                <CountryAutocomplete
                  countries={countries}
                  value={toCountryId}
                  onSelect={setToCountryId}
                  placeholder="Start typing country name..."
                  disabled={loadingCountries}
                  getCountryName={getCountryFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <PaperDatePicker
                  value={startDate}
                  onChange={(selectedDate) => {
                    setStartDate(selectedDate);
                    if (isRoundTrip) {
                      const oneWeekLater = new Date(selectedDate);
                      oneWeekLater.setDate(oneWeekLater.getDate() + 7);
                      setEndDate(oneWeekLater);
                    }
                  }}

                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Optional Details</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Transport Type</Text>
                <View style={styles.optionGrid}>
                  {TRANSPORT_OPTIONS.map((option) => {
                    const isSelected = transportType === option.value;

                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                        onPress={() => {
                          setTransportType(isSelected ? undefined : option.value);
                          setPlaceFrom(undefined);
                          setPlaceTo(undefined);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.optionButtonText, isSelected && styles.optionButtonTextSelected]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {showMoreTransportOptions ? (
                    MORE_TRANSPORT_OPTIONS.map((option) => {
                      const isSelected = transportType === option.value;

                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                          onPress={() => {
                            setTransportType(isSelected ? undefined : option.value);
                            setPlaceFrom(undefined);
                            setPlaceTo(undefined);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.optionButtonText, isSelected && styles.optionButtonTextSelected]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => setShowMoreTransportOptions(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.optionButtonText}>More...</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {isPlaneTrip && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>From Airport</Text>
                    <GooglePlaceAutocomplete
                      value={placeFrom}
                      onChangePlace={setPlaceFrom}
                      countryId={fromCountryId}
                      placeType="AIRPORT"
                      includedPrimaryTypes={['airport']}
                      placeholder="Airport name, city, or code..."
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>To Airport</Text>
                    <GooglePlaceAutocomplete
                      value={placeTo}
                      onChangePlace={setPlaceTo}
                      countryId={toCountryId}
                      placeType="AIRPORT"
                      includedPrimaryTypes={['airport']}
                      placeholder="Airport name, city, or code..."
                    />
                  </View>
                </>
              )}

              {showPlaceFields && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>From Place</Text>
                    <GooglePlaceAutocomplete
                      value={placeFrom}
                      onChangePlace={setPlaceFrom}
                      countryId={fromCountryId}
                      placeholder="Search for a station, port, address..."
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>To Place</Text>
                    <GooglePlaceAutocomplete
                      value={placeTo}
                      onChangePlace={setPlaceTo}
                      countryId={toCountryId}
                      placeholder="Search for a station, port, address..."
                    />
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Parent Trip Card - Only show for CHILD trips */}
          {tripType === 'CHILD' && parentTripId && (
            <View style={styles.parentTripCard}>
              <TouchableOpacity
                style={styles.parentTripButton}
                onPress={() => router.replace(`/trip/${parentTripId}`)}
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
                    {childTrips.length} related trip{childTrips.length !== 1 ? 's' : ''}
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
                  <Ionicons name="add" size={18} color="#ffffff" />
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
                      onPress={() => router.replace(`/trip/${childTrip.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.childTripInfo}>
                        <Text style={styles.childTripDate}>
                          {formatDate(new Date(childTrip.tripDate))}
                        </Text>
                        <Text style={styles.childTripRoute}>
                          {getCountryName(childTrip.fromCountryId)} → {getCountryName(childTrip.toCountryId)}
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
                  No related trips
                </Text>
                <TouchableOpacity
                  style={styles.addTripButton}
                  onPress={() => router.push(`/add-trip?parentTripId=${id}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom buttons */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={handleDelete}
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
    gap: 24,
  },
  formSection: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 0,
    ...Platform.select({
      web: {
        // @ts-ignore - web-only CSS property
        overflow: 'visible',
      },
    }),
  },
  formSectionTitle: {
    position: 'absolute',
    top: -10,
    right: 14,
    paddingHorizontal: 8,
    backgroundColor: '#1a1a1a',
    color: '#cfcfcf',
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
    ...Platform.select({
      web: {
        // @ts-ignore - web-only CSS property
        overflow: 'visible',
        zIndex: 1,
      },
    }),
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
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    minWidth: 86,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  optionButtonText: {
    color: '#cfcfcf',
    fontSize: 15,
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: '#ffffff',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
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
});

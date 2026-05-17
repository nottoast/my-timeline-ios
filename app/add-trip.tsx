import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createTrip } from '@/config/functions';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import CustomHeader from '@/components/CustomHeader';
import PaperDatePicker from '@/components/PaperDatePicker';
import CountryAutocomplete from '@/components/CountryAutocomplete';
import GooglePlaceAutocomplete from '@/components/GooglePlaceAutocomplete';
import { useCountries } from '@/contexts/CountriesContext';
import { TransportType, Trip, TripPlace } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeTripPlace } from '@/utils/places';

const TRANSPORT_OPTIONS: { value: TransportType; label: string }[] = [
  { value: 'plane', label: 'Plane' },
  { value: 'boat', label: 'Boat' },
  { value: 'train', label: 'Train' },
];

const MORE_TRANSPORT_OPTIONS: { value: TransportType; label: string }[] = [
  { value: 'bus', label: 'Bus' },
  { value: 'taxi', label: 'Taxi' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
];

type TransportPlaces = Partial<Record<TransportType, {
  from?: TripPlace;
  to?: TripPlace;
}>>;

export default function AddTripScreen() {
  const router = useRouter();
  const { parentTripId } = useLocalSearchParams<{ parentTripId?: string }>();
  const { countries, loading: loadingCountries, getCountryFullName } = useCountries();
  const { user } = useAuth();
  const [tripName, setTripName] = useState('');
  const [parentTripName, setParentTripName] = useState('');
  const [parentTrip, setParentTrip] = useState<Trip | null>(null);
  const [existingChildTrips, setExistingChildTrips] = useState<Trip[]>([]);
  const [isChildTrip, setIsChildTrip] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transportType, setTransportType] = useState<TransportType | undefined>();
  const [showMoreTransportOptions, setShowMoreTransportOptions] = useState(false);
  const [transportPlaces, setTransportPlaces] = useState<TransportPlaces>({});
  const canCreateRoundTrip = !isChildTrip;
  const shouldCreateRoundTrip = canCreateRoundTrip && isRoundTrip;
  const isPlaneTrip = transportType === 'plane';
  const showPlaceFields = !!transportType && transportType !== 'plane';
  const activePlaces = transportType ? transportPlaces[transportType] : undefined;
  const activePlaceFrom = activePlaces?.from;
  const activePlaceTo = activePlaces?.to;
  const placeFieldText = {
    fromLabel: transportType === 'boat' ? 'From Port' : transportType === 'train' ? 'From Station' : 'From',
    toLabel: transportType === 'boat' ? 'To Port' : transportType === 'train' ? 'To Station' : 'To',
    placeholder: transportType === 'boat'
      ? 'Search for a port...'
      : transportType === 'train'
        ? 'Search for a station...'
        : 'Search for a station, port, address...',
  };
  
  // Country selection state
  const [fromCountryId, setFromCountryId] = useState('');
  const [toCountryId, setToCountryId] = useState('');
  const userEditedFromCountryRef = useRef(false);
  const userEditedToCountryRef = useRef(false);

  const toTrip = (id: string, data: any): Trip => ({
    id,
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
    tripVisaStatus: data.tripVisaStatus,
    transportType: data.transportType,
    placeFrom: normalizeTripPlace(data.placeFrom || data.fromAirport, data.transportType === 'plane' ? 'AIRPORT' : 'PLACE'),
    placeTo: normalizeTripPlace(data.placeTo || data.toAirport, data.transportType === 'plane' ? 'AIRPORT' : 'PLACE'),
  } as Trip);

  // Fetch parent trip if parentTripId is provided
  useEffect(() => {
    const fetchParentTrip = async () => {
      if (parentTripId && user) {
        try {
          const parentTripRef = doc(db, 'trips', parentTripId);
          const parentTripDoc = await getDoc(parentTripRef);
          if (parentTripDoc.exists()) {
            const parentData = parentTripDoc.data();
            setParentTrip(toTrip(parentTripDoc.id, parentData));
            setParentTripName(parentData.name || '');
            setIsChildTrip(true);

            const childTripsQuery = query(
              collection(db, 'trips'),
              where('userId', '==', user.uid),
              where('parentTripId', '==', parentTripId),
              where('tripType', '==', 'CHILD')
            );
            const childTripsSnapshot = await getDocs(childTripsQuery);
            const fetchedChildTrips = childTripsSnapshot.docs.map((childDoc) =>
              toTrip(childDoc.id, childDoc.data())
            );
            setExistingChildTrips(fetchedChildTrips);
          }
        } catch (error) {
          console.error('Error fetching parent trip:', error);
        }
      }
    };

    fetchParentTrip();
  }, [parentTripId, user]);

  useEffect(() => {
    if (!isChildTrip || !parentTrip) return;

    const selectedTime = startDate.getTime();
    const sortedLegs = [parentTrip, ...existingChildTrips]
      .sort((a, b) => new Date(a.tripDate).getTime() - new Date(b.tripDate).getTime());

    const previousLegs = sortedLegs.filter((trip) => new Date(trip.tripDate).getTime() <= selectedTime);
    const previousLeg = previousLegs[previousLegs.length - 1];
    const nextLeg = sortedLegs.find((trip) => new Date(trip.tripDate).getTime() > selectedTime);

    const inferredFromCountryId = previousLeg?.toCountryId || parentTrip.fromCountryId;
    const inferredToCountryId = nextLeg?.fromCountryId;

    if (!userEditedFromCountryRef.current && inferredFromCountryId) {
      setFromCountryId(inferredFromCountryId);
    }

    if (!userEditedToCountryRef.current) {
      setToCountryId(inferredToCountryId || '');
    }
  }, [existingChildTrips, isChildTrip, parentTrip, startDate]);

  const handleFromCountrySelect = (countryId: string) => {
    userEditedFromCountryRef.current = true;
    setFromCountryId(countryId);
  };

  const handleToCountrySelect = (countryId: string) => {
    userEditedToCountryRef.current = true;
    setToCountryId(countryId);
  };

  const handleRoundTripToggle = (value: boolean) => {
    setIsRoundTrip(value);
    // Set end date to one week after start date when enabling round trip
    if (value) {
      const oneWeekLater = new Date(startDate);
      oneWeekLater.setDate(oneWeekLater.getDate() + 7);
      setEndDate(oneWeekLater);
    }
  };

  const setActivePlaceFrom = (place?: TripPlace) => {
    if (!transportType) return;
    setTransportPlaces(prev => ({
      ...prev,
      [transportType]: {
        ...prev[transportType],
        from: place,
      },
    }));
  };

  const setActivePlaceTo = (place?: TripPlace) => {
    if (!transportType) return;
    setTransportPlaces(prev => ({
      ...prev,
      [transportType]: {
        ...prev[transportType],
        to: place,
      },
    }));
  };

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

    if (shouldCreateRoundTrip && endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    const tripData: any = {
      tripDate: startDate.toISOString(),
      fromCountryId,
      toCountryId,
      isRoundTrip: shouldCreateRoundTrip,
      ...(shouldCreateRoundTrip && { endDate: endDate.toISOString() }),
      ...(transportType && { transportType }),
      ...(transportType && activePlaceFrom && { placeFrom: activePlaceFrom }),
      ...(transportType && activePlaceTo && { placeTo: activePlaceTo }),
    };

    // Add name only for parent trips
    if (!isChildTrip) {
      tripData.name = tripName;
    }

    // Add parent trip info for child trips
    if (isChildTrip && parentTripId) {
      tripData.tripType = 'CHILD';
      tripData.parentTripId = parentTripId;
    }

    setIsSaving(true);
    
    try {
      const response = await createTrip(tripData);
      
      if (response.success && response.trip) {
        Alert.alert('Success', 'Trip created successfully!');
        // Navigate to parent trip if this is a child trip, otherwise to timeline
        if (isChildTrip && parentTripId) {
          router.push(`/trip/${parentTripId}`);
        } else {
          router.push('/view-trips');
        }
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Add Trip" showBackButton={true} />
      
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
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Trip Name</Text>
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
                <Text style={styles.label}>Start Date</Text>
                <PaperDatePicker
                  value={startDate}
                  onChange={(selectedDate) => {
                    setStartDate(selectedDate);
                    // If round trip and start date changes, update end date to one week later
                    if (isRoundTrip) {
                      const oneWeekLater = new Date(selectedDate);
                      oneWeekLater.setDate(oneWeekLater.getDate() + 7);
                      setEndDate(oneWeekLater);
                    }
                  }}

                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>From Country</Text>
                <CountryAutocomplete
                  countries={countries}
                  value={fromCountryId}
                  onSelect={handleFromCountrySelect}
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
                  onSelect={handleToCountrySelect}
                  placeholder="Start typing country name..."
                  disabled={loadingCountries}
                  getCountryName={getCountryFullName}
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
                        onPress={() => setTransportType(isSelected ? undefined : option.value)}
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
                          onPress={() => setTransportType(isSelected ? undefined : option.value)}
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
                      value={activePlaceFrom}
                      onChangePlace={setActivePlaceFrom}
                      countryId={fromCountryId}
                      placeType="AIRPORT"
                      includedPrimaryTypes={['airport']}
                      placeholder="Airport name, city, or code..."
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>To Airport</Text>
                    <GooglePlaceAutocomplete
                      value={activePlaceTo}
                      onChangePlace={setActivePlaceTo}
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
                    <Text style={styles.label}>{placeFieldText.fromLabel}</Text>
                    <GooglePlaceAutocomplete
                      value={activePlaceFrom}
                      onChangePlace={setActivePlaceFrom}
                      countryId={fromCountryId}
                      placeholder={placeFieldText.placeholder}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{placeFieldText.toLabel}</Text>
                    <GooglePlaceAutocomplete
                      value={activePlaceTo}
                      onChangePlace={setActivePlaceTo}
                      countryId={toCountryId}
                      placeholder={placeFieldText.placeholder}
                    />
                  </View>
                </>
              )}

              {canCreateRoundTrip && (
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
              )}

              {shouldCreateRoundTrip && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>End Date</Text>
                  <PaperDatePicker
                    value={endDate}
                    min={startDate}
                    onChange={(selectedDate) => {
                      setEndDate(selectedDate);
                    }}
                  />
                </View>
              )}
            </View>

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
  formSection: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 16,
    gap: 18,
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
    gap: 8,
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
  readOnlyInput: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#888',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

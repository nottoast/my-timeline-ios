import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Trip, Country } from '@/types';
import CustomHeader from '@/components/CustomHeader';
import EUPill from '@/components/EUPill';
import { Ionicons } from '@expo/vector-icons';
import { computeSchengenDaysRemaining } from '@/utils/schengen';

interface TimelineItem {
  trip: Trip;
  children: Trip[];
}

export default function ViewTripsScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [childTrips, setChildTrips] = useState<Trip[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [countries, setCountries] = useState<Map<string, Country>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schengenDaysRemaining, setSchengenDaysRemaining] = useState(90);
  const [schengenIsInvalid, setSchengenIsInvalid] = useState(false);

  const fetchCountries = async () => {
    try {
      const countriesRef = collection(db, 'countries');
      const querySnapshot = await getDocs(countriesRef);
      const countriesMap = new Map<string, Country>();
      
      querySnapshot.forEach((doc) => {
        countriesMap.set(doc.id, {
          id: doc.id,
          ...doc.data(),
        } as Country);
      });
      
      setCountries(countriesMap);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  // Fetch countries once on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Set up real-time listener for trips
  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return;
    }

    if (!user) {
      console.log('No user found, skipping listener');
      setError('No user logged in');
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    console.log('Setting up real-time listener for user:', user.uid);
    const tripsRef = collection(db, 'trips');
    
    // Query for parent trips
    const parentQuery = query(
      tripsRef,
      where('userId', '==', user.uid),
      where('tripType', '==', 'PARENT')
    );

    // Query for child trips
    const childQuery = query(
      tripsRef,
      where('userId', '==', user.uid),
      where('tripType', '==', 'CHILD')
    );

    // Set up real-time listener for parent trips
    const unsubscribeParent = onSnapshot(
      parentQuery,
      (querySnapshot) => {
        const fetchedTrips: Trip[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          fetchedTrips.push({
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
            tripVisaStatus: data.tripVisaStatus,
          } as Trip);
        });

        // Sort by tripDate descending (newest first)
        fetchedTrips.sort((a, b) => {
          return new Date(b.tripDate).getTime() - new Date(a.tripDate).getTime();
        });

        console.log('Real-time update: Parent trips:', fetchedTrips.length);
        setTrips(fetchedTrips);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error in parent trips listener:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to fetch trips');
        }
        setLoading(false);
        setRefreshing(false);
      }
    );

    // Set up real-time listener for child trips
    const unsubscribeChild = onSnapshot(
      childQuery,
      (querySnapshot) => {
        const fetchedChildTrips: Trip[] = [];

        querySnapshot.forEach((doc) => {
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
            tripVisaStatus: data.tripVisaStatus,
          } as Trip);
        });

        console.log('Real-time update: Child trips:', fetchedChildTrips.length);
        setChildTrips(fetchedChildTrips);
      },
      (error) => {
        console.error('Error in child trips listener:', error);
      }
    );

    // Cleanup listeners on unmount or when user changes
    return () => {
      console.log('Cleaning up real-time listeners');
      unsubscribeParent();
      unsubscribeChild();
    };
  }, [user, authLoading]);

  // Organize trips into timeline items whenever trips or childTrips change
  useEffect(() => {
    const items: TimelineItem[] = trips.map(parentTrip => {
      // Find all children for this parent
      const children = childTrips
        .filter(child => child.parentTripId === parentTrip.id)
        // Sort children by tripDate ascending (oldest first)
        .sort((a, b) => new Date(a.tripDate).getTime() - new Date(b.tripDate).getTime());

      return {
        trip: parentTrip,
        children,
      };
    });

    setTimelineItems(items);
  }, [trips, childTrips]);

  // Recompute Schengen days whenever trips change
  useEffect(() => {
    const allTrips = [...trips, ...childTrips];
    const { daysRemaining, isInvalid } = computeSchengenDaysRemaining(allTrips);
    setSchengenDaysRemaining(daysRemaining);
    setSchengenIsInvalid(isInvalid);
  }, [trips, childTrips]);

  const onRefresh = () => {
    setRefreshing(true);
    // With real-time listener, data updates automatically
    // Just provide visual feedback for the user
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatParentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getCountryName = (countryId: string) => {
    const country = countries.get(countryId);
    return country ? country.name : 'Unknown';
  };

  const isTripInFuture = (tripDate: string) => {
    return new Date(tripDate) > new Date();
  };

  const renderChildTrip = (child: Trip, isLast: boolean, isLastOverall: boolean, isOnlyChild: boolean, totalChildren: number) => {
    const isInFuture = isTripInFuture(child.tripDate);
    return (
      <TouchableOpacity
        key={child.id}
        style={styles.childTripContainer}
        onPress={() => router.push(`/trip/${child.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.timelineColumn}>
          <View style={[
            styles.childTimelineLine,
            totalChildren > 1 ? {
              top: -50,
              bottom: isLast ? 0 : -50
            } : {}
          ]} />
          <View style={styles.childTimelineCircle} />
      </View>
      <View style={isInFuture ? styles.childTripCardFuture : styles.childTripCard}>
        <View style={styles.tripRouteContainer}>
          <Text style={styles.routeCountry}>{child.fromCountryName}</Text>
          {child.tripVisaStatus === 'LEFT_SCHENGEN' && (
            <EUPill prefix="←" style={styles.pillInline} />
          )}
          <Text style={styles.routeArrow}> → </Text>
          <Text style={styles.routeCountry}>{child.toCountryName}</Text>
          {child.tripVisaStatus === 'ENTERED_SCHENGEN' && (
            <EUPill prefix="→" style={styles.pillInline} />
          )}
        </View>
        <Text style={styles.childTripDate}>{formatDate(child.tripDate)}</Text>
      </View>
    </TouchableOpacity>
    );
  };

  const renderOutboundTrip = (trip: Trip, isLast: boolean, hasChildren: boolean, totalChildren: number) => {
    const isInFuture = isTripInFuture(trip.tripDate);
    return (
      <TouchableOpacity
        key={`${trip.id}-outbound`}
        style={styles.childTripContainer}
        onPress={() => router.push(`/trip/${trip.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.timelineColumn}>
          <View style={[
            styles.childTimelineLine,
            totalChildren > 1 ? {
              top: 0,
              bottom: -50
            } : {}
          ]} />
          <View style={styles.childTimelineCircle} />
      </View>
      <View style={isInFuture ? styles.childTripCardFuture : styles.childTripCard}>
        <View style={styles.tripRouteContainer}>
          <Text style={styles.routeCountry}>{trip.fromCountryName}</Text>
          {trip.tripVisaStatus === 'LEFT_SCHENGEN' && (
            <EUPill prefix="←" style={styles.pillInline} />
          )}
          <Text style={styles.routeArrow}> → </Text>
          <Text style={styles.routeCountry}>{trip.toCountryName}</Text>
          {trip.tripVisaStatus === 'ENTERED_SCHENGEN' && (
            <EUPill prefix="→" style={styles.pillInline} />
          )}
        </View>
        <Text style={styles.childTripDate}>{formatDate(trip.tripDate)}</Text>
      </View>
    </TouchableOpacity>
    );
  };

  const renderTimelineItem = (item: TimelineItem, index: number) => {
    const isLast = index === timelineItems.length - 1;
    const isFirst = index === 0;
    const hasChildren = item.children.length > 0;
    const totalChildren = 1 + item.children.length; // 1 outbound + actual children
    const isInFuture = isTripInFuture(item.trip.tripDate);
    
    // Calculate the height needed to extend the line through all child trips
    // Each child trip is approximately 90px (50px minHeight card + 16px container padding + 24px buffer)
    const childTripHeight = 105;
    const lineExtension = isLast ? 0 : totalChildren * childTripHeight;

    return (
      <View key={item.trip.id} style={styles.timelineItemContainer}>
        {/* Parent Trip */}
        <TouchableOpacity
          style={styles.parentTripContainer}
          onPress={() => router.push(`/trip/${item.trip.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.timelineColumn}>
            <View style={[
              styles.timelineLine,
              { 
                top: 0,
                bottom: -lineExtension
              }
            ]} />
            <View style={styles.timelineCircle} />
          </View>
          <View style={isInFuture ? styles.tripCardFuture : styles.tripCard}>
            <Text style={styles.tripName}>{item.trip.name}</Text>
            <Text style={styles.tripDate}>{formatParentDate(item.trip.tripDate)}</Text>
          </View>
        </TouchableOpacity>

        {/* Outbound Trip (duplicate of parent data) */}
        {renderOutboundTrip(item.trip, isLast, hasChildren, totalChildren)}

        {/* Child Trips */}
        {item.children.map((child, childIndex) => 
          renderChildTrip(
            child, 
            childIndex === item.children.length - 1, 
            isLast,
            totalChildren === 1,
            totalChildren
          )
        )}
      </View>
    );
  };

  // Show loading while auth is initializing or while trips are loading
  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Timeline" schengenDaysRemaining={schengenDaysRemaining} schengenIsInvalid={schengenIsInvalid} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Timeline" schengenDaysRemaining={schengenDaysRemaining} schengenIsInvalid={schengenIsInvalid} />

      {timelineItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          {error ? (
            <>
              <Text style={styles.errorText}>⚠️ Error</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={onRefresh}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyText}>No trips yet</Text>
              <Text style={styles.emptySubText}>
                Tap the + button below to add your first trip!
              </Text>
            </>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        >
          {timelineItems.map((item, index) => renderTimelineItem(item, index))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-trip')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ff4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#ff8888',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingVertical: 20,
  },
  bottomPadding: {
    height: 100,
  },
  timelineItemContainer: {
    marginBottom: 0,
  },
  parentTripContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  childTripContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingLeft: 38,
    alignItems: 'center',
  },
  timelineColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'stretch',
  },
  timelineLine: {
    position: 'absolute',
    top: -100,
    bottom: -100,
    width: 2,
    backgroundColor: '#007AFF',
  },
  childTimelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#666',
  },
  timelineCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    zIndex: 1,
  },
  childTimelineCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666',
    zIndex: 1,
  },
  tripCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripCardFuture: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#666',
    borderStyle: 'dashed',
    minHeight: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  tripDate: {
    fontSize: 14,
    color: '#999',
    marginLeft: 12,
  },
  childTripCard: {
    flex: 1,
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childTripCardFuture: {
    flex: 1,
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    marginLeft: 4,
    borderWidth: 2,
    borderColor: '#666',
    borderStyle: 'dashed',
    minHeight: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childTripName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ccc',
    flex: 1,
  },
  tripRouteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  routeCountry: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ccc',
  },
  routeArrow: {
    fontSize: 14,
    color: '#777',
  },
  pillInline: {
    marginHorizontal: 3,
  },
  childTripDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

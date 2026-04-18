import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { collection, query, where, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useCountries } from '@/contexts/CountriesContext';
import { Trip, User as AppUser } from '@/types';
import CustomHeader from '@/components/CustomHeader';
import TimelineSkeletonLoader from '@/components/TimelineSkeletonLoader';
import TripTimeline, { TimelineItem } from '@/components/TripTimeline';
import { Ionicons } from '@expo/vector-icons';
import { computeSchengenDaysRemaining } from '@/utils/schengen';

const TRIPS_PER_PAGE = 50;

export default function ViewTripsScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useCountries(); // Ensure CountriesContext is loaded for TripTimeline
  const flatListRef = useRef<FlatList>(null);
  const lastClickedTripIdRef = useRef<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [childTrips, setChildTrips] = useState<Trip[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schengenDaysRemaining, setSchengenDaysRemaining] = useState(90);
  const [schengenIsInvalid, setSchengenIsInvalid] = useState(false);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [enableSchengenCalculations, setEnableSchengenCalculations] = useState<'enable' | 'disable'>('disable');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Load trips with pagination
  const loadTrips = useCallback(async (isRefresh = false) => {
    if (!user) {
      console.log('No user found, skipping load');
      setError('No user logged in');
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('Loading trips for user:', user.uid);
      const tripsRef = collection(db, 'trips');
      
      // Query for parent trips with pagination
      const parentQuery = query(
        tripsRef,
        where('userId', '==', user.uid),
        where('tripType', '==', 'PARENT'),
        orderBy('tripDate', 'desc'),
        limit(TRIPS_PER_PAGE)
      );

      const parentSnapshot = await getDocs(parentQuery);
      const fetchedTrips: Trip[] = [];

      parentSnapshot.forEach((doc) => {
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

      // Load ALL child trips for the user (not paginated)
      const childQuery = query(
        tripsRef,
        where('userId', '==', user.uid),
        where('tripType', '==', 'CHILD')
      );

      const childSnapshot = await getDocs(childQuery);
      const fetchedChildTrips: Trip[] = [];

      childSnapshot.forEach((doc) => {
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

      console.log('Loaded parent trips:', fetchedTrips.length);
      console.log('Loaded child trips:', fetchedChildTrips.length);
      
      setTrips(fetchedTrips);
      setChildTrips(fetchedChildTrips);
      setLastDoc(parentSnapshot.docs[parentSnapshot.docs.length - 1] || null);
      setHasMore(parentSnapshot.docs.length === TRIPS_PER_PAGE);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading trips:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to load trips');
      }
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Load more trips
  const loadMoreTrips = useCallback(async () => {
    if (!user || !hasMore || loadingMore || !lastDoc) {
      return;
    }

    setLoadingMore(true);

    try {
      console.log('Loading more trips...');
      const tripsRef = collection(db, 'trips');
      
      const parentQuery = query(
        tripsRef,
        where('userId', '==', user.uid),
        where('tripType', '==', 'PARENT'),
        orderBy('tripDate', 'desc'),
        startAfter(lastDoc),
        limit(TRIPS_PER_PAGE)
      );

      const parentSnapshot = await getDocs(parentQuery);
      const newTrips: Trip[] = [];

      parentSnapshot.forEach((doc) => {
        const data = doc.data();
        newTrips.push({
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

      console.log('Loaded additional trips:', newTrips.length);
      
      setTrips(prev => [...prev, ...newTrips]);
      setLastDoc(parentSnapshot.docs[parentSnapshot.docs.length - 1] || null);
      setHasMore(parentSnapshot.docs.length === TRIPS_PER_PAGE);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading more trips:', error);
      setLoadingMore(false);
    }
  }, [user, hasMore, loadingMore, lastDoc]);

  // Initial load - only if we haven't loaded before
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      console.log('No user found, skipping load');
      setError('No user logged in');
      setLoading(false);
      return;
    }

    // Only load if we haven't loaded data before (first mount)
    if (!hasLoadedOnceRef.current) {
      loadTrips();
      hasLoadedOnceRef.current = true;
    } else {
      // Already have data, just stop loading indicator
      setLoading(false);
    }
  }, [user, authLoading, loadTrips]);

  // Restore scroll position to the last clicked trip when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Scroll to the last clicked trip after a delay to ensure list is rendered
      if (lastClickedTripIdRef.current && timelineItems.length > 0) {
        const tripIdToScrollTo = lastClickedTripIdRef.current;
        
        setTimeout(() => {
          const index = timelineItems.findIndex(item => item.trip.id === tripIdToScrollTo);
          console.log('Attempting to scroll to trip:', tripIdToScrollTo, 'at index:', index);
          
          if (index !== -1) {
            flatListRef.current?.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.2, // Show near top of screen
            });
            
            // Clear the saved trip ID after scrolling
            lastClickedTripIdRef.current = null;
          }
        }, 300);
      }
    }, [timelineItems])
  );

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

  // Fetch user data to get enableSchengenCalculations setting
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const data = userDoc.data() as AppUser;
          setUserData(data);
          setEnableSchengenCalculations(data.enableSchengenCalculations || 'disable');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  // Recompute Schengen days whenever trips change, but only if enabled
  useEffect(() => {
    if (enableSchengenCalculations === 'enable') {
      const allTrips = [...trips, ...childTrips];
      const { daysRemaining, isInvalid } = computeSchengenDaysRemaining(allTrips);
      setSchengenDaysRemaining(daysRemaining);
      setSchengenIsInvalid(isInvalid);
    }
  }, [trips, childTrips, enableSchengenCalculations]);

  const onRefresh = () => {
    lastClickedTripIdRef.current = null;
    hasLoadedOnceRef.current = false;
    loadTrips(true);
  };

  const handleTripPress = (tripId: string, parentTripId?: string) => {
    // Save the parent trip ID for scroll restoration (or the trip ID itself if it's a parent)
    const scrollToTripId = parentTripId || tripId;
    console.log('Saving trip ID for scroll restoration:', scrollToTripId);
    lastClickedTripIdRef.current = scrollToTripId;
    router.push(`/trip/${tripId}`);
  };



  // Show loading skeleton only on initial load when we have no cached data
  if (authLoading || (loading && timelineItems.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader 
          title="YourTrips" 
          schengenDaysRemaining={enableSchengenCalculations === 'enable' ? schengenDaysRemaining : undefined} 
          schengenIsInvalid={enableSchengenCalculations === 'enable' ? schengenIsInvalid : undefined} 
        />
        <TimelineSkeletonLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader 
        title="YourTrips" 
        schengenDaysRemaining={enableSchengenCalculations === 'enable' ? schengenDaysRemaining : undefined} 
        schengenIsInvalid={enableSchengenCalculations === 'enable' ? schengenIsInvalid : undefined} 
      />

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
        <TripTimeline
          flatListRef={flatListRef}
          timelineItems={timelineItems}
          enableSchengenCalculations={enableSchengenCalculations}
          onTripPress={handleTripPress}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={loadMoreTrips}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.5,
              });
            }, 100);
          }}
          ListFooterComponent={() => <View style={styles.bottomPadding} />}
        />
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
    color: '#ddd',
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
    color: '#bbb',
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

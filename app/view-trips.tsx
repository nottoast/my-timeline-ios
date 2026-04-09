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
import { Ionicons } from '@expo/vector-icons';

interface TimelineItem {
  trip: Trip;
  children: Trip[];
}

export default function ViewTripsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [childTrips, setChildTrips] = useState<Trip[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [countries, setCountries] = useState<Map<string, Country>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
            fromCountryId: data.fromCountryId,
            fromCountryName: data.fromCountryName,
            toCountryId: data.toCountryId,
            toCountryName: data.toCountryName,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            parentTripId: data.parentTripId,
          } as Trip);
        });

        // Sort by startDate descending (newest first)
        fetchedTrips.sort((a, b) => {
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
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
            startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
            fromCountryId: data.fromCountryId,
            fromCountryName: data.fromCountryName,
            toCountryId: data.toCountryId,
            toCountryName: data.toCountryName,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            parentTripId: data.parentTripId,
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
  }, [user]);

  // Organize trips into timeline items whenever trips or childTrips change
  useEffect(() => {
    const items: TimelineItem[] = trips.map(parentTrip => {
      // Find all children for this parent
      const children = childTrips
        .filter(child => child.parentTripId === parentTrip.id)
        // Sort children by startDate descending (newest first)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      return {
        trip: parentTrip,
        children,
      };
    });

    setTimelineItems(items);
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

  const renderChildTrip = (child: Trip, isLast: boolean, isLastOverall: boolean, isOnlyChild: boolean, totalChildren: number) => (
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
      <View style={styles.childTripCard}>
        <Text style={styles.childTripName}>{child.fromCountryName} → {child.toCountryName}</Text>
        <Text style={styles.childTripDate}>{formatDate(child.startDate)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderOutboundTrip = (trip: Trip, isLast: boolean, hasChildren: boolean, totalChildren: number) => (
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
      <View style={styles.childTripCard}>
        <Text style={styles.childTripName}>{trip.fromCountryName} → {trip.toCountryName}</Text>
        <Text style={styles.childTripDate}>{formatDate(trip.startDate)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTimelineItem = (item: TimelineItem, index: number) => {
    const isLast = index === timelineItems.length - 1;
    const isFirst = index === 0;
    const hasChildren = item.children.length > 0;
    const totalChildren = 1 + item.children.length; // 1 outbound + actual children

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
                top: isFirst ? 0 : -100,
                bottom: isLast ? 0 : -100 
              }
            ]} />
            <View style={styles.timelineCircle} />
          </View>
          <View style={styles.tripCard}>
            <Text style={styles.tripName}>{item.trip.name}</Text>
            <Text style={styles.tripDate}>{formatParentDate(item.trip.startDate)}</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Timeline" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Timeline" />

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
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  childTripContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingLeft: 60,
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
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    zIndex: 1,
  },
  childTimelineCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#666',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    zIndex: 1,
  },
  tripCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: '#333',
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
    marginLeft: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
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

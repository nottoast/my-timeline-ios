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
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Trip, Country } from '@/types';

export default function ViewTripsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [countries, setCountries] = useState<Map<string, Country>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch countries once on mount
  useEffect(() => {
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

    fetchCountries();
  }, []);

  const fetchTrips = async () => {
    if (!user) {
      console.log('No user found, skipping fetch');
      setError('No user logged in');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    try {
      console.log('Fetching trips for user:', user.uid);
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('userId', '==', user.uid),
        where('tripType', '==', 'PARENT')
      );

      const querySnapshot = await getDocs(q);
      const fetchedTrips: Trip[] = [];

      querySnapshot.forEach((doc) => {
        console.log('Found trip:', doc.id, doc.data());
        const data = doc.data();
        
        // Convert Firestore Timestamps to ISO strings
        fetchedTrips.push({
          id: doc.id,
          userId: data.userId,
          tripType: data.tripType,
          name: data.name,
          startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
          fromCountryId: data.fromCountryId,
          toCountryId: data.toCountryId,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          parentTripId: data.parentTripId,
        } as Trip);
      });

      // Sort by startDate descending (most recent first)
      fetchedTrips.sort((a, b) => {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });

      console.log('Total trips fetched:', fetchedTrips.length);
      setTrips(fetchedTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        setError(error.message);
      } else {
        setError('Failed to fetch trips');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCountryName = (countryId: string) => {
    const country = countries.get(countryId);
    return country ? country.name : 'Unknown';
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripName}>{item.name || 'Unnamed Trip'}</Text>
      </View>
      <View style={styles.tripDetails}>
        <Text style={styles.tripDate}>📅 {formatDate(item.startDate)}</Text>
      </View>
      <View style={styles.tripCountries}>
        <Text style={styles.tripCountryText}>
          {getCountryName(item.fromCountryId)} → {getCountryName(item.toCountryId)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Trips</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
      </View>

      {user && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>User ID: {user.uid.substring(0, 12)}...</Text>
          <Text style={styles.debugText}>Trips loaded: {trips.length}</Text>
        </View>
      )}

      {trips.length === 0 ? (
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
                Start planning your first trip by adding one!
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/add-trip')}
              >
                <Text style={styles.addButtonText}>Add Trip</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  debugInfo: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
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
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  tripHeader: {
    marginBottom: 12,
  },
  tripName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripDate: {
    fontSize: 14,
    color: '#999',
  },
  tripCountries: {
    marginTop: 4,
  },
  tripCountryText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  tripType: {
    fontSize: 14,
    color: '#999',
  },
});

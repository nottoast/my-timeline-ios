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
import CustomHeader from '@/components/CustomHeader';
import { Ionicons } from '@expo/vector-icons';

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
          fromCountryName: data.fromCountryName,
          toCountryId: data.toCountryId,
          toCountryName: data.toCountryName,
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
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => router.push(`/trip/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <Text style={styles.tripName}>{item.name || 'Unnamed Trip'}</Text>
      </View>
      <View style={styles.tripDetails}>
        <Text style={styles.tripDate}>📅 {formatDate(item.startDate)}</Text>
      </View>
      <View style={styles.tripCountries}>
        <Text style={styles.tripCountryText}>
          {item.fromCountryName} → {item.toCountryName}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
                Tap the + button below to add your first trip!
              </Text>
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
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding for FAB
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

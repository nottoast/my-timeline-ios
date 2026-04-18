import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useCountries } from '@/contexts/CountriesContext';
import { Trip } from '@/types';
import EUPill from '@/components/EUPill';

export interface TimelineItem {
  trip: Trip;
  children: Trip[];
}

interface TripTimelineProps {
  timelineItems: TimelineItem[];
  enableSchengenCalculations?: 'enable' | 'disable';
  onTripPress?: (tripId: string, parentTripId?: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  flatListRef?: React.RefObject<FlatList | null>;
  onScrollToIndexFailed?: (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => void;
  ListFooterComponent?: React.ComponentType | (() => React.ReactElement | null) | React.ReactElement | null;
  scrollEnabled?: boolean;
}

export default function TripTimeline({
  timelineItems,
  enableSchengenCalculations = 'disable',
  onTripPress,
  refreshing,
  onRefresh,
  onEndReached,
  flatListRef,
  onScrollToIndexFailed,
  ListFooterComponent,
  scrollEnabled = true,
}: TripTimelineProps) {
  const { getCountryName } = useCountries();

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

  const isTripInFuture = (tripDate: string) => {
    return new Date(tripDate) > new Date();
  };

  const handleTripPress = (tripId: string, parentTripId?: string) => {
    if (onTripPress) {
      onTripPress(tripId, parentTripId);
    }
  };

  const renderChildTrip = (
    child: Trip,
    isLast: boolean,
    _isLastOverall: boolean,
    _isOnlyChild: boolean,
    totalChildren: number,
    parentTripId: string,
  ) => {
    const isInFuture = isTripInFuture(child.tripDate);
    return (
      <TouchableOpacity
        key={child.id}
        style={styles.childTripContainer}
        onPress={() => handleTripPress(child.id, parentTripId)}
        activeOpacity={onTripPress ? 0.7 : 1}
        disabled={!onTripPress}
      >
        <View style={styles.timelineColumn}>
          <View
            style={[
              styles.childTimelineLine,
              totalChildren > 1
                ? {
                    top: -50,
                    bottom: isLast ? 0 : -50,
                  }
                : {},
            ]}
          />
          <View style={styles.childTimelineCircle} />
        </View>
        <View style={isInFuture ? styles.childTripCardFuture : styles.childTripCard}>
          <View style={styles.tripRouteContainer}>
            <Text style={styles.routeCountry}>{getCountryName(child.fromCountryId)}</Text>
            {enableSchengenCalculations === 'enable' && child.tripVisaStatus === 'LEFT_SCHENGEN' && (
              <EUPill prefix="←" style={styles.pillInline} />
            )}
            <Text style={styles.routeArrow}> → </Text>
            <Text style={styles.routeCountry}>{getCountryName(child.toCountryId)}</Text>
            {enableSchengenCalculations === 'enable' && child.tripVisaStatus === 'ENTERED_SCHENGEN' && (
              <EUPill prefix="→" style={styles.pillInline} />
            )}
          </View>
          <Text style={styles.childTripDate}>{formatDate(child.tripDate)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOutboundTrip = (
    trip: Trip,
    _isLast: boolean,
    _hasChildren: boolean,
    totalChildren: number,
    parentTripId: string,
  ) => {
    const isInFuture = isTripInFuture(trip.tripDate);
    return (
      <TouchableOpacity
        key={`${trip.id}-outbound`}
        style={styles.childTripContainer}
        onPress={() => handleTripPress(trip.id, parentTripId)}
        activeOpacity={onTripPress ? 0.7 : 1}
        disabled={!onTripPress}
      >
        <View style={styles.timelineColumn}>
          <View
            style={[
              styles.childTimelineLine,
              totalChildren > 1
                ? {
                    top: 0,
                    bottom: -50,
                  }
                : {},
            ]}
          />
          <View style={styles.childTimelineCircle} />
        </View>
        <View style={isInFuture ? styles.childTripCardFuture : styles.childTripCard}>
          <View style={styles.tripRouteContainer}>
            <Text style={styles.routeCountry}>{getCountryName(trip.fromCountryId)}</Text>
            {enableSchengenCalculations === 'enable' && trip.tripVisaStatus === 'LEFT_SCHENGEN' && (
              <EUPill prefix="←" style={styles.pillInline} />
            )}
            <Text style={styles.routeArrow}> → </Text>
            <Text style={styles.routeCountry}>{getCountryName(trip.toCountryId)}</Text>
            {enableSchengenCalculations === 'enable' && trip.tripVisaStatus === 'ENTERED_SCHENGEN' && (
              <EUPill prefix="→" style={styles.pillInline} />
            )}
          </View>
          <Text style={styles.childTripDate}>{formatDate(trip.tripDate)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimelineItem = ({ item, index }: { item: TimelineItem; index: number }) => {
    const isLast = index === timelineItems.length - 1;
    const hasChildren = item.children.length > 0;
    const totalChildren = 1 + item.children.length;
    const isInFuture = isTripInFuture(item.trip.tripDate);

    const childTripHeight = 105;
    const lineExtension = isLast ? 0 : totalChildren * childTripHeight;

    return (
      <View key={item.trip.id} style={styles.timelineItemContainer}>
        <TouchableOpacity
          style={styles.parentTripContainer}
          onPress={() => handleTripPress(item.trip.id)}
          activeOpacity={onTripPress ? 0.7 : 1}
          disabled={!onTripPress}
        >
          <View style={styles.timelineColumn}>
            <View
              style={[
                styles.timelineLine,
                {
                  top: 0,
                  bottom: -lineExtension,
                },
              ]}
            />
            <View style={styles.timelineCircle} />
          </View>
          <View style={isInFuture ? styles.tripCardFuture : styles.tripCard}>
            <Text style={styles.tripName}>{item.trip.name}</Text>
            <Text style={styles.tripDate}>{formatParentDate(item.trip.tripDate)}</Text>
          </View>
        </TouchableOpacity>

        {renderOutboundTrip(item.trip, isLast, hasChildren, totalChildren, item.trip.id)}

        {item.children.map((child, childIndex) =>
          renderChildTrip(
            child,
            childIndex === item.children.length - 1,
            isLast,
            totalChildren === 1,
            totalChildren,
            item.trip.id,
          ),
        )}
      </View>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={timelineItems}
      keyExtractor={(item) => item.trip.id}
      renderItem={renderTimelineItem}
      contentContainerStyle={styles.scrollContent}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      scrollEnabled={scrollEnabled}
      onScrollToIndexFailed={onScrollToIndexFailed}
      ListFooterComponent={ListFooterComponent}
    />
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 20,
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
});

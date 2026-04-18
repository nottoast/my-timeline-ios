import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const TimelineSkeletonLoader = () => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBox = ({ style }: { style?: any }) => (
    <Animated.View style={[styles.skeleton, { opacity }, style]} />
  );

  const renderSkeletonTimelineItem = (key: number) => (
    <View key={key} style={styles.timelineItemContainer}>
      {/* Parent Trip Skeleton */}
      <View style={styles.parentTripContainer}>
        <View style={styles.tripCard}>
          <View style={styles.tripCardContent}>
            <SkeletonBox style={styles.tripNameSkeleton} />
            <SkeletonBox style={styles.tripDateSkeleton} />
          </View>
        </View>
      </View>

      {/* Outbound Trip Skeleton */}
      <View style={styles.childTripContainer}>
        <View style={styles.childTripCard}>
          <View style={styles.childTripCardContent}>
            <SkeletonBox style={styles.routeSkeleton} />
            <SkeletonBox style={styles.childDateSkeleton} />
          </View>
        </View>
      </View>

      {/* Child Trip Skeletons (1-2 per parent) */}
      {[...Array(key % 2 === 0 ? 1 : 2)].map((_, idx) => (
        <View key={idx} style={styles.childTripContainer}>
          <View style={styles.childTripCard}>
            <View style={styles.childTripCardContent}>
              <SkeletonBox style={styles.routeSkeleton} />
              <SkeletonBox style={styles.childDateSkeleton} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {[0, 1, 2].map((key) => renderSkeletonTimelineItem(key))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
  },
  skeleton: {
    backgroundColor: '#333',
    borderRadius: 6,
  },
  timelineItemContainer: {
    marginBottom: 0,
  },
  parentTripContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  childTripContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingLeft: 12,
  },
  tripCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 60,
  },
  tripCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripNameSkeleton: {
    width: 120,
    height: 16,
  },
  tripDateSkeleton: {
    width: 80,
    height: 14,
  },
  childTripCard: {
    flex: 1,
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 50,
  },
  childTripCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeSkeleton: {
    width: 160,
    height: 14,
  },
  childDateSkeleton: {
    width: 70,
    height: 12,
  },
});

export default TimelineSkeletonLoader;

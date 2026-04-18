import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import EUPill from '@/components/EUPill';
import { FONTS, FONT_SIZES } from '@/constants/typography';

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  schengenDaysRemaining?: number;
  schengenIsInvalid?: boolean;
}

export default function CustomHeader({ title, showBackButton = false, onBackPress, schengenDaysRemaining, schengenIsInvalid = false }: CustomHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        <Text style={title === 'YourTrips' ? styles.titleBranded : styles.title}>{title}</Text>
      </View>
      
      <View style={styles.rightSection}>
        {schengenDaysRemaining !== undefined && (
          <View style={[styles.schengenBadge, schengenIsInvalid && styles.schengenBadgeInvalid]}>
            <Text style={styles.schengenDays}>{schengenDaysRemaining}</Text>
            <EUPill prefix={schengenDaysRemaining} />
          </View>
        )}

        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
        <View style={styles.profilePicture}>
          <Text style={styles.profileInitial}>
            {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONTS.weights.bold,
    color: '#ffffff',
  },
  titleBranded: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.title,
    color: '#ffffff',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  schengenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2c2c2c',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  schengenBadgeInvalid: {
    backgroundColor: '#b91c1c',
  },
  schengenDays: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  profileButton: {
    padding: 4,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

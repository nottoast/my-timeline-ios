import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type EUPillPrefix = '→' | '←' | number;

interface EUPillProps {
  /** Arrow direction or day count shown to the left of the badge */
  prefix: EUPillPrefix;
  style?: object;
}

/**
 * Small circular badge representing an EU/Schengen border crossing.
 * Renders 12 gold stars in a circle on EU-blue (#003399), matching the EU flag.
 *
 * prefix="→"  entry into Schengen
 * prefix="←"  exit from Schengen
 * prefix={14} number of days (future use)
 */

const BADGE_SIZE = 26;
const CENTER = BADGE_SIZE / 2;
const STAR_ORBIT_RADIUS = 7;
const STAR_COUNT = 12;
const STAR_FONT_SIZE = 4;

// 12 stars in a circle, starting from the top (−90°), matching the EU flag
const starPositions = Array.from({ length: STAR_COUNT }, (_, i) => {
  const angle = ((i * 360) / STAR_COUNT - 90) * (Math.PI / 180);
  return {
    left: CENTER + STAR_ORBIT_RADIUS * Math.cos(angle) - STAR_FONT_SIZE / 2,
    top: CENTER + STAR_ORBIT_RADIUS * Math.sin(angle) - STAR_FONT_SIZE / 2,
  };
});

export default function EUPill({ prefix, style }: EUPillProps) {
  const prefixLabel = typeof prefix === 'number' ? String(prefix).slice(0, 2) : prefix;

  return (
    <View style={[styles.wrapper, style]}>
      {/* Uncomment to show prefix: <Text style={styles.prefix}>{prefixLabel}</Text> */}
      <View style={styles.badge}>
        {starPositions.map((pos, i) => (
          <Text key={i} style={[styles.star, { left: pos.left, top: pos.top }]}>
            ★
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: '#003399',
    position: 'relative',
  },
  prefix: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  star: {
    position: 'absolute',
    color: '#FFDD00',
    fontSize: STAR_FONT_SIZE,
    lineHeight: STAR_FONT_SIZE + 1,
  },
});

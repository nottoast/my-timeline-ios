/**
 * Shared Schengen zone utilities — used by both the app and Firebase functions.
 */

import { Trip } from '../types';

/**
 * Returns the start of the current 180-day Schengen rolling window.
 * The window is: today - 180 days + 1 day (inclusive of both endpoints).
 *
 * Example: if today is 9 April 2026, the window starts on 12 October 2025.
 */
export function getSchengenStartWindow(today: Date = new Date()): Date {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 180 + 1);
  return start;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function normaliseDate(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

/**
 * Computes how many Schengen days remain (out of 90) in the rolling 180-day
 * window, given a list of all the user's trips.
 *
 * Rules:
 * - Pairs ENTERED_SCHENGEN → LEFT_SCHENGEN trips chronologically.
 * - If entry falls before the window start, clamps to window start.
 * - If exit is in the future, counts those days (planned travel).
 * - An unmatched ENTERED (never left) counts to today and is flagged invalid.
 * - isInvalid is also true when daysRemaining ≤ 0.
 */
export function computeSchengenDaysRemaining(
  trips: Trip[],
  today: Date = new Date()
): { daysRemaining: number; isInvalid: boolean } {
  const todayNorm = normaliseDate(today);
  const windowStart = getSchengenStartWindow(todayNorm);

  // Work only with trips that have a Schengen visa status, sorted chronologically
  const relevant = trips
    .filter(t => t.tripVisaStatus === 'ENTERED_SCHENGEN' || t.tripVisaStatus === 'LEFT_SCHENGEN')
    .sort((a, b) => new Date(a.tripDate).getTime() - new Date(b.tripDate).getTime());

  let isInvalid = false;
  let daysUsed = 0;
  let entryDate: Date | null = null; // null = currently outside Schengen

  for (const trip of relevant) {
    const tripDate = normaliseDate(new Date(trip.tripDate));

    if (trip.tripVisaStatus === 'ENTERED_SCHENGEN') {
      if (entryDate !== null) {
        // Double entry without an exit — close the previous stay and mark invalid
        isInvalid = true;
        daysUsed += daysInWindow(entryDate, tripDate, windowStart);
      }
      entryDate = tripDate;
    } else {
      // LEFT_SCHENGEN
      const exitDate = tripDate;
      const effectiveEntry = entryDate !== null ? entryDate : windowStart; // entered before tracking
      daysUsed += daysInWindow(effectiveEntry, exitDate, windowStart);
      entryDate = null;
    }
  }

  // Still inside Schengen with no recorded exit
  if (entryDate !== null) {
    isInvalid = true;
    daysUsed += daysInWindow(entryDate, todayNorm, windowStart);
  }

  const daysRemaining = 90 - daysUsed;
  if (daysRemaining <= 0) isInvalid = true;

  return { daysRemaining, isInvalid };
}

/**
 * Counts the number of days a stay (entry → exit, inclusive) overlaps with
 * the Schengen window [windowStart, ∞). Exit may be in the future.
 */
function daysInWindow(entry: Date, exit: Date, windowStart: Date): number {
  if (exit < windowStart) return 0; // stay ended before window — doesn't count
  const effectiveEntry = entry < windowStart ? windowStart : entry;
  const days = Math.floor((exit.getTime() - effectiveEntry.getTime()) / MS_PER_DAY) + 1;
  return Math.max(0, days);
}

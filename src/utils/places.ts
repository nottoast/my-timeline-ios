import { Airport, formatAirportLabel } from '@/utils/airports';
import { TripPlace } from '@/types';

export function getPlaceDisplayName(place?: TripPlace | string | null): string {
  if (!place) return '';
  if (typeof place === 'string') return place;
  return place.name || place.address || '';
}

export function createManualPlace(name: string, type: TripPlace['type']): TripPlace | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;

  return {
    type,
    name: trimmed,
    source: 'manual',
  };
}

export function createAirportPlace(airport: Airport): TripPlace {
  return {
    type: 'AIRPORT',
    name: formatAirportLabel(airport),
    city: airport.city,
    source: 'airport_seed',
  };
}

export function normalizeTripPlace(value: unknown, type: TripPlace['type']): TripPlace | undefined {
  if (!value) return undefined;

  if (typeof value === 'string') {
    return createManualPlace(value, type);
  }

  if (typeof value === 'object') {
    const place = value as Partial<TripPlace>;
    if (typeof place.name === 'string' && place.name.trim()) {
      return {
        ...place,
        type: place.type || type,
        name: place.name.trim(),
      } as TripPlace;
    }
  }

  return undefined;
}

import { Trip, TripPlace } from '@/types';

function getGooglePlaceLocality(place?: TripPlace): string | undefined {
  const addressComponents = place?.googlePlace?.addressComponents;

  if (!Array.isArray(addressComponents)) return undefined;

  const locality = addressComponents.find((component) => {
    if (!component || typeof component !== 'object') return false;

    const types = (component as { types?: unknown }).types;
    return Array.isArray(types) && types.includes('locality');
  });

  if (!locality || typeof locality !== 'object') return undefined;

  const { longText, shortText } = locality as { longText?: unknown; shortText?: unknown };
  if (typeof longText === 'string' && longText.trim()) return longText.trim();
  if (typeof shortText === 'string' && shortText.trim()) return shortText.trim();

  return undefined;
}

function getTripPlaceCity(place?: TripPlace): string | undefined {
  return place?.city?.trim() || getGooglePlaceLocality(place);
}

export function getTripRouteDisplayNames(
  trip: Trip,
  getCountryName: (countryId: string) => string,
) {
  const isDomesticTrip = trip.fromCountryId === trip.toCountryId;
  const fromPlaceCity = getTripPlaceCity(trip.placeFrom);
  const toPlaceCity = getTripPlaceCity(trip.placeTo);

  return {
    from: isDomesticTrip && fromPlaceCity
      ? fromPlaceCity
      : getCountryName(trip.fromCountryId),
    to: isDomesticTrip && toPlaceCity
      ? toPlaceCity
      : getCountryName(trip.toCountryId),
  };
}

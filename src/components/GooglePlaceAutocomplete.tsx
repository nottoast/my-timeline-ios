import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { TripPlace } from '@/types';

let WebPortal: React.FC<{ children: React.ReactNode }> | null = null;
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createPortal } = require('react-dom') as typeof import('react-dom');
  WebPortal = ({ children }) =>
    createPortal(children, document.body) as React.ReactElement;
}

interface PlacePrediction {
  placeId: string;
  text: string;
  secondaryText?: string;
}

interface GooglePlaceAutocompleteProps {
  value?: TripPlace;
  onChangePlace: (place?: TripPlace) => void;
  countryId?: string;
  placeType?: TripPlace['type'];
  includedPrimaryTypes?: string[];
  placeholder?: string;
  disabled?: boolean;
}

const placesApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
  Constants.expoConfig?.extra?.googlePlacesApiKey;
const placesDebugContext = {
  hasPlacesApiKey: !!placesApiKey,
  platform: Platform.OS,
  configSources: {
    hasExpoPublicPlacesKey: !!process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
    hasExpoConfigPlacesKey: !!Constants.expoConfig?.extra?.googlePlacesApiKey,
  },
};

async function getGooglePlacesError(response: Response) {
  try {
    return await response.json();
  } catch {
    return { message: await response.text() };
  }
}

const browserAutocompleteProps = Platform.OS === 'web'
  ? ({
      autoComplete: 'new-password',
      importantForAutofill: 'no',
      textContentType: 'none',
      spellCheck: false,
    } as const)
  : ({
      autoComplete: 'off',
      importantForAutofill: 'no',
      textContentType: 'none',
    } as const);

function createSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toTripPlace(details: any, fallbackName: string, placeType: TripPlace['type']): TripPlace {
  return {
    type: placeType,
    name: details.displayName?.text || fallbackName,
    address: details.formattedAddress || details.shortFormattedAddress,
    googlePlaceId: details.id,
    googleMapsUri: details.googleMapsUri,
    location: details.location
      ? {
          latitude: details.location.latitude,
          longitude: details.location.longitude,
        }
      : undefined,
    googlePlace: details,
    source: 'GOOGLE',
  };
}

export default function GooglePlaceAutocomplete({
  value,
  onChangePlace,
  countryId,
  placeType = 'PLACE',
  includedPrimaryTypes,
  placeholder = 'Start typing a place...',
  disabled = false,
}: GooglePlaceAutocompleteProps) {
  const [searchText, setSearchText] = useState(value?.name || '');
  const [isFocused, setIsFocused] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sessionToken, setSessionToken] = useState(createSessionToken);
  const containerRef = useRef<View>(null);
  const [dropdownMetrics, setDropdownMetrics] = useState<{ top: number; left: number; width: number } | null>(null);
  const justSelectedRef = useRef(false);
  const includedPrimaryTypesKey = includedPrimaryTypes?.join('|') || '';

  useEffect(() => {
    if (!isFocused) {
      setSearchText(value?.name || '');
    }
  }, [value, isFocused]);

  useEffect(() => {
    if (!placesApiKey) {
      if (isFocused && searchText.trim().length >= 2) {
        console.warn('Google Places search skipped: missing GOOGLE_PLACES_API_KEY in Expo config.', placesDebugContext);
      }
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    if (!isFocused || !searchText.trim() || searchText.trim().length < 2) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);

      try {
        const searchIncludedPrimaryTypes = includedPrimaryTypesKey
          ? includedPrimaryTypesKey.split('|')
          : undefined;
        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': placesApiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
          },
          body: JSON.stringify({
            input: searchText,
            sessionToken,
            ...(countryId && { includedRegionCodes: [countryId] }),
            ...(searchIncludedPrimaryTypes && { includedPrimaryTypes: searchIncludedPrimaryTypes }),
          }),
        });

        if (!response.ok) {
          const errorBody = await getGooglePlacesError(response);
          console.error('Google Places autocomplete request failed.', {
            status: response.status,
            statusText: response.statusText,
            errorBody,
            countryId,
            inputLength: searchText.length,
            ...placesDebugContext,
          });
          throw new Error(`Places autocomplete failed: ${response.status}`);
        }

        const data = await response.json();
        const nextPredictions = (data.suggestions || [])
          .map((suggestion: any) => suggestion.placePrediction)
          .filter(Boolean)
          .map((prediction: any) => ({
            placeId: prediction.placeId,
            text: prediction.text?.text || '',
            secondaryText: prediction.structuredFormat?.secondaryText?.text,
          }))
          .filter((prediction: PlacePrediction) => prediction.placeId && prediction.text)
          .slice(0, 6);

        setPredictions(nextPredictions);
      } catch (error) {
        console.error('Error searching Google Places:', {
          error,
          countryId,
          inputLength: searchText.length,
          ...placesDebugContext,
        });
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [countryId, includedPrimaryTypesKey, isFocused, searchText, sessionToken]);

  const handleFocus = () => {
    setIsFocused(true);
    setSessionToken(createSessionToken());
    if (Platform.OS === 'web') {
      containerRef.current?.measureInWindow((x, y, width, height) => {
        setDropdownMetrics({ top: y + height + 4, left: x, width });
      });
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }

      setIsFocused(false);
      setPredictions([]);
      const trimmed = searchText.trim();
      onChangePlace(trimmed ? { type: placeType, name: trimmed, source: 'MANUAL' } : undefined);
    }, 200);
  };

  const handleChangeText = (text: string) => {
    setSearchText(text);
    onChangePlace(text.trim() ? { type: placeType, name: text, source: 'MANUAL' } : undefined);
  };

  const handleSelect = async (prediction: PlacePrediction) => {
    justSelectedRef.current = true;
    setSearchText(prediction.text);
    setPredictions([]);
    setIsFocused(false);

    if (!placesApiKey) {
      onChangePlace({ type: placeType, name: prediction.text, source: 'MANUAL' });
      return;
    }

    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${prediction.placeId}`, {
        headers: {
          'X-Goog-Api-Key': placesApiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,shortFormattedAddress,location,googleMapsUri,types,addressComponents',
        },
      });

      if (!response.ok) {
        const errorBody = await getGooglePlacesError(response);
        console.error('Google Place details request failed.', {
          status: response.status,
          statusText: response.statusText,
          errorBody,
          placeId: prediction.placeId,
          ...placesDebugContext,
        });
        throw new Error(`Place details failed: ${response.status}`);
      }

      const details = await response.json();
      onChangePlace(toTripPlace(details, prediction.text, placeType));
    } catch (error) {
      console.error('Error loading Google Place details:', {
        error,
        placeId: prediction.placeId,
        ...placesDebugContext,
      });
      onChangePlace({ type: placeType, name: prediction.text, googlePlaceId: prediction.placeId, source: 'MANUAL' });
    }
  };

  const dropdownItems = predictions.map((prediction, index) => (
    <TouchableOpacity
      key={prediction.placeId}
      style={[
        styles.dropdownItem,
        index === predictions.length - 1 && styles.dropdownItemLast,
      ]}
      onPress={() => handleSelect(prediction)}
    >
      <Text style={styles.dropdownItemText}>{prediction.text}</Text>
      {!!prediction.secondaryText && (
        <Text style={styles.dropdownItemSubText}>{prediction.secondaryText}</Text>
      )}
    </TouchableOpacity>
  ));

  const dropdownContent = (
    <View style={styles.dropdown}>
      <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
        {dropdownItems}
      </ScrollView>
    </View>
  );

  return (
    <View ref={containerRef} style={styles.container}>
      <View>
        <TextInput
          style={[
            styles.input,
            disabled && styles.inputDisabled,
            isFocused && styles.inputFocused,
          ]}
          value={searchText}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#666"
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="words"
          {...browserAutocompleteProps}
        />
        {isSearching && (
          <ActivityIndicator style={styles.searchIndicator} size="small" color="#888" />
        )}
      </View>

      {isFocused && predictions.length > 0 && (
        Platform.OS === 'web' && WebPortal ? (
          <WebPortal>
            {dropdownMetrics && (
              <View
                style={{
                  // @ts-ignore - fixed is valid CSS for web
                  position: 'fixed',
                  top: dropdownMetrics.top,
                  left: dropdownMetrics.left,
                  width: dropdownMetrics.width,
                  zIndex: 9999,
                }}
              >
                {dropdownContent}
              </View>
            )}
          </WebPortal>
        ) : (
          dropdownContent
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    paddingRight: 42,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    zIndex: 1000,
  },
  inputFocused: {
    borderColor: '#007AFF',
    zIndex: 1001,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  searchIndicator: {
    position: 'absolute',
    right: 14,
    top: 16,
  },
  dropdown: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    maxHeight: 280,
    overflow: 'hidden',
    zIndex: 9999,
    ...Platform.select({
      ios: {
        position: 'absolute',
        top: '100%' as unknown as number,
        left: 0,
        right: 0,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        position: 'absolute',
        top: '100%' as unknown as number,
        left: 0,
        right: 0,
        marginTop: 4,
        elevation: 8,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownItemSubText: {
    color: '#888',
    fontSize: 13,
    marginTop: 3,
  },
});

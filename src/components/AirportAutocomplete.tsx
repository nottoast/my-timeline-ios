import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Airport, formatAirportLabel } from '@/utils/airports';

let WebPortal: React.FC<{ children: React.ReactNode }> | null = null;
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createPortal } = require('react-dom') as typeof import('react-dom');
  WebPortal = ({ children }) =>
    createPortal(children, document.body) as React.ReactElement;
}

interface AirportAutocompleteProps {
  airports: Airport[];
  value: string;
  onChangeText: (value: string) => void;
  onSelectAirport?: (airport: Airport) => void;
  countryId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function AirportAutocomplete({
  airports,
  value,
  onChangeText,
  onSelectAirport,
  countryId,
  placeholder = 'Start typing airport name or code...',
  disabled = false,
}: AirportAutocompleteProps) {
  const [searchText, setSearchText] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([]);
  const containerRef = useRef<View>(null);
  const [dropdownMetrics, setDropdownMetrics] = useState<{ top: number; left: number; width: number } | null>(null);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    if (!isFocused) {
      setSearchText(value);
    }
  }, [value, isFocused]);

  useEffect(() => {
    if (!isFocused) {
      setFilteredAirports([]);
      return;
    }

    const preferredAirports = countryId
      ? airports.filter(airport => airport.countryId === countryId)
      : airports;
    const fallbackAirports = countryId
      ? airports.filter(airport => airport.countryId !== countryId)
      : [];
    const baseAirports = [...preferredAirports, ...fallbackAirports];

    if (!searchText.trim()) {
      setFilteredAirports(baseAirports.slice(0, 8));
      return;
    }

    const query = searchText.toLowerCase();
    const matches = baseAirports
      .filter(airport =>
        airport.name.toLowerCase().includes(query) ||
        airport.city.toLowerCase().includes(query) ||
        airport.iata.toLowerCase().includes(query)
      )
      .slice(0, 8);

    setFilteredAirports(matches);
  }, [airports, countryId, isFocused, searchText]);

  const handleFocus = () => {
    setIsFocused(true);
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
      setFilteredAirports([]);
      onChangeText(searchText.trim());
    }, 200);
  };

  const handleSelect = (airport: Airport) => {
    const label = formatAirportLabel(airport);
    justSelectedRef.current = true;
    setSearchText(label);
    setFilteredAirports([]);
    setIsFocused(false);
    onChangeText(label);
    onSelectAirport?.(airport);
  };

  const handleChangeText = (text: string) => {
    setSearchText(text);
    onChangeText(text);
  };

  const dropdownItems = filteredAirports.map((airport, index) => (
    <TouchableOpacity
      key={airport.id}
      style={[
        styles.dropdownItem,
        index === filteredAirports.length - 1 && styles.dropdownItemLast,
      ]}
      onPress={() => handleSelect(airport)}
    >
      <Text style={styles.dropdownItemText}>{formatAirportLabel(airport)}</Text>
      <Text style={styles.dropdownItemSubText}>{airport.city}</Text>
    </TouchableOpacity>
  ));

  return (
    <View ref={containerRef} style={styles.container}>
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
        autoComplete="off"
      />

      {isFocused && filteredAirports.length > 0 && (
        Platform.OS === 'web' && WebPortal ? (
          <WebPortal>
            {dropdownMetrics && (
              <View
                style={[
                  styles.dropdown,
                  {
                    // @ts-ignore - fixed is valid CSS for web
                    position: 'fixed',
                    top: dropdownMetrics.top,
                    left: dropdownMetrics.left,
                    width: dropdownMetrics.width,
                  },
                ]}
              >
                <ScrollView keyboardShouldPersistTaps="always">
                  {dropdownItems}
                </ScrollView>
              </View>
            )}
          </WebPortal>
        ) : (
          <View style={styles.dropdown}>
            <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
              {dropdownItems}
            </ScrollView>
          </View>
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

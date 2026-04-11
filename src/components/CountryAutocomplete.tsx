import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Country } from '@/types';

// Web-only: portal that renders children directly into document.body,
// escaping the ScrollView's overflow clipping without stealing focus.
let WebPortal: React.FC<{ children: React.ReactNode }> | null = null;
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createPortal } = require('react-dom') as typeof import('react-dom');
  WebPortal = ({ children }) =>
    createPortal(children, document.body) as React.ReactElement;
}

interface CountryAutocompleteProps {
  countries: Country[];
  value: string; // country ID
  onSelect: (countryId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  getCountryName: (countryId: string) => string;
}

export default function CountryAutocomplete({
  countries,
  value,
  onSelect,
  placeholder = 'Start typing country name...',
  disabled = false,
  getCountryName,
}: CountryAutocompleteProps) {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const containerRef = useRef<View>(null);
  const [dropdownMetrics, setDropdownMetrics] = useState<{ top: number; left: number; width: number } | null>(null);
  const justSelectedRef = useRef(false);

  // Update search text when value changes from outside (initial value or reset)
  useEffect(() => {
    if (value && !isFocused) {
      setSearchText(getCountryName(value));
    } else if (!value && !isFocused) {
      setSearchText('');
    }
  }, [value, getCountryName, isFocused]);

  // Filter countries as user types
  useEffect(() => {
    if (!isFocused) {
      setFilteredCountries([]);
      return;
    }

    // If search text is empty, show first 5 countries
    if (!searchText.trim()) {
      setFilteredCountries(countries.slice(0, 5));
      return;
    }

    const query = searchText.toLowerCase();
    const matches = countries
      .filter(country => 
        country.name.toLowerCase().includes(query) ||
        (country.shortName && country.shortName.toLowerCase().includes(query))
      )
      .slice(0, 5); // Limit to 5 results

    setFilteredCountries(matches);
  }, [searchText, countries, isFocused]);

  const handleSelect = (country: Country) => {
    justSelectedRef.current = true;
    setSearchText(country.name);
    setFilteredCountries([]);
    setIsFocused(false);
    onSelect(country.id);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Clear text on focus to make searching easier
    if (value) {
      setSearchText('');
    }
    // On web, measure the container position for Modal-based dropdown positioning
    if (Platform.OS === 'web') {
      containerRef.current?.measureInWindow((x, y, width, height) => {
        setDropdownMetrics({ top: y + height + 4, left: x, width });
      });
    }
  };

  const handleBlur = () => {
    // Delay to allow touch on dropdown to register
    setTimeout(() => {
      // If handleSelect already ran, skip the reset to avoid clearing the field
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      setIsFocused(false);
      // Restore the selected country name if user didn't select anything
      if (value) {
        setSearchText(getCountryName(value));
      } else {
        setSearchText('');
      }
    }, 200);
  };

  const handleChangeText = (text: string) => {
    setSearchText(text);
    // Clear selection when user starts typing
    if (value && text !== getCountryName(value)) {
      onSelect('');
    }
  };

  const dropdownItems = filteredCountries.map((item, index) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.dropdownItem,
        index === filteredCountries.length - 1 && styles.dropdownItemLast,
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item.name}</Text>
    </TouchableOpacity>
  ));

  return (
    <View ref={containerRef} style={styles.container} nativeID="country-autocomplete-container">
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
        nativeID="country-autocomplete-input"
      />

      {isFocused && filteredCountries.length > 0 && (
        Platform.OS === 'web' && WebPortal ? (
          <WebPortal>
            {dropdownMetrics && (
              <View
                style={[
                  styles.dropdown,
                  {
                    // @ts-ignore - 'fixed' is valid CSS but not in RN types
                    position: 'fixed',
                    top: dropdownMetrics.top,
                    left: dropdownMetrics.left,
                    width: dropdownMetrics.width,
                  },
                ]}
                nativeID="country-autocomplete-dropdown"
              >
                <ScrollView keyboardShouldPersistTaps="always">
                  {dropdownItems}
                </ScrollView>
              </View>
            )}
          </WebPortal>
        ) : (
          <View style={styles.dropdown} nativeID="country-autocomplete-dropdown">
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
    maxHeight: 250,
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
        elevation: 10,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

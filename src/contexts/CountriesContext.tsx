import React, { createContext, useContext, useMemo } from 'react';
import { Country } from '@/types';
import { getAllCountries } from '@/utils/countries';

interface CountriesContextType {
  countries: Country[];
  countriesMap: Map<string, Country>;
  loading: boolean;
  error: string | null;
  getCountryName: (countryId: string) => string;
  getCountryFullName: (countryId: string) => string;
}

const CountriesContext = createContext<CountriesContextType | undefined>(undefined);

export const CountriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get all countries from the utility function (no async needed)
  const countries = useMemo(() => {
    const allCountries = getAllCountries();
    // Sort countries alphabetically by name
    return allCountries.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const countriesMap = useMemo(() => {
    const map = new Map<string, Country>();
    countries.forEach(country => {
      map.set(country.id, country);
    });
    return map;
  }, [countries]);

  const getCountryName = (countryId: string): string => {
    const country = countriesMap.get(countryId);
    return country ? (country.shortName || country.name) : 'Unknown';
  };

  const getCountryFullName = (countryId: string): string => {
    const country = countriesMap.get(countryId);
    return country ? country.name : 'Unknown';
  };

  return (
    <CountriesContext.Provider value={{ 
      countries, 
      countriesMap, 
      loading: false, // No async loading needed
      error: null, 
      getCountryName, 
      getCountryFullName 
    }}>
      {children}
    </CountriesContext.Provider>
  );
};

export const useCountries = () => {
  const context = useContext(CountriesContext);
  if (context === undefined) {
    throw new Error('useCountries must be used within a CountriesProvider');
  }
  return context;
};

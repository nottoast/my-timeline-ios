import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Country } from '@/types';

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
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesMap, setCountriesMap] = useState<Map<string, Country>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        console.log('Fetching countries from Firestore...');
        const countriesRef = collection(db, 'countries');
        const querySnapshot = await getDocs(countriesRef);
        
        const fetchedCountries: Country[] = [];
        const map = new Map<string, Country>();
        
        querySnapshot.forEach((doc) => {
          const country = {
            id: doc.id,
            ...doc.data(),
          } as Country;
          fetchedCountries.push(country);
          map.set(doc.id, country);
        });
        
        // Sort countries alphabetically by name
        fetchedCountries.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Loaded ${fetchedCountries.length} countries`);
        setCountries(fetchedCountries);
        setCountriesMap(map);
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError(err instanceof Error ? err.message : 'Failed to load countries');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const getCountryName = (countryId: string): string => {
    const country = countriesMap.get(countryId);
    return country ? (country.shortName || country.name) : 'Unknown';
  };

  const getCountryFullName = (countryId: string): string => {
    const country = countriesMap.get(countryId);
    return country ? country.name : 'Unknown';
  };

  return (
    <CountriesContext.Provider value={{ countries, countriesMap, loading, error, getCountryName, getCountryFullName }}>
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

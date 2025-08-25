'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { reactLocalStorage } from 'reactjs-localstorage';

interface LocationData {
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

interface LocationContextType extends LocationData {
  setLocationData: (data: LocationData) => void;
}

const defaultValues: LocationData = {
  city: 'Hyderabad',
  country: 'India',
  lat: 17.385044,
  lng: 78.486671,
  timezone: 'Asia/Kolkata',
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData>(defaultValues);

  useEffect(() => {
    const saved = reactLocalStorage.getObject('LOCATION');
    if (
      saved &&
      typeof saved === 'object' &&
      'city' in saved &&
      'country' in saved &&
      'lat' in saved &&
      'lng' in saved &&
      'timezone' in saved
    ) {
      setLocation(saved as LocationData);
    }
  }, []);

  const setLocationData = (data: LocationData) => {
    setLocation(data);
    reactLocalStorage.setObject('LOCATION', data);
  };

  return (
    <LocationContext.Provider value={{ ...location, setLocationData }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

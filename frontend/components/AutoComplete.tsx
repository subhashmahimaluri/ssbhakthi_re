'use client';

import { useLocation } from '@/context/LocationContext';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import { reactLocalStorage } from 'reactjs-localstorage';

interface CityData {
  city: string;
  province: string;
  country: string;
  iso2: string;
  lat: number;
  lng: number;
  timezone: string;
}

interface Props {
  onLocationSelect?: (location: CityData) => void;
  selectedLocation?: CityData | null;
}

export default function AutoComplete({ onLocationSelect, selectedLocation }: Props) {
  const [items, setItems] = useState<CityData[]>([]);
  const [suggestions, setSuggestions] = useState<CityData[]>([]);
  const [city, setCity] = useState<string>('Hyderabad');
  const [geoData, setGeoData] = useState<CityData | null>(null);
  const [clearBtn, setClearBtn] = useState<boolean>(true);
  const { city: contextCity, setLocationData } = useLocation();

  useEffect(() => {
    const data = reactLocalStorage.getObject('LOCATION');
    if (!isEmpty(data)) {
      const localData = data as CityData;
      setCity(localData.city);
    } else {
      setCity(contextCity);
    }

    fetch('/cityMap.json')
      .then(res => res.json())
      .then((data: CityData[]) => {
        setItems(data);
      })
      .catch(() => {});
  }, [contextCity]);

  // Reset input when selectedLocation is cleared
  useEffect(() => {
    if (!selectedLocation) {
      setCity(contextCity);
      setSuggestions([]);
    }
  }, [selectedLocation, contextCity]);

  const onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    let filteredSuggestions: CityData[] = [];

    if (value.length > 0) {
      const regex = new RegExp(`^${value}`, 'i');
      filteredSuggestions = items.filter(item => regex.test(item.city)).slice(0, 5);
    }

    setSuggestions(filteredSuggestions);
    setClearBtn(true);
    setCity(value);
  };

  const setValues = (item: CityData) => {
    setSuggestions([]);
    setCity(item.city);
    // Don't update context directly, let parent handle it
    if (onLocationSelect) {
      onLocationSelect(item);
    }
  };

  const onClickClear = () => {
    setCity('');
    setClearBtn(false);
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0 || selectedLocation) return null;

    return (
      <div
        className="suggestions-container position-absolute w-100"
        style={{ zIndex: 1050, top: '100%' }}
      >
        <ul className="suggestions-list list-unstyled m-0 rounded border bg-white shadow-sm">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => setValues(item)}
              className="suggestion-item border-bottom cursor-pointer p-2"
            >
              <div className="d-flex align-items-center">
                <img
                  className="flag-icon me-2 rounded"
                  src={`https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/${item.iso2}.svg`}
                  alt="Flag"
                  width="20"
                  height="15"
                  style={{ objectFit: 'cover' }}
                />
                <div className="location-details flex-grow-1 min-width-0">
                  <div className="city-name fw-bold text-truncate text-black">{item.city}</div>
                  <small className="text-muted text-truncate d-block">
                    {item.province}, {item.country}
                  </small>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (items.length === 0) return null;

  return (
    <div className="autocomplete-container position-relative">
      <div className="input-wrapper position-relative">
        <input
          className="form-control search-input"
          id="location-search"
          type="text"
          autoComplete="off"
          placeholder="Type city name..."
          onClick={onClickClear}
          onChange={onTextChange}
          value={city}
          disabled={!!selectedLocation}
        />
        {clearBtn && city && !selectedLocation && (
          <button
            type="button"
            onClick={onClickClear}
            className="btn btn-link position-absolute clear-btn p-0"
            style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <i className="fas fa-times text-muted"></i>
          </button>
        )}
      </div>
      {renderSuggestions()}

      <style jsx>{`
        .autocomplete-container {
          font-family: inherit;
        }

        .search-input {
          font-size: 14px;
          border: 1px solid #ced4da;
          border-radius: 8px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }

        .search-input:focus:not(:disabled) {
          border-color: #007bff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .search-input:disabled {
          background-color: #e9ecef;
          opacity: 0.7;
        }

        .clear-btn {
          border: none;
          background: none;
          font-size: 12px;
          z-index: 10;
        }

        .clear-btn:hover {
          color: #007bff !important;
        }

        .suggestions-container {
          left: 0;
          right: 0;
        }

        .suggestions-list {
          max-height: 200px;
          overflow-y: auto;
          border-color: #ced4da;
        }

        .suggestion-item {
          transition: background-color 0.15s ease;
          cursor: pointer;
        }

        .suggestion-item:hover {
          background-color: #f8f9fa;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .city-name {
          font-size: 14px;
          color: #212529;
        }

        .flag-icon {
          flex-shrink: 0;
        }

        .location-details {
          overflow: hidden;
        }

        /* Mobile Responsive */
        @media (max-width: 576px) {
          .search-input {
            font-size: 16px; /* Prevents zoom on iOS */
            padding: 10px 12px;
          }

          .suggestions-list {
            max-height: 160px;
          }

          .suggestion-item {
            padding: 12px 8px;
          }

          .city-name {
            font-size: 13px;
          }
        }

        /* Custom scrollbar for suggestions */
        .suggestions-list::-webkit-scrollbar {
          width: 4px;
        }

        .suggestions-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .suggestions-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }

        .suggestions-list::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
}

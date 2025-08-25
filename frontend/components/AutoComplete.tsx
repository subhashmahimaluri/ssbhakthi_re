'use client';

import { useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import { reactLocalStorage } from 'reactjs-localstorage';
import { useLocation } from '@/context/LocationContext';

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
  btnTitle: string;
}

export default function AutoComplete() {
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
    setGeoData(item);
    setLocationData(item); // ✅ update context here
  };

  const onClickClear = () => {
    setCity('');
    setClearBtn(false);
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <ul className="w-100 border-gray border bg-white px-0">
        {suggestions.map((item, index) => (
          <li key={index} onClick={() => setValues(item)} className="list-unstyled list_item-ct">
            <div className="list_item_container ui-menu-item-wrapper">
              <img
                className="list_item_image"
                src={`https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/${item.iso2}.svg`}
                alt="Flag"
              />
              <strong>{item.city}</strong>
              <br />
              <small>
                {item.province}, {item.country}
              </small>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (items.length === 0) return null;

  return (
    <div className="w-100">
      <div className="form-clear-text-wrapper position-relative mb-3 px-0 py-2">
        <input
          className="w-100 search-input-pn px-2 py-2"
          id="query"
          type="text"
          autoComplete="off"
          onClick={onClickClear}
          onChange={onTextChange}
          value={city}
        />
        {renderSuggestions()}
        {clearBtn && (
          <i
            onClick={onClickClear}
            className="fa fa-times-circle icon-bold-remove color-secondary3"
          ></i>
        )}
      </div>
    </div>
  );
}

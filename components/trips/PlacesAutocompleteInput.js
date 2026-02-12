'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function PlacesAutocompleteInput({
  value,
  onChange,
  onPlaceSelect,
  tripDestination,
  placeholder,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loaded, setLoaded] = useState(false);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);
  const debounceTimer = useRef(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadApi = useCallback(async () => {
    if (loaded || !API_KEY) return;
    try {
      const { Loader } = await import('@googlemaps/js-api-loader');
      const loader = new Loader({ apiKey: API_KEY, libraries: ['places'] });
      const google = await loader.load();
      autocompleteService.current = new google.maps.places.AutocompleteService();
      placesService.current = new google.maps.places.PlacesService(
        document.createElement('div')
      );
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
      setLoaded(true);
    } catch {
      // Degrade silently — works as plain input
    }
  }, [loaded]);

  function fetchPredictions(input) {
    if (!autocompleteService.current || !input.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const request = {
      input,
      sessionToken: sessionToken.current,
    };

    if (tripDestination) {
      request.input = `${input} near ${tripDestination}`;
    }

    autocompleteService.current.getPlacePredictions(request, (results, status) => {
      if (status === 'OK' && results) {
        setSuggestions(results);
        setShowDropdown(true);
        setActiveIndex(-1);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    });
  }

  function handleInputChange(e) {
    const val = e.target.value;
    onChange(val);

    if (!API_KEY) return;

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(val);
    }, 300);
  }

  function handleSelect(prediction) {
    setShowDropdown(false);
    setSuggestions([]);

    onChange(prediction.structured_formatting?.main_text || prediction.description);

    if (placesService.current) {
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['name', 'formatted_address', 'geometry', 'place_id'],
          sessionToken: sessionToken.current,
        },
        (place, status) => {
          // Refresh session token after getDetails
          if (window.google) {
            sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
          }

          if (status === 'OK' && place) {
            onPlaceSelect({
              name: place.name,
              address: place.formatted_address,
              placeId: place.place_id,
              lat: place.geometry?.location?.lat(),
              lng: place.geometry?.location?.lng(),
            });
          }
        }
      );
    }
  }

  function handleKeyDown(e) {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  return (
    <div className="v-places-wrap" ref={wrapRef}>
      <input
        ref={inputRef}
        className="v-form-input"
        value={value}
        onChange={handleInputChange}
        onFocus={loadApi}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="v-places-dropdown">
          {suggestions.map((s, i) => (
            <div
              key={s.place_id}
              className={`v-places-option ${i === activeIndex ? 'v-places-option-active' : ''}`}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="v-places-option-main">
                {s.structured_formatting?.main_text}
              </span>
              <span className="v-places-option-secondary">
                {s.structured_formatting?.secondary_text}
              </span>
            </div>
          ))}
          <div className="v-places-attribution">
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
}

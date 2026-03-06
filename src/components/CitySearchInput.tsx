import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';
import { City } from 'country-state-city';

export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  countryCode: string;
}

interface CitySearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string, location?: LocationData) => void;
  disabled?: boolean;
}

export function CitySearchInput({ placeholder, value, onChange, disabled }: CitySearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length > 1) {
      // Search cities locally
      const allCities = City.getAllCities();
      const matches = allCities
        .filter((city) => city.name.toLowerCase().startsWith(inputValue.toLowerCase()))
        .slice(0, 5) // Limit to 5 suggestions
        .map((city) => ({
          name: `${city.name}, ${city.countryCode}`,
          lat: parseFloat(city.latitude || '0'),
          lng: parseFloat(city.longitude || '0'),
          countryCode: city.countryCode,
        }));
      
      setSuggestions(matches);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (suggestion: LocationData) => {
    onChange(suggestion.name, suggestion);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
        <Search className="w-4 h-4 text-gray-500" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-teal-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0f12]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${index}`}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
            >
              <MapPin className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-gray-200">{suggestion.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { flags } from "../utils/countryFlags";

interface CountrySearchProps {
  onCountrySelect: (countryName: string) => void;
}

const CountrySearch: React.FC<CountrySearchProps> = ({ onCountrySelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const countries = Object.entries(flags).map(
    ([country, flag]) => `${flag} ${country}`
  );

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = countries
        .filter((c) => c.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 10);
      setFilteredCountries(filtered);
      setIsOpen(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setFilteredCountries([]);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [searchTerm, countries]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleCountrySelect(filteredCountries[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleCountrySelect = (country: string) => {
    onCountrySelect(country);
    setSearchTerm(country);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a country..."
          className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />

        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && filteredCountries.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {filteredCountries.map((country, index) => (
            <button
              key={country}
              onClick={() => handleCountrySelect(country)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors text-white border-b border-gray-700 last:border-b-0 ${
                index === selectedIndex ? "bg-gray-700" : ""
              }`}
            >
              {country}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountrySearch;

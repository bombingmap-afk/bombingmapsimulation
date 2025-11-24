import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountrySearchProps {
  onCountrySelect: (countryName: string) => void;
}

const CountrySearch: React.FC<CountrySearchProps> = ({ onCountrySelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const complementCountries = [
    "American Samoa",
    "Andorra",
    "Ascension Island",
    "Bahrain",
    "Bermuda",
    "British Virgin Islands",
    "Cape Verde",
    "Cayman Islands",
    "Comoros",
    "Cook Islands",
    "Faroe Islands",
    "Gibraltar",
    "Guam",
    "Hong Kong",
    "Kiribati",
    "Liechtenstein",
    "Macau",
    "Marshall Islands",
    "Mauritius",
    "Micronesia",
    "Monaco",
    "Nauru",
    "Niue",
    "Northern Mariana Islands",
    "Palau",
    "Saint Helena",
    "Samoa",
    "San Marino",
    "Seychelles",
    "Singapore",
    "South Georgia",
    "Tonga",
    "Tristan da Cunha",
    "Turks and Caicos Islands",
    "Tuvalu",
    "Vatican City",
    "Barbados",
    "Saint Kitts and Nevis",
    "Grenada",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Dominica",
    "São Tomé and Príncipe",
  ];

  // Load countries from the same source as the map
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch(geoUrl);
        const worldData = await response.json();
        const countries = worldData.objects.countries.geometries
          .map((geo: any) => geo.properties.name)
          .filter((name: string) => name) // Remove undefined names
          .sort();
        setAvailableCountries([...countries, ...complementCountries]);
      } catch (error) {
        console.error("Error loading countries:", error);
        // Fallback to a basic list if loading fails
        setAvailableCountries([
          "United States",
          "Canada",
          "Mexico",
          "Brazil",
          "United Kingdom",
          "France",
          "Germany",
          "Italy",
          "Spain",
          "Russia",
          "China",
          "Japan",
          "Australia",
        ]);
      }
    };

    loadCountries();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = availableCountries
        .filter((country) =>
          country.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 8); // Limit to 8 results
      setFilteredCountries(filtered);
      setIsOpen(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setFilteredCountries([]);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [searchTerm, availableCountries]);

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
        if (selectedIndex >= 0 && selectedIndex < filteredCountries.length) {
          handleCountrySelect(filteredCountries[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleCountrySelect = (country: string) => {
    onCountrySelect(country);
    setSearchTerm("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setSearchTerm("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = availableCountries
        .filter((country) =>
          country.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5); // Limite à 5 résultats
      setFilteredCountries(filtered);
      setIsOpen(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setFilteredCountries([]);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [searchTerm, availableCountries]);

  return (
    <div ref={searchRef} className="relative max-w-md mx-auto">
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
          placeholder="Search for a country to bomb..."
          className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-600 rounded-lg
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-red-500 focus:border-transparent transition-all duration-200"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 
                       hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && filteredCountries.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 
                        rounded-lg shadow-xl max-h-64 overflow-y-auto"
        >
          {filteredCountries.map((country, index) => (
            <button
              key={country}
              onClick={() => handleCountrySelect(country)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors
                         ${index === selectedIndex ? "bg-gray-700" : ""}
                         ${index === 0 ? "rounded-t-lg" : ""}
                         ${
                           index === filteredCountries.length - 1
                             ? "rounded-b-lg"
                             : ""
                         }
                         text-white border-b border-gray-700 last:border-b-0`}
            >
              <div className="flex items-center justify-between">
                <span>{country}</span>
                <span className="text-xs text-gray-400">Click to bomb</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountrySearch;

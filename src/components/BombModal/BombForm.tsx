import { Bomb, Search, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { flags } from "../../utils/countryFlags";

interface BombFormProps {
  countryName: string;
  onBomb: (message: string, gifUrl?: string, source?: string) => void;
  onBack: () => void;
}

const Title: React.FC<{ countryName: string }> = ({ countryName }) => {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-4">
        <Bomb className="w-8 h-8 text-red-400 mr-3" />
        <h2 className="text-2xl font-bold text-white">Bomb {countryName}</h2>
      </div>
      <p className="text-gray-300">Leave your mark on this country</p>
    </div>
  );
};

const Message: React.FC<{
  message: string;
  messageError: string;
  handleMessageChange: (_: string) => void;
}> = ({ message, messageError, handleMessageChange }) => {
  return (
    <div>
      <label className="block text-white font-medium mb-2">
        Your Message ({message.length}/70) *
      </label>
      <textarea
        value={message}
        onChange={(e) => handleMessageChange(e.target.value)}
        placeholder="Leave a message (any illegal or harmful content will be removed)..."
        rows={4}
        className={`w-full py-3 px-4 bg-gray-700 text-white rounded-lg border resize-none
                      focus:ring-2 focus:ring-opacity-50 transition-colors
                      ${
                        messageError
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-600 focus:ring-red-500"
                      }`}
      />
      <p className="text-gray-400 text-sm mt-2">
        Messages promoting terrorism, pedophilia, or any other illegal or
        harmful activity will be moderated and removed.
      </p>
      {messageError && (
        <p className="text-red-400 text-sm mt-2">⚠️ {messageError}</p>
      )}
    </div>
  );
};

const GIF: React.FC<{
  gifUrl: string;
  gifError: string;
  setGifError: (_: string) => void;
  handleGifUrlChange: (_: string) => void;
  isValidGifUrl: (_: string) => boolean;
}> = ({ gifUrl, gifError, setGifError, handleGifUrlChange, isValidGifUrl }) => {
  return (
    <div>
      <label className="block text-white font-medium mb-2">
        Add a GIF{" "}
        <a
          href="https://giphy.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline text-sm ml-2"
        >
          (Find on Giphy)
        </a>
      </label>
      <input
        type="text"
        value={gifUrl}
        onChange={(e) => handleGifUrlChange(e.target.value)}
        placeholder="https://giphy.com/media/..."
        className={`w-full py-2 px-3 bg-gray-700 text-white rounded-lg border
            ${gifError ? "border-red-500" : "border-gray-600"}
            focus:ring-2 focus:ring-red-500`}
      />
      {gifError && <p className="text-red-400 text-sm mt-2">⚠️ {gifError}</p>}

      {gifUrl && isValidGifUrl(gifUrl) && !gifError && (
        <div className="mt-3 text-center">
          <p className="text-gray-400 text-sm mb-1">Preview:</p>
          <img
            src={gifUrl}
            alt="GIF preview"
            className="mx-auto rounded-lg max-h-40"
            onError={() => setGifError("This GIF link could not be loaded")}
          />
        </div>
      )}
    </div>
  );
};

const BombForm: React.FC<BombFormProps> = ({ countryName, onBomb, onBack }) => {
  const [message, setMessage] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [source, setSource] = useState("");
  const [messageError, setMessageError] = useState("");
  const [gifError, setGifError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const countries = Object.entries(flags).map(
    ([country, flag]) => `${flag} ${country}`
  );

  const isValidGifUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    const pattern = /(https?:\/\/)?(www\.)?giphy\.com\/[^\s]+/i;
    return pattern.test(url);
  };

  const handleMessageChange = (value: string) => {
    setMessage(value.slice(0, 70));
    if (messageError) setMessageError("");
  };

  const handleGifUrlChange = (value: string) => {
    setGifUrl(value);
    if (gifError) setGifError("");
  };

  const handleSourceChange = (value: string) => {
    setSource(value);
    setSearchTerm(value);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleBomb = () => {
    let hasError = false;
    if (!message.trim()) {
      setMessageError("Please enter a message before dropping your bomb.");
      hasError = true;
    }
    if (!isValidGifUrl(gifUrl)) {
      setGifError("The GIF link must come from giphy.com");
      hasError = true;
    }
    if (hasError) return;

    onBomb(message, gifUrl || undefined, source || undefined);
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = countries
        .filter((c) => c.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5);
      setFilteredCountries(filtered);
      setIsOpen(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setFilteredCountries([]);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
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
        if (selectedIndex >= 0)
          handleSourceChange(filteredCountries[selectedIndex]);
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      <Title countryName={countryName} />
      <Message
        message={message}
        messageError={messageError}
        handleMessageChange={handleMessageChange}
      />
      <GIF
        gifUrl={gifUrl}
        gifError={gifError}
        setGifError={setGifError}
        handleGifUrlChange={handleGifUrlChange}
        isValidGifUrl={isValidGifUrl}
      />
      <div ref={containerRef}>
        <label className="block text-white font-medium mb-2">
          Attacking Country
        </label>
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
            placeholder="Select attacking country..."
            className="w-full pl-10 pr-10 py-2 bg-gray-700 text-white rounded-lg border border-gray-600
                       focus:ring-2 focus:ring-red-500 focus:outline-none transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isOpen && filteredCountries.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredCountries.map((country, index) => (
                <button
                  key={country}
                  onClick={() => handleSourceChange(country)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors
                             ${index === selectedIndex ? "bg-gray-700" : ""}
                             ${index === 0 ? "rounded-t-lg" : ""}
                             ${
                               index === filteredCountries.length - 1
                                 ? "rounded-b-lg"
                                 : ""
                             }
                             text-white border-b border-gray-700 last:border-b-0`}
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg
                   transition-all duration-200"
        >
          Back
        </button>
        <button
          onClick={handleBomb}
          className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600
                   disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200
                   transform hover:scale-105 disabled:transform-none"
        >
          💣 Drop Bomb
        </button>
      </div>
    </div>
  );
};

export default BombForm;

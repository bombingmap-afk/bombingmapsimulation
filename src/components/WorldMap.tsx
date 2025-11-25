import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import React, { useState } from "react";

import BombModal from "./BombModal";
import CountrySearch from "./CountrySearch";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  userCanBomb: boolean;
  onBomb: (
    countryName: string,
    message: string,
    gifUrl?: string,
    source?: string
  ) => void;
  countryBombCounts: Map<string, number>;
  maxBombs: number;
}

const microStates = [
  { name: "American Samoa", coordinates: [-170.702, -14.2709] },
  { name: "Andorra", coordinates: [1.5211, 42.5078] },
  { name: "Ascension Island", coordinates: [-14.3599, -7.9467] },
  { name: "Bahrain", coordinates: [50.5577, 26.0667] },
  { name: "Bermuda", coordinates: [-64.7505, 32.3078] },
  { name: "British Virgin Islands", coordinates: [-64.639968, 18.420695] },
  { name: "Cape Verde", coordinates: [-23.0418, 16.5388] },
  { name: "Cayman Islands", coordinates: [-81.2546, 19.3133] },
  { name: "Comoros", coordinates: [43.8722, -11.6455] },
  { name: "Cook Islands", coordinates: [-159.7777, -21.2367] },
  { name: "Faroe Islands", coordinates: [-6.9118, 61.8926] },
  { name: "Gibraltar", coordinates: [-5.3454, 36.1408] },
  { name: "Guam", coordinates: [144.7937, 13.4443] },
  { name: "Hong Kong", coordinates: [114.1095, 22.3964] },
  { name: "Kiribati", coordinates: [173.0, 1.4167] },
  { name: "Liechtenstein", coordinates: [9.5554, 47.166] },
  { name: "Macau", coordinates: [113.5439, 22.1987] },
  { name: "Marshall Islands", coordinates: [171.1845, 7.1315] },
  { name: "Mauritius", coordinates: [57.5522, -20.3484] },
  { name: "Micronesia", coordinates: [150.5508, 7.4256] },
  { name: "Monaco", coordinates: [7.4246, 43.7384] },
  { name: "Nauru", coordinates: [166.9315, -0.5228] },
  { name: "Niue", coordinates: [-169.8672, -19.0544] },
  { name: "Northern Mariana Islands", coordinates: [145.6739, 15.0979] },
  { name: "Palau", coordinates: [134.5825, 7.515] },
  { name: "Saint Helena", coordinates: [-5.7089, -15.965] },
  { name: "Samoa", coordinates: [-172.1046, -13.759] },
  { name: "San Marino", coordinates: [12.4578, 43.9336] },
  { name: "Seychelles", coordinates: [55.491977, -4.679574] },
  { name: "Singapore", coordinates: [103.8198, 1.3521] },
  { name: "South Georgia", coordinates: [-36.5879, -54.4296] },
  { name: "Tonga", coordinates: [-175.1982, -21.179] },
  { name: "Tristan da Cunha", coordinates: [-12.3132, -37.1052] },
  { name: "Turks and Caicos Islands", coordinates: [-71.7979, 21.694] },
  { name: "Tuvalu", coordinates: [179.194, -7.1095] },
  { name: "Vatican City", coordinates: [12.4534, 41.9029] },
  { name: "Barbados", coordinates: [-59.543198, 13.193887] },
  { name: "Saint Kitts and Nevis", coordinates: [-62.754593, 17.363747] },
  { name: "Grenada", coordinates: [-61.670761, 12.104818] },
  { name: "Saint Lucia", coordinates: [-60.984302, 13.909444] },
  {
    name: "Saint Vincent and the Grenadines",
    coordinates: [-61.287228, 13.252778],
  },
  { name: "São Tomé and Príncipe", coordinates: [6.6131, 0.1864] },
  { name: "Dominica", coordinates: [-61.370976, 15.414999] },
];

const MemoGeography = React.memo(
  ({
    geo,
    countryName,
    getCountryFill,
    darkenColor,
    handleCountryClick,
    setHoveredCountry,
  }: {
    geo: any;
    countryName: string;
    getCountryFill: (name: string) => string;
    darkenColor: (hex: string, percent: number) => string;
    handleCountryClick: (name: string) => void;
    setHoveredCountry: React.Dispatch<React.SetStateAction<string | null>>;
  }) => {
    return (
      <Geography
        key={geo.rsmKey}
        geography={geo}
        onMouseEnter={() => setHoveredCountry(countryName)}
        onMouseLeave={() => setHoveredCountry(null)}
        onClick={() => handleCountryClick(countryName)}
        style={{
          default: {
            fill: getCountryFill(countryName),
            stroke: "#374151",
            strokeWidth: 0.5,
            outline: "none",
            cursor: "pointer",
          },
          hover: {
            fill: darkenColor(getCountryFill(countryName), 20),
            cursor: "pointer",
          },
          pressed: { outline: "none" },
        }}
      />
    );
  }
);

const WorldMap: React.FC<WorldMapProps> = ({
  userCanBomb,
  onBomb,
  countryBombCounts,
  maxBombs,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const handleCountryClick = (countryName: string) => {
    setSelectedCountry(countryName);
    setShowModal(true);
  };

  const handleBomb = async (
    message: string,
    gifUrl?: string,
    source?: string
  ) => {
    if (!selectedCountry) return;
    onBomb(selectedCountry, message, gifUrl, source);
    setShowModal(false);
    setSelectedCountry(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCountry(null);
  };

  const getCountryFill = (countryName: string): string => {
    const bombCount = countryBombCounts.get(countryName) || 0;
    const isHovered = hoveredCountry === countryName;

    if (isHovered) return "#3B82F6";

    const intensity = bombCount === 0 ? 0 : bombCount / maxBombs;

    const getSpectrumColor = (intensity: number) => {
      if (intensity === 0) return "#D1D5DB";

      let r, g, b;

      if (intensity <= 0.2) {
        const t = intensity / 0.2;
        r = Math.round(209 + (255 - 209) * t);
        g = Math.round(213 + (255 - 213) * t);
        b = Math.round(219 + (0 - 219) * t);
      } else if (intensity <= 0.4) {
        const t = (intensity - 0.2) / 0.2;
        r = 255;
        g = Math.round(255 + (165 - 255) * t);
        b = 0;
      } else if (intensity <= 0.6) {
        const t = (intensity - 0.4) / 0.2;
        r = 255;
        g = Math.round(165 + (0 - 165) * t);
        b = 0;
      } else if (intensity <= 0.8) {
        const t = (intensity - 0.6) / 0.2;
        r = Math.round(255 + (128 - 255) * t);
        g = 0;
        b = Math.round(0 + (128 - 0) * t);
      } else {
        const t = (intensity - 0.8) / 0.2;
        r = Math.round(128 + (0 - 128) * t);
        g = 0;
        b = Math.round(128 + (0 - 128) * t);
      }

      return `rgb(${r}, ${g}, ${b})`;
    };

    return getSpectrumColor(intensity);
  };

  const handleSearchSelect = (countryName: string) => {
    handleCountryClick(countryName);
  };

  function darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - (255 * percent) / 100);
    const g = Math.max(0, ((num >> 8) & 0x00ff) - (255 * percent) / 100);
    const b = Math.max(0, (num & 0x0000ff) - (255 * percent) / 100);
    return `rgb(${r}, ${g}, ${b})`;
  }

  return (
    <div className="relative">
      <div className="mb-6">
        <CountrySearch onCountrySelect={handleSearchSelect} />
      </div>

      <div className="text-center mb-4">
        <p className="text-gray-300 text-sm">
          Click on any country to bomb it or view its bombing history
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-6xl bg-blue-900 rounded-lg overflow-hidden border-2 border-gray-700">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 120, center: [0, 20] }}
          style={{ width: "100%", height: "500px" }}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  return (
                    <MemoGeography
                      key={geo.rsmKey}
                      geo={geo}
                      countryName={countryName}
                      getCountryFill={getCountryFill}
                      darkenColor={darkenColor}
                      handleCountryClick={handleCountryClick}
                      setHoveredCountry={setHoveredCountry}
                    />
                  );
                })
              }
            </Geographies>
            {microStates.map((state) => {
              const fill = getCountryFill(state.name);
              const isHovered = hoveredCountry === state.name;
              return (
                <Marker
                  key={state.name}
                  coordinates={state.coordinates as [number, number]}
                  onClick={() => handleCountryClick(state.name)}
                  onMouseEnter={() => setHoveredCountry(state.name)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  <circle
                    r={5 / 3} // 3 fois moins gros
                    fill={isHovered ? "#3B82F6" : fill} // bleu au hover
                    stroke="#374151"
                    strokeWidth={0.5}
                    style={{ cursor: "pointer", transition: "fill 0.2s" }}
                  />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div className="mt-4 text-center">
        <p className="text-gray-400 text-xs">
          Real World Map • Hover over countries to highlight • Click to bomb or
          view history
        </p>
      </div>

      {showModal && selectedCountry && (
        <BombModal
          countryName={selectedCountry}
          userCanBomb={userCanBomb}
          onBomb={handleBomb}
          onClose={handleCloseModal}
          nbTodayBombs={countryBombCounts.get(selectedCountry) ?? 0}
        />
      )}
    </div>
  );
};

export default WorldMap;

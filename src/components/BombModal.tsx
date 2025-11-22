import { BombData, listenToCountryBombs } from "../services/bombService";
import React, { useEffect, useState } from "react";

import BombChoice from "./BombModal/BombChoice";
import BombForm from "./BombModal/BombForm";
import BombHistory from "./BombModal/BombHistory";
import CountryStats from "./BombModal/CountryStats";
import { X } from "lucide-react";
import { getCountryAnalytics } from "../services/countryAnalyticsService";

interface BombModalProps {
  countryName: string;
  userCanBomb: boolean;
  onBomb: (message: string, gifUrl?: string, source?: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

const BombModal: React.FC<BombModalProps> = ({
  countryName,
  userCanBomb,
  onBomb,
  onClose,
  isLoading,
}) => {
  const [mode, setMode] = useState<"choice" | "bomb" | "history" | "stats">(
    "choice"
  );
  const [todaysBombs, setTodaysBombs] = useState<BombData[]>([]);
  const [dailyData, setDailyData] = useState<
    Array<{ date: string; count: number }>
  >([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const modal = document.getElementById("bomb-modal");
      if (modal && !modal.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Listen to country bombs
  useEffect(() => {
    if (!countryName) return;

    const unsubscribe = listenToCountryBombs(countryName, (bombs) => {
      setTodaysBombs(bombs);
    });

    return unsubscribe;
  }, [countryName]);

  const loadCountryStats = async () => {
    if (!countryName) return;

    setStatsLoading(true);
    try {
      const { dailyData } = await getCountryAnalytics(countryName);
      setDailyData(dailyData || []);
    } catch (error) {
      console.error("Error loading country stats:", error);
      setDailyData([]);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleModeChange = (newMode: "bomb" | "history" | "stats") => {
    if (newMode === "stats") {
      loadCountryStats();
    }
    setMode(newMode);
  };

  const handleBomb = (message: string, gifUrl?: string, source?: string) => {
    onBomb(message, gifUrl, source);
  };

  const handleBack = () => {
    setMode("choice");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div
        id="bomb-modal"
        className={`bg-gray-800 rounded-lg w-full max-h-screen overflow-y-auto shadow-2xl transition-all duration-300 ${
          mode === "stats" ? "max-w-4xl" : "max-w-md"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="w-6 h-6" /> {/* Spacer */}
            <div className="flex space-x-2">
              {mode !== "choice" && (
                <div className="flex space-x-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      mode === "bomb" ? "bg-red-500" : "bg-gray-600"
                    }`}
                  />
                  <div
                    className={`w-2 h-2 rounded-full ${
                      mode === "history" ? "bg-blue-500" : "bg-gray-600"
                    }`}
                  />
                  <div
                    className={`w-2 h-2 rounded-full ${
                      mode === "stats" ? "bg-purple-500" : "bg-gray-600"
                    }`}
                  />
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {mode === "choice" && (
            <BombChoice
              countryName={countryName}
              todaysBombs={todaysBombs}
              userCanBomb={userCanBomb}
              onModeChange={handleModeChange}
            />
          )}

          {mode === "bomb" && (
            <BombForm
              countryName={countryName}
              isLoading={isLoading}
              onBomb={handleBomb}
              onBack={handleBack}
            />
          )}

          {mode === "history" && (
            <BombHistory
              countryName={countryName}
              todaysBombs={todaysBombs}
              onBack={handleBack}
            />
          )}

          {mode === "stats" && (
            <CountryStats
              countryName={countryName}
              dailyData={dailyData}
              isLoading={statsLoading}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BombModal;

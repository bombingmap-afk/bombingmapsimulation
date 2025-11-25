import React, { useEffect, useState } from "react";

import BombChoice from "./BombModal/BombChoice";
import BombForm from "./BombModal/BombForm";
import BombHistory from "./BombModal/BombHistory";
import CountryStats from "./BombModal/CountryStats";
import { X } from "lucide-react";

interface BombModalProps {
  countryName: string;
  userCanBomb: boolean;
  onBomb: (message: string, gifUrl?: string, source?: string) => void;
  onClose: () => void;
  isLoading: boolean;
  nbTodayBombs: number;
}

const BombModal: React.FC<BombModalProps> = ({
  countryName,
  userCanBomb,
  onBomb,
  onClose,
  isLoading,
  nbTodayBombs,
}) => {
  const [mode, setMode] = useState<"choice" | "bomb" | "history" | "stats">(
    "choice"
  );

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
            <div className="w-6 h-6" />
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
              nbTodayBombs={nbTodayBombs}
              userCanBomb={userCanBomb}
              onModeChange={setMode}
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
              nbTodayBombs={nbTodayBombs}
              onBack={handleBack}
            />
          )}

          {mode === "stats" && (
            <CountryStats countryName={countryName} onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  );
};

export default BombModal;

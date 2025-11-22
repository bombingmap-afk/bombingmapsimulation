import { BombData } from "../../services/bombService";
import { History } from "lucide-react";
import React from "react";
import { getCountryFlag } from "../../utils/countryFlags";

interface BombHistoryProps {
  countryName: string;
  todaysBombs: BombData[];
  onBack: () => void;
}

const BombHistory: React.FC<BombHistoryProps> = ({
  countryName,
  todaysBombs,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-yellow-400 mr-3" />
          <h2 className="text-2xl font-bold text-white">Today's Bombs</h2>
        </div>
        <p className="text-gray-400 text-lg mb-2">
          <span className="text-2xl mr-2">{getCountryFlag(countryName)}</span>
          {countryName}
        </p>
        <p className="text-gray-300">
          {todaysBombs.length} bomb{todaysBombs.length !== 1 ? "s" : ""} dropped
          today
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {todaysBombs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🕊️</div>
            <p className="text-gray-400">
              No bombs dropped on this country today
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This nation remains peaceful...
            </p>
          </div>
        ) : (
          todaysBombs.map((bomb, index) => (
            <div
              key={bomb.id}
              className="bg-gray-700 p-4 rounded-lg border-l-4 border-red-500"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-400 font-semibold">
                  💣 Attack #{index + 1}
                </span>
                <span className="text-gray-400 text-sm">
                  {bomb.timestamp.toDate().toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white bg-gray-800 p-2 rounded italic">
                "{bomb.message}"
              </p>
              {bomb.gifUrl && (
                <div className="mt-3 text-center">
                  <img
                    src={bomb.gifUrl}
                    alt="GIF preview"
                    className="mx-auto rounded-lg max-h-40"
                  />
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                {bomb.source && (
                  <div className="text-xs text-gray-400 mt-1 flex">
                    Attacker: {bomb.source}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1 flex justify-end">
                  {bomb.timestamp.toDate().toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg
                 transition-all duration-200"
      >
        Back
      </button>
    </div>
  );
};

export default BombHistory;

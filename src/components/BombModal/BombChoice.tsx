import { BarChart3, Bomb, History } from "lucide-react";

import React from "react";
import { getCountryFlag } from "../../utils/countryFlags";

interface BombChoiceProps {
  countryName: string;
  nbTodayBombs: number;
  userCanBomb: boolean;
  onModeChange: (mode: "bomb" | "history" | "stats") => void;
}

const BombChoice: React.FC<BombChoiceProps> = ({
  countryName,
  nbTodayBombs,
  userCanBomb,
  onModeChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <span className="text-4xl mr-3">{getCountryFlag(countryName)}</span>
          <h2 className="text-3xl font-bold text-white">{countryName}</h2>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 mb-4">
          <p className="text-gray-300">
            <span className="text-red-400 font-bold">{nbTodayBombs}</span> bomb
            {nbTodayBombs > 1 ? "s" : ""} since the beginning
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <button
          onClick={() => onModeChange("bomb")}
          disabled={!userCanBomb}
          className={`
            w-full py-4 px-6 rounded-lg transition-all duration-200
            flex items-center justify-center space-x-3
            ${
              userCanBomb
                ? "bg-red-600 hover:bg-red-700 text-white transform hover:scale-105"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          <Bomb className="w-5 h-5" />
          <span className="text-lg font-semibold">
            {userCanBomb
              ? "Drop Bomb Here"
              : "You can't bomb anymore for today"}
          </span>
        </button>
        <button
          onClick={() => onModeChange("history")}
          className="w-full py-4 px-6 rounded-lg transition-all duration-200
                   bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105
                   flex items-center justify-center space-x-3"
        >
          <History className="w-5 h-5" />
          <span className="text-lg font-semibold">View Today's Bombs</span>
        </button>
        <button
          onClick={() => onModeChange("stats")}
          className="w-full py-4 px-6 rounded-lg transition-all duration-200
                   bg-purple-600 hover:bg-purple-700 text-white transform hover:scale-105
                   flex items-center justify-center space-x-3"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-lg font-semibold">View Statistics</span>
        </button>
      </div>
    </div>
  );
};

export default BombChoice;

import { History } from "lucide-react";
import MessagesList from "../Messages";
import React from "react";
import { getCountryFlag } from "../../utils/countryFlags";

interface BombHistoryProps {
  countryName: string;
  nbTodayBombs: number;
  onBack: () => void;
}

const BombHistory: React.FC<BombHistoryProps> = ({
  countryName,
  nbTodayBombs,
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
        <div className="bg-gray-700 rounded-lg p-3 mb-4">
          <p className="text-gray-300">
            <span className="text-red-400 font-bold">{nbTodayBombs}</span> bomb
            {nbTodayBombs > 1 ? "s" : ""} since the beginning
          </p>
        </div>
      </div>
      <MessagesList country={countryName} nbTotalMessages={nbTodayBombs} />
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

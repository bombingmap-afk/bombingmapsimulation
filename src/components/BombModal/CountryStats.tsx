import { BarChart3, TrendingUp } from "lucide-react";
import React, { useState } from "react";

import Statistics from "../Statistics";
import { getCountryFlag } from "../../utils/countryFlags";

interface CountryStatsProps {
  countryName: string;
  dailyData: Array<{ date: string; count: number }>;
  isLoading: boolean;
  onBack: () => void;
}

const CountryStats: React.FC<CountryStatsProps> = ({
  countryName,
  dailyData,
  isLoading,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-purple-400 mr-3" />
          <h2 className="text-2xl font-bold text-white">Statistics</h2>
        </div>
        <p className="text-gray-400 text-lg mb-2">
          <span className="text-2xl mr-2">{getCountryFlag(countryName)}</span>
          {countryName}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-white">
              Evolution Last 30 Days
            </h3>
          </div>

          <Statistics country={countryName} />
        </div>
      )}

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

export default CountryStats;

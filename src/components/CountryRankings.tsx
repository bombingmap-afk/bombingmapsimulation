import "react-day-picker/dist/style.css";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Minus,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { DayPicker } from "react-day-picker";
import ReactDOM from "react-dom";
import { functions } from "../config/firebase";
import { getCountryFlag } from "../utils/countryFlags";
import { httpsCallable } from "firebase/functions";

/* -------------------------------------------------------------------------- */
/* 🏆 COUNTRY RANKINGS COMPONENT                                              */
/* -------------------------------------------------------------------------- */
interface CountryRanking {
  country: string;
  bombCount: number;
  rank: number;
  change?: number;
  yesterdayRank?: number;
}

const CountryRankingsContent: React.FC<{
  rankings: CountryRanking[];
  selectedDate: string;
  isLoading: boolean;
}> = ({ rankings, selectedDate, isLoading }) => {
  const maxBombCount = rankings.length > 0 ? rankings[0].bombCount : 0;
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "text-gray-400";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendText = (change: number, yesterdayRank: number) => {
    if (change > 0) return `+${change} places`;
    if (change < 0) return `${change} places`;
    if (yesterdayRank > 200) return "New"; // If rank is very high, it's a new country
    return "Stable";
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-gray-400";
  };

  const getBarWidth = (bombCount: number, maxCount: number) => {
    return maxCount > 0 ? (bombCount / maxCount) * 100 : 0;
  };

  const getBarColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500";
    if (rank === 3) return "bg-gradient-to-r from-amber-500 to-amber-700";
    if (rank <= 5) return "bg-gradient-to-r from-red-500 to-red-700";
    if (rank <= 10) return "bg-gradient-to-r from-orange-500 to-orange-700";
    return "bg-gradient-to-r from-gray-500 to-gray-700";
  };

  return (
    <div className="p-6 max-h-96 overflow-y-auto">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading rankings...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🕊️</div>
          <p className="text-gray-400 text-lg">Nothing that day</p>
          <p className="text-gray-500 text-sm mt-2">
            The world was at peace...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart View */}
          <div className="space-y-4">
            {rankings.map((country) => (
              <div key={country.country} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-lg font-bold ${getRankColor(
                        country.rank
                      )}`}
                    >
                      {getRankIcon(country.rank)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getCountryFlag(country.country)}
                      </span>
                      <span className="text-white font-medium">
                        {country.country}
                      </span>
                    </div>
                  </div>
                  {isToday && country.change !== undefined && (
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(country.change)}
                      <span
                        className={`text-xs ${getTrendColor(country.change)}`}
                      >
                        {getTrendText(
                          country.change,
                          country.yesterdayRank || 999
                        )}
                      </span>
                    </div>
                  )}
                  <span className="text-red-400 font-bold">
                    💣 {country.bombCount}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${getBarColor(
                      country.rank
                    )}`}
                    style={{
                      width: `${getBarWidth(country.bombCount, maxBombCount)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CountryRankingsHeader: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Trophy className="w-8 h-8 text-yellow-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Country Rankings</h2>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded"
      >
        ✕
      </button>
    </div>
  );
};

const CountryRankingsDateSection: React.FC<{
  selectedDate: string;
  setSelectedDate: (_: string) => void;
}> = ({ selectedDate, setSelectedDate }) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const toLocalYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const navigateDate = (direction: "prev" | "next") => {
    const current = new Date(selectedDate);
    const today = new Date();

    if (direction === "prev") {
      current.setDate(current.getDate() - 1);
    } else if (direction === "next") {
      const nextDate = new Date(current);
      nextDate.setDate(nextDate.getDate() + 1);
      if (nextDate > today) return;
      current.setDate(current.getDate() + 1);
    }

    setSelectedDate(toLocalYMD(current));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayString = toLocalYMD(today);
    const yesterdayString = toLocalYMD(yesterday);

    if (dateString === todayString) return "Today";
    if (dateString === yesterdayString) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center justify-between mb-4 gap-2 text-center relative">
      {/* Previous button */}
      <button
        onClick={() => navigateDate("prev")}
        className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors min-w-[40px]"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Older</span>
      </button>

      {/* Middle date display + calendar */}
      <div className="flex items-center justify-center space-x-2 text-white relative">
        <button
          onClick={() => setShowCalendar((s) => !s)}
          className="flex items-center space-x-2 hover:text-blue-400 transition-colors relative"
        >
          <CalendarIcon className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-sm sm:text-base">
            {formatDate(selectedDate)}
          </span>
        </button>

        {/* POPUP CALENDAR */}
        {showCalendar &&
          ReactDOM.createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-start justify-center"
              onClick={() => setShowCalendar(false)}
            >
              <div
                className="mt-[120px] bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <DayPicker
                  mode="single"
                  selected={new Date(selectedDate)}
                  onSelect={(day) => {
                    if (!day) return;
                    setSelectedDate(toLocalYMD(day));
                    setShowCalendar(false);
                  }}
                  disabled={{
                    after: new Date(),
                    before: new Date("2025-10-01"),
                  }}
                  weekStartsOn={1}
                  styles={{
                    caption: { color: "white" },
                    head_cell: { color: "#9CA3AF" },
                    day: { color: "white" },
                  }}
                />
              </div>
            </div>,
            document.body
          )}
      </div>

      {/* Next button */}
      <button
        onClick={() => navigateDate("next")}
        disabled={selectedDate === toLocalYMD(new Date())}
        className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors min-w-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="hidden sm:inline">Newer</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

interface CountryRankingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const CountryRankingsWithCalls: React.FC<CountryRankingsProps> = ({
  isOpen,
  onClose,
}) => {
  const [rankings, setRankings] = useState<CountryRanking[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);

  const getRankingsCF = httpsCallable(functions, "getRankings");

  useEffect(() => {
    loadRankings(selectedDate);
  }, [selectedDate]);

  const loadRankings = async (date: string) => {
    setIsLoading(true);
    try {
      // const trendingData = await getTrendingData();
      const result = await getRankingsCF({ date });
      const trending = result.data.trending;
      const rankingsWithTrend = trending.map((item) => ({
        country: item.country,
        bombCount: item.bombCount,
        rank: item.todayRank,
        change: item.change,
        yesterdayRank: item.yesterdayRank,
      }));
      setRankings(rankingsWithTrend);
    } catch (error) {
      console.error("Error loading rankings:", error);
      setRankings([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div
        id="rankings-modal"
        className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-screen overflow-hidden shadow-2xl relative"
      >
        <div className="p-6 border-b border-gray-700">
          <CountryRankingsHeader onClose={onClose} />
          <CountryRankingsDateSection
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
        <CountryRankingsContent
          rankings={rankings}
          selectedDate={selectedDate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default CountryRankingsWithCalls;

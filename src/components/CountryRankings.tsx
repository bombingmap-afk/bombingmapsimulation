import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Minus,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import ReactDOM from "react-dom";
import { functions } from "../config/firebase";
import { getCountryFlag } from "../utils/countryFlags";
import { httpsCallable } from "firebase/functions";

/* -------------------------------------------------------------------------- */
/* 📅 POPUP CALENDAR COMPONENT                                                */
/* -------------------------------------------------------------------------- */
const CalendarPopover: React.FC<{
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}> = ({ selectedDate, onSelect, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const minDate = new Date("2025-10-01");
  const maxDate = new Date();

  // détecter si on est sur mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // fermer si clic à l’extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // construction du calendrier
  const current = new Date(selectedDate);
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];

  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push(new Date(year, month, d));

  const handleDayClick = (day: Date) => {
    if (day >= minDate && day <= maxDate) {
      onSelect(day.toISOString().split("T")[0]);
      onClose();
    }
  };

  // Vérifier si on peut aller au mois précédent
  const isPrevMonthAllowed = () => {
    const prev = new Date(year, month - 1, 1);
    return (
      prev.getFullYear() > minDate.getFullYear() ||
      (prev.getFullYear() === minDate.getFullYear() &&
        prev.getMonth() >= minDate.getMonth())
    );
  };

  // Vérifier si on peut aller au mois suivant
  const isNextMonthAllowed = () => {
    const next = new Date(year, month + 1, 1);
    return (
      next.getFullYear() < maxDate.getFullYear() ||
      (next.getFullYear() === maxDate.getFullYear() &&
        next.getMonth() <= maxDate.getMonth())
    );
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: isMobile ? 20 : -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isMobile ? 20 : -5 }}
        transition={{ duration: 0.15 }}
        className={`z-[9999] ${
          isMobile
            ? "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
            : "absolute top-8 left-1/2 -translate-x-1/2"
        }`}
      >
        <div
          className={`bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-80 ${
            isMobile ? "max-w-sm w-full" : ""
          } relative`}
        >
          {/* Croix de fermeture */}
          <button
            onClick={onClose}
            className={`absolute text-gray-400 hover:text-white rounded-full flex items-center justify-center
              ${
                isMobile
                  ? "top-1 right-1 text-xl"
                  : "top-1 right-1 w-8 h-8 text-lg"
              }`}
          >
            ✕
          </button>

          {/* Header du calendrier */}
          <div className="flex justify-between items-center mb-4 text-white">
            <button
              onClick={() => {
                if (isPrevMonthAllowed()) {
                  const prev = new Date(year, month - 1, 1);
                  onSelect(prev.toISOString().split("T")[0]);
                }
              }}
              className={`p-1 hover:text-blue-400 ${
                !isPrevMonthAllowed() ? "opacity-40 cursor-not-allowed" : ""
              }`}
              disabled={!isPrevMonthAllowed()}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">
              {current.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => {
                if (isNextMonthAllowed()) {
                  const next = new Date(year, month + 1, 1);
                  onSelect(next.toISOString().split("T")[0]);
                }
              }}
              className={`p-1 hover:text-blue-400 ${
                !isNextMonthAllowed() ? "opacity-40 cursor-not-allowed" : ""
              }`}
              disabled={!isNextMonthAllowed()}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, index) => (
              <div key={`${d}${index}`} className="text-center font-semibold">
                {d}
              </div>
            ))}
          </div>

          {/* Cases du calendrier */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const iso = day.toISOString().split("T")[0];
              const isSelected = iso === selectedDate;
              const disabled = day < minDate || day > maxDate;
              return (
                <button
                  key={iso}
                  onClick={() => handleDayClick(day)}
                  disabled={disabled}
                  className={`w-10 h-10 rounded-full text-sm flex items-center justify-center 
                    ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }
                    ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

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

interface CountryRankingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const CountryRankings: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  rankings: CountryRanking[];
  selectedDate: string;
  setSelectedDate: (_: string) => void;
  isLoading: boolean;
}> = ({
  isOpen,
  onClose,
  rankings,
  selectedDate,
  setSelectedDate,
  isLoading,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);

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

    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const todayString = new Date().toISOString().split("T")[0];
    const yesterdayString = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (dateString === todayString) return "Today";
    if (dateString === yesterdayString) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div
        id="rankings-modal"
        className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-screen overflow-hidden shadow-2xl relative"
      >
        {/* HEADER */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Country Rankings
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded"
            >
              ✕
            </button>
          </div>

          {/* DATE + NAVIGATION */}
          <div className="flex items-center justify-between mb-4 gap-2 text-center relative">
            <button
              onClick={() => navigateDate("prev")}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 
                       text-white rounded-lg transition-colors min-w-[40px]"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Older</span>
            </button>

            <div className="flex items-center justify-center space-x-2 text-white relative">
              <button
                onClick={() => setShowCalendar((s) => !s)}
                className="flex items-center space-x-2 hover:text-blue-400 transition-colors relative"
              >
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-sm sm:text-base">
                  {formatDate(selectedDate)}
                </span>
              </button>
              {showCalendar && (
                <CalendarPopover
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  onClose={() => setShowCalendar(false)}
                />
              )}
            </div>

            <button
              onClick={() => navigateDate("next")}
              disabled={selectedDate === new Date().toISOString().split("T")[0]}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 
                       text-white rounded-lg transition-colors min-w-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Newer</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
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
                            className={`text-xs ${getTrendColor(
                              country.change
                            )}`}
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
                          width: `${getBarWidth(
                            country.bombCount,
                            maxBombCount
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
    <CountryRankings
      isOpen={isOpen}
      onClose={onClose}
      rankings={rankings}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      isLoading={isLoading}
    />
  );
};

export default CountryRankingsWithCalls;

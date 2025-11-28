import {
  BarChart3,
  Clock,
  Globe2,
  Menu,
  MessageSquare,
  Trophy,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";

interface HeaderProps {
  totalBombs: number;
  userCanBomb: boolean;
  onShowRankings: () => void;
  onShowAnalytics: () => void;
  onShowMessages: () => void;
}

const Header: React.FC<HeaderProps> = ({
  totalBombs,
  userCanBomb,
  onShowRankings,
  onShowAnalytics,
  onShowMessages,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe2 className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold text-white">World Bomb Map</h1>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={onShowMessages}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 
                       text-white rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Messages</span>
            </button>
            <button
              onClick={onShowRankings}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 
                       text-white rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Rankings</span>
            </button>
            <button
              onClick={onShowAnalytics}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                       text-white rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Statistics</span>
            </button>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-gray-300">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">
                bomb
                {totalBombs > 1 ? "s" : ""} in 24 hours
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span
                className={`font-medium ${
                  userCanBomb ? "text-green-400" : "text-red-400"
                }`}
              >
                {userCanBomb ? "Ready to bomb" : "Bombed today"}
              </span>
            </div>
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {menuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="mt-4 flex flex-col space-y-3 md:hidden animate-slideDown">
            <button
              onClick={() => {
                setMenuOpen(false);
                onShowMessages();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 
                         text-white rounded-lg transition-all duration-200"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                onShowRankings();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 
                         text-white rounded-lg transition-all duration-200"
            >
              <Trophy className="w-5 h-5" />
              <span>Rankings</span>
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                onShowAnalytics();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                         text-white rounded-lg transition-all duration-200"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Statistics</span>
            </button>

            <div className="flex items-center space-x-2 text-gray-300 pt-2 border-t border-gray-700">
              <Users className="w-5 h-5" />
              <span className="font-medium">{totalBombs} bombs today</span>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span
                className={`font-medium ${
                  userCanBomb ? "text-green-400" : "text-red-400"
                }`}
              >
                {userCanBomb ? "Ready to bomb" : "Bombed today"}
              </span>
            </div>
          </div>
        )}

        {/* Instruction text */}
        <div className="mt-4">
          <p className="text-gray-400 text-center md:text-left text-sm md:text-base">
            Click on any country to bomb it or view its history. You can only
            bomb once per day.
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;

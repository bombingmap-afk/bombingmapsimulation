import { BarChart3, X } from "lucide-react";

import Statistics from "./Statistics";
import { useEffect } from "react";

type AnalyticsProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Analytics({ isOpen, onClose }: AnalyticsProps) {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const modal = document.getElementById("analytics-modal");
      if (modal && !modal.contains(e.target as Node)) onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div
        id="analytics-modal"
        className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-screen overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">
                Bombing Statistics
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <Statistics />
      </div>
    </div>
  );
}

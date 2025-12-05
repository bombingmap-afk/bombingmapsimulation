import { Radio, X } from "lucide-react";
import { useEffect, useState } from "react";

interface NewsTickerProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function NewsTicker({
  message,
  onClose,
  duration = 8000,
}: NewsTickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 50);
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 50);

    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-red-800 px-3 py-1 rounded">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="font-bold text-sm uppercase tracking-wider">
              LIVE
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-base md:text-lg font-medium">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-1 bg-red-900">
          <div
            className="h-full bg-yellow-400 transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

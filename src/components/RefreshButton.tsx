import { RotateCcw } from "lucide-react";

export default function RefreshButton({
  loading,
  cooldown,
  currentNews,
  onClick,
}: {
  loading: boolean;
  cooldown: number;
  currentNews: string | null;
  onClick: () => void;
}) {
  const disabled = loading || cooldown > 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        fixed right-6 z-50 
        w-14 h-14 rounded-full
        flex items-center justify-center
        bg-gray-700 text-white shadow-xl
        hover:bg-gray-600 active:scale-95
        disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${currentNews ? "bottom-24" : "bottom-6"}
      `}
    >
      {loading ? (
        <RotateCcw className="w-6 h-6 animate-spin" />
      ) : cooldown > 0 ? (
        <span className="text-lg font-semibold">{cooldown}</span>
      ) : (
        <RotateCcw className="w-6 h-6" />
      )}
    </button>
  );
}

import { Check, Copy, MessageCircle, Share2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { getCountryFlag } from "../utils/countryFlags";

interface ShareIncentiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryBombed: string;
  totalBombsGlobal: number;
  userTotalBombs: number;
}

export default function ShareIncentiveModal({
  isOpen,
  onClose,
  countryBombed,
  totalBombsGlobal,
  userTotalBombs,
}: ShareIncentiveModalProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [hasShared, setHasShared] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Countdown pour créer urgence
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const siteUrl = window.location.origin;
  const flagEmoji = getCountryFlag(countryBombed);
  const messages = {
    twitter: `I just NUKED ${flagEmoji} ${countryBombed}! 💣🔥\n\n${totalBombsGlobal.toLocaleString()}+ bombs dropped in the World War!\n\nPick your target: ${siteUrl}\n\n#WorldBombingMap #${countryBombed.replace(
      /\s/g,
      ""
    )}`,

    whatsapp: `💣 J'AI BOMBARDÉ ${countryBombed.toUpperCase()} ${flagEmoji}\n\n${totalBombsGlobal.toLocaleString()}+ joueurs dans la guerre mondiale !\n\nChoisis ta cible : ${siteUrl}`,

    reddit: `I just bombed ${countryBombed} on the World Bombing Map 💣\n\nOver ${totalBombsGlobal.toLocaleString()} bombs dropped so far in this social experiment!\n\nJoin the chaos: ${siteUrl}`,

    generic: `💣 I just bombed ${countryBombed}!\n\nJoin ${totalBombsGlobal.toLocaleString()}+ players: ${siteUrl}`,
  };

  const handleShare = (platform: string) => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        messages.twitter
      )}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(
        siteUrl
      )}&title=${encodeURIComponent(`I bombed ${countryBombed} 💣`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(messages.whatsapp)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        siteUrl
      )}&quote=${encodeURIComponent(messages.generic)}`,
    };

    window.open(
      urls[platform as keyof typeof urls],
      "_blank",
      "width=600,height=400"
    );

    setHasShared(true);

    // Track avec Google Analytics
    if (window.gtag) {
      window.gtag("event", "share", {
        method: platform,
        content_type: "bomb",
        item_id: countryBombed,
      });
    }

    // Auto-ferme après partage
    setTimeout(() => onClose(), 1500);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setHasShared(true);

      if (window.gtag) {
        window.gtag("event", "share", {
          method: "copy_link",
          content_type: "bomb",
          item_id: countryBombed,
        });
      }

      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl max-w-md w-full shadow-2xl border-2 border-red-500/40 animate-[slideUp_0.3s_ease-out] relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-orange-600/10 pointer-events-none" />

        {/* Countdown urgence */}
        {countdown > 0 && (
          <div className="absolute top-2 right-2 bg-red-600/90 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            {countdown}s
          </div>
        )}

        <div className="relative p-6">
          {/* Header avec explosion */}
          <div className="text-center mb-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 animate-ping bg-red-600 rounded-full opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center text-4xl shadow-lg">
                💣
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mt-4 mb-1">
              DIRECT HIT!
            </h2>
            <p className="text-red-400 font-bold text-lg">
              {flagEmoji} {countryBombed} DESTROYED
            </p>
          </div>

          {/* Stats dramatiques */}
          <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-xl md:p-4 mb-4 border border-red-500/30">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">
                  {userTotalBombs}
                </div>
                <div className="text-xs text-gray-400">Your Bombs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {totalBombsGlobal.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Total Chaos</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 mt-2 mb-4">
            <p className="text-xl font-semibold text-white">
              Are you ashamed ?
            </p>
            <p className="text-lg text-white">
              If not, share it with your friends !
            </p>
          </div>
          {/* Boutons de partage */}
          <div className="space-y-2 mb-3">
            <button
              onClick={() => handleShare("twitter")}
              className="w-full bg-gradient-to-r from-[#1DA1F2] to-[#1a8cd8] hover:from-[#1a8cd8] hover:to-[#1DA1F2] text-white py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              Flex on Twitter/X
            </button>

            <button
              onClick={() => handleShare("whatsapp")}
              className="w-full bg-gradient-to-r from-[#25D366] to-[#22c55e] hover:from-[#22c55e] hover:to-[#25D366] text-white py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              Spread Chaos on WhatsApp
            </button>

            <button
              onClick={() => handleShare("reddit")}
              className="w-full bg-gradient-to-r from-[#FF4500] to-[#e03d00] hover:from-[#e03d00] hover:to-[#FF4500] text-white py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              <Share2 className="w-5 h-5" />
              Post on Reddit
            </button>
          </div>

          {/* Copy link (fallback) */}
          <button
            onClick={handleCopy}
            className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-white py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium border border-gray-600/50 hover:border-gray-500 mb-3"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-green-400" />
                <span>Link Copied! 🎉</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Just Copy Link</span>
              </>
            )}
          </button>

          {/* Skip button (moins visible) */}
          <button
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-400 text-sm py-2 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

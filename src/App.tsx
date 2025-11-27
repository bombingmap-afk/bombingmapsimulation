import toast, { Toaster } from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";

import Analytics from "./components/Analytics";
import CountryRankingsWithCalls from "./components/CountryRankings";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LegalDisclaimer from "./components/LegalDisclaimer";
import MessagesSidebar from "./components/MessagesSidebar";
import RefreshButton from "./components/RefreshButton";
import WorldMap from "./components/WorldMap";
import { canBombToday } from "./utils/dateUtils";
import { functions } from "./config/firebase";
import { httpsCallable } from "firebase/functions";
import { useLocalStorage } from "./hooks/useLocalStorage";

interface UserSession {
  lastBombDate: string | null;
  totalBombs: number;
}

function App() {
  const [userSession, setUserSession] = useLocalStorage<UserSession>(
    "bombMapSession",
    {
      lastBombDate: null,
      totalBombs: 0,
    }
  );

  const [showRankings, setShowRankings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const userCanBomb = canBombToday(userSession.lastBombDate);
  const [pendingBombs, setPendingBombs] = useState(new Map<string, number>());
  const [loadingStats, setLoadingStats] = useState(false);
  const [cooldown, setCooldown] = useState(0); // en secondes
  const [bombCounts, setBombCounts] = useState({
    countryBombCounts: new Map<string, number>(),
    totalBombs: 0,
  });
  const dropBomb = httpsCallable<
    {
      country: string;
      message: string;
      sessionId: string;
      gifUrl: string | null;
      source: string | null;
    },
    { ok: boolean }
  >(functions, "dropBomb");

  const handleBomb = async (
    countryName: string,
    message: string,
    gifUrl?: string,
    source?: string
  ) => {
    const sessionId =
      localStorage.getItem("bombMapSessionId") || crypto.randomUUID();
    localStorage.setItem("bombMapSessionId", sessionId);

    if (!canBombToday(userSession.lastBombDate)) {
      toast.error("You already bombed today!");
      return;
    }

    setPendingBombs((prev) => {
      const updated = new Map(prev);
      updated.set(countryName, (updated.get(countryName) || 0) + 1);
      return updated;
    });

    try {
      const result = await dropBomb({
        country: countryName,
        message,
        sessionId,
        gifUrl: gifUrl || null,
        source: source || null,
      });

      if (result.data?.ok) {
        setUserSession({
          lastBombDate: new Date().toISOString(),
          totalBombs: userSession.totalBombs + 1,
        });
        toast.success(`Bomb successfully sent to ${countryName}!`);
        refreshStats();
      }
    } catch (error: any) {
      setPendingBombs((prev) => {
        const updated = new Map(prev);
        const current = updated.get(countryName) || 0;
        if (current <= 1) updated.delete(countryName);
        else updated.set(countryName, current - 1);
        return updated;
      });
      if (error.code === "already-exists") {
        toast.error("You already bombed today!");
      } else if (error.code === "resource-exhausted") {
        toast.error("Your IP has reached the daily limit.");
      } else {
        toast.error("An error occurred while sending your bomb.");
      }
    }
  };

  const getCountryBombStatsFn = httpsCallable(functions, "getCountryBombStats");

  const refreshStats = async () => {
    if (loadingStats || cooldown > 0) return;

    setLoadingStats(true);

    try {
      const { data } = await getCountryBombStatsFn();
      const stats = data as any;

      console.log(stats);

      const countryMap = new Map<string, number>(
        Object.entries(stats.countryCounts || {})
      );

      setBombCounts({
        countryBombCounts: countryMap,
        totalBombs: stats.total,
      });

      setPendingBombs(new Map());

      setCooldown(5);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((c) => {
        const next = c - 1;
        return next > 0 ? next : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const effectiveBombCounts = new Map(bombCounts.countryBombCounts);

  pendingBombs.forEach((count, country) => {
    const current = effectiveBombCounts.get(country) || 0;
    effectiveBombCounts.set(country, current + count);
  });

  const maxBombs = useMemo(() => {
    return Math.max(...Array.from(bombCounts.countryBombCounts.values()), 1);
  }, [bombCounts]);

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-right" reverseOrder={false} />
      <LegalDisclaimer />

      <Header
        totalBombs={bombCounts.totalBombs}
        userCanBomb={userCanBomb}
        onShowRankings={() => setShowRankings(true)}
        onShowAnalytics={() => setShowAnalytics(true)}
        onShowMessages={() => setShowMessages(true)}
      />
      <RefreshButton
        loading={loadingStats}
        cooldown={cooldown}
        onClick={refreshStats}
      />

      <main className="py-8">
        <div className="max-w-7xl mx-auto">
          <WorldMap
            userCanBomb={userCanBomb}
            onBomb={handleBomb}
            countryBombCounts={effectiveBombCounts}
            maxBombs={maxBombs}
          />
        </div>
      </main>

      <Footer />

      <CountryRankingsWithCalls
        isOpen={showRankings}
        onClose={() => setShowRankings(false)}
      />

      <Analytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      <MessagesSidebar
        isOpen={showMessages}
        nbTotalMessages={bombCounts.totalBombs}
        onClose={() => setShowMessages(false)}
      />
    </div>
  );
}

export default App;

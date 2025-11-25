import { useEffect, useMemo, useState } from "react";

import Analytics from "./components/Analytics";
import CountryRankingsWithCalls from "./components/CountryRankings";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LegalDisclaimer from "./components/LegalDisclaimer";
import MessagesSidebar from "./components/MessagesSidebar";
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
  const [bombCounts, setBombCounts] = useState({
    countryBombCounts: new Map<string, number>(),
    totalBombs: 0,
  });
  const dropBomb = httpsCallable(functions, "dropBomb");

  const handleBomb = async (
    countryName: string,
    message: string,
    gifUrl?: string,
    source?: string
  ) => {
    const sessionId =
      localStorage.getItem("bombMapSessionId") || crypto.randomUUID();
    localStorage.setItem("bombMapSessionId", sessionId);

    // On vérifie côté client (UX uniquement, pas sécurité)
    if (!canBombToday(userSession.lastBombDate)) {
      alert("You already bombed today!");
      return;
    }

    setPendingBombs((prev) => {
      const updated = new Map(prev);
      updated.set(countryName, (updated.get(countryName) || 0) + 1);
      return updated;
    });

    try {
      // Appel de la Cloud Function (serveur = vrai contrôle IP + session)
      const result = await dropBomb({
        country: countryName,
        message,
        sessionId,
        gifUrl: gifUrl || null,
        source: source || null,
      });

      // Si le serveur renvoie ok:true, on met à jour la session locale
      if (result.data?.ok) {
        setUserSession({
          lastBombDate: new Date().toISOString(),
          totalBombs: userSession.totalBombs + 1,
        });
      }
    } catch (error: any) {
      // Gestion des erreurs Firebase Functions
      setPendingBombs((prev) => {
        const updated = new Map(prev);
        const current = updated.get(countryName) || 0;
        if (current <= 1) updated.delete(countryName);
        else updated.set(countryName, current - 1);
        return updated;
      });
      if (error.code === "already-exists") {
        alert("You already sent a bomb today (this session).");
      } else if (error.code === "resource-exhausted") {
        alert("Your IP has reached the daily limit (3 bombs per day).");
      } else {
        alert("An error occurred while sending your bomb.");
      }
      console.error("dropBomb error", error);
    }
  };

  const getCountryBombStatsFn = httpsCallable(functions, "getCountryBombStats");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const load = async () => {
      const { data } = await getCountryBombStatsFn({ days: 1 });

      console.log(data);
      const stats = data as any;

      const countryMap = new Map<string, number>(
        Object.entries(stats.countryCounts || {})
      );

      setBombCounts({
        countryBombCounts: countryMap,
        totalBombs: stats.total,
      });

      setPendingBombs(new Map());

      timeout = setTimeout(load, 3000); // rafraîchit toutes les 3s
    };

    load();

    return () => clearTimeout(timeout);
  }, []);

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
      <LegalDisclaimer />

      <Header
        totalBombs={bombCounts.totalBombs}
        userCanBomb={userCanBomb}
        onShowRankings={() => setShowRankings(true)}
        onShowAnalytics={() => setShowAnalytics(true)}
        onShowMessages={() => setShowMessages(true)}
      />

      <main className="py-8">
        <div className="max-w-7xl mx-auto">
          <WorldMap
            userCanBomb={userCanBomb}
            onBomb={handleBomb}
            countryBombCounts={bombCounts.countryBombCounts}
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
        onClose={() => setShowMessages(false)}
      />
    </div>
  );
}

export default App;

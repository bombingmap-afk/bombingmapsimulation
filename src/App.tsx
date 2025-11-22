import {
  getTotalBombsToday,
  listenToAllTodaysBombs,
} from "./services/bombService";
import { useEffect, useState } from "react";

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

  const [totalBombs, setTotalBombs] = useState(0);
  const [countryBombCounts, setCountryBombCounts] = useState<
    Map<string, number>
  >(new Map());
  const [showRankings, setShowRankings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const userCanBomb = canBombToday(userSession.lastBombDate);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

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

  useEffect(() => {
    // Get initial total bombs count
    getTotalBombsToday().then(setTotalBombs);

    // Listen to real-time updates for all bombs
    const unsubscribe = listenToAllTodaysBombs((bombCounts) => {
      setCountryBombCounts(bombCounts);
      // Update total bombs count
      const total = Array.from(bombCounts.values()).reduce(
        (sum, count) => sum + count,
        0
      );
      setTotalBombs(total);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <LegalDisclaimer />

      <Header
        totalBombs={totalBombs}
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
            countryBombCounts={countryBombCounts}
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

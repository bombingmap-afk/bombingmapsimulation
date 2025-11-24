import * as functions from "firebase-functions";

import { db } from "./firebase";

export const getRankings = functions.https.onCall(
  async (data: { date: string }, context) => {

    const { date } = data || {};

    // --- Validations ---
    if (!date || typeof date !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The 'date' field is required and must be a string (ISO format)."
      );
    }

    // ---- Helpers ----
    const getDateRange = (iso: string) => {
      const start = new Date(iso);
      const end = new Date(iso);
      end.setDate(end.getDate() + 1);

      return { start, end };
    };

    // ---- MODE 2: Trending ----
    const d = new Date(date);
    const dYesterday = new Date(date);
    dYesterday.setDate(dYesterday.getDate() - 1);

    const today = d.toISOString().split("T")[0];
    const yesterday = dYesterday.toISOString().split("T")[0];

    /**
     * Récupère et retourne la liste triée [{ country, bombCount, rank }]
     * en appliquant un classement qui donne le même rank en cas d'égalité.
     *
     * Ici j'implémente le "standard competition ranking" (1224).
     */
    const getRankings = async (day: string) => {
      const { start, end } = getDateRange(day);

      const snap = await db
        .collection("bombs")
        .where("timestamp", ">=", start)
        .where("timestamp", "<", end)
        .get();

      const counts: Record<string, number> = {};
      snap.forEach(doc => {
        const c = doc.data().country;
        counts[c] = (counts[c] || 0) + 1;
      });

      // array trié par bombCount descendant
      const sorted = Object.entries(counts)
        .map(([country, bombCount]) => ({ country, bombCount }))
        .sort((a, b) => b.bombCount - a.bombCount);

      // assignation de rangs avec gestion des égalités (standard competition ranking)
      const result: Array<{ country: string; bombCount: number; rank: number }> = [];
      let prevCount: number | null = null;
      let prevRank = 0;

      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        if (prevCount !== null && item.bombCount === prevCount) {
          // même bombCount => même rang que le précédent
          result.push({ ...item, rank: prevRank });
        } else {
          // différent => rang = position (i) + 1
          const rank = i + 1;
          prevRank = rank;
          prevCount = item.bombCount;
          result.push({ ...item, rank });
        }
      }

      return result;
    };

    const [todayR, yesterdayR] = await Promise.all([
      getRankings(today),
      getRankings(yesterday),
    ]);

    const yMap = new Map(yesterdayR.map(r => [r.country, r.rank]));

    const trending = todayR.map(t => ({
      country: t.country,
      todayRank: t.rank,
      yesterdayRank: yMap.get(t.country) || yesterdayR.length + 1,
      change: (yMap.get(t.country) || yesterdayR.length + 1) - t.rank,
      bombCount: t.bombCount,
    }));

    return { trending };
  }
);

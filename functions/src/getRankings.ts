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

    const getRankings = async (day: string) => {
      const { start, end } = getDateRange(day);

      const snap = await db
        .collection("bombs")
        .where("timestamp", ">=", start)
        .where("timestamp", "<", end).get();

      const counts: Record<string, number> = {};
      snap.forEach(doc => {
        const c = doc.data().country;
        counts[c] = (counts[c] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([country, bombCount]) => ({ country, bombCount }))
        .sort((a, b) => b.bombCount - a.bombCount)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));
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

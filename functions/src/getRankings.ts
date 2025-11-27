import * as functions from "firebase-functions";

import { db } from "./firebase";

interface CacheEntry {
  timestamp: number;
  data: any;
}
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 5000;

export const getRankings = functions.https.onCall(
  async (data: { date: string }) => {
    const { date } = data || {};
    if (!date)
      throw new functions.https.HttpsError("invalid-argument", "'date' required");

    const todayId = new Date(date).toISOString().split("T")[0];
    const yesterdayDate = new Date(date);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayId = yesterdayDate.toISOString().split("T")[0];

    const cacheKey = `${todayId}-${yesterdayId}`;
    const now = Date.now();

    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL_MS) {
      return cache[cacheKey].data;
    }

    const [todaySnap, yesterdaySnap] = await Promise.all([
      db.collection("stats_daily").doc(todayId).get(),
      db.collection("stats_daily").doc(yesterdayId).get(),
    ]);

    const todayData: Record<string, number> = todaySnap.data()?.countries || {};
    const yesterdayData: Record<string, number> = yesterdaySnap.data()?.countries || {};

    const buildRanks = (data: Record<string, number>) => {
      const sorted = Object.entries(data)
        .map(([country, bombCount]) => ({ country, bombCount: bombCount as number }))
        .sort((a, b) => b.bombCount - a.bombCount);

      const ranks = new Map<string, number>();
      let prevCount: number | null = null;
      let prevRank = 0;

      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        if (prevCount !== null && item.bombCount === prevCount) {
          // egalité -> même rang que prevRank
          ranks.set(item.country, prevRank);
        } else {
          const rank = i + 1;
          prevRank = rank;
          prevCount = item.bombCount;
          ranks.set(item.country, rank);
        }
      }

      return {
        ranks,
        sorted,
      };
    };

    const { ranks: todayRanks, sorted: todaySorted } = buildRanks(todayData);
    const { ranks: yesterdayRanks, sorted: yesterdaySorted } = buildRanks(yesterdayData);

    const referenceCount = Math.max(todaySorted.length, yesterdaySorted.length);
    const defaultYesterdayRank = referenceCount + 1;

    const trending = todaySorted.map((t, idx) => {
      const country = t.country;
      const todayRank = todayRanks.get(country) ?? (idx + 1); 
      const yesterdayRankRaw = yesterdayRanks.get(country);
      const yesterdayRank = typeof yesterdayRankRaw === "number" ? yesterdayRankRaw : defaultYesterdayRank;
      const change = yesterdayRank - todayRank; 
      return {
        country,
        todayRank,
        yesterdayRank,
        change,
        bombCount: t.bombCount,
      };
    });

    const returnData = { trending };

    cache[cacheKey] = { timestamp: now, data: returnData };

    return returnData;
  }
);

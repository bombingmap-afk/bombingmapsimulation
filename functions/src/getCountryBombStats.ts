import * as functions from "firebase-functions";

import { db } from "./firebase";

// ---- Cache in-memory (per Cloud Function instance) ----
let statsCache: {
  timestamp: number;
  data: {
    countryCounts: Record<string, number>;
    total: number;
  };
} | null = null;

const CACHE_DURATION = 2500; 

export const getCountryBombStats = functions.https.onCall(
  async (data: { }, context) => {
    const now = Date.now();

    if (statsCache && now - statsCache.timestamp < CACHE_DURATION) {
      return statsCache.data;
    }

    const snapshot = await db
      .collection("stats_24h")
      .get();

    const countryCounts: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.countries) return;
      Object.entries(data.countries).forEach(([country, count]) => {
        countryCounts[country] = (countryCounts[country] || 0) + (count as number);
      });
    });

    const total = Object.values(countryCounts).reduce((sum, v) => sum + v, 0);

    const response = { countryCounts, total };

    statsCache = { timestamp: now, data: response };

    return response;
  }
);
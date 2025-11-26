import * as functions from "firebase-functions";

import { db } from "./firebase";

let bombStatsCache: {
  timestamp: number;
  key: string;       
  result: any;
} | null = null;

const CACHE_TTL_MS = 5000; 

export const getBombStats = functions.https.onCall(
  async (data: { days: number; country?: string }, context) => {
    const { days, country } = data || {};

    if (!days || typeof days !== "number" || days <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'days' must be a positive number."
      );
    }

    if (country && typeof country !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'country' must be a string if provided."
      );
    }

    const key = `${days}_${country || "ALL"}`;
    const now = Date.now();

    if (bombStatsCache && bombStatsCache.key === key) {
      if (now - bombStatsCache.timestamp < CACHE_TTL_MS) {
        return bombStatsCache.result;
      }
    }

    const today = new Date();
    const daily: Array<{ date: string; count: number }> = [];

    let total = 0;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];

      const doc = await db.collection("stats_daily").doc(dayStr).get();

      let count = 0;
      if (doc.exists) {
        const data = doc.data() || {};

        if (country && country.trim() !== "") {
          count = (data.countries?.[country.trim()] || 0) as number;
        } else {
          count = (data.total || 0) as number;
        }
      }

      daily.push({ date: dayStr, count });
      total += count;
    }

    const average = daily.length > 0 ? total / daily.length : 0;
    const record = daily.reduce(
      (max, d) => (d.count > max.count ? d : max),
      { date: daily[0]?.date || null, count: 0 }
    );

    const result = {
      total,
      average,
      record,
      daily,
    };

    bombStatsCache = {
      timestamp: now,
      key,
      result,
    };

    return result;
  }
);

import * as functions from "firebase-functions";

import { db } from "./firebase";

// ---- Cache in-memory (per Cloud Function instance) ----
let statsCache: {
  timestamp: number;
  days: number;
  data: {
    countryCounts: Record<string, number>;
    total: number;
  };
} | null = null;

// Cache duration in milliseconds
const CACHE_DURATION = 5000; // 5 seconds

export const getCountryBombStats = functions.https.onCall(
  async (data: { days: number }, context) => {
    const { days } = data || {};

    if (!days || typeof days !== "number" || days <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'days' must be a positive number."
      );
    }

    const now = Date.now();

    // ---- Serve from cache if still valid ----
    if (
      statsCache &&
      statsCache.days === days &&
      now - statsCache.timestamp < CACHE_DURATION
    ) {
      console.log("getCountryBombStats → CACHE HIT");
      return statsCache.data;
    }

    console.log("getCountryBombStats → CACHE MISS → querying Firestore");

    // ---- Compute fresh data ----
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await db
      .collection("bombs")
      .where("timestamp", ">=", startDate)
      .where("timestamp", "<=", endDate)
      .get();

    const countryCounts: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const c = doc.data().country?.trim();
      if (!c) return;
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    });

    const total = Object.values(countryCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    const response = { countryCounts, total };

    // ---- Save to cache ----
    statsCache = {
      timestamp: now,
      days,
      data: response,
    };

    return response;
  }
);
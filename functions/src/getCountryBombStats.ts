import * as functions from "firebase-functions";

import { db } from "./firebase";

export const getCountryBombStats = functions.https.onCall(
  async (data: { days: number }, context) => {
    const { days } = data || {};

    if (!days || typeof days !== "number" || days <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'days' must be a positive number."
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Firestore query
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
      (sum, n) => sum + n,
      0
    );

    return {
      countryCounts,
      total,
    };
  }
);

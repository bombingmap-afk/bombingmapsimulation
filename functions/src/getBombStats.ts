import * as functions from "firebase-functions";

import { db } from "./firebase";

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

    const endDate = new Date(); 
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = db.collection("bombs")
      .where("timestamp", ">=", startDate)
      .where("timestamp", "<=", endDate);

    if (country && typeof country === "string" && country.trim() !== "") {
      query = query.where("country", "==", country.trim());
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return {
        daily: [],
        total: 0,
        average: 0,
        record: { date: null, count: 0 }
      };
    }

    const dayCounts: Record<string, number> = {};

    snapshot.forEach(doc => {
      const ts = doc.data().timestamp.toDate();
      const day = ts.toISOString().split("T")[0];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const daily: Array<{ date: string; count: number }> = [];

    let loop = new Date(startDate);
    while (loop <= endDate) {
      const dateStr = loop.toISOString().split("T")[0];
      daily.push({
        date: dateStr,
        count: dayCounts[dateStr] || 0
      });
      loop.setDate(loop.getDate() + 1);
    }

    daily.sort((a, b) => a.date.localeCompare(b.date));
    const total = daily.reduce((sum, d) => sum + d.count, 0);
    const average = daily.length > 0 ? total / daily.length : 0;
    const record = daily.reduce(
      (max, d) => d.count > max.count ? d : max
    );

    return {
      total,
      average,
      record,
      daily,
    };
  }
);
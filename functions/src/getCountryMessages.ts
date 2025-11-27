import * as functions from "firebase-functions";

import { db } from "./firebase";

interface Message {
  id: string;
  country: string;
  message: string;
  timestamp: string;
  gifUrl?: string;
  source?: string;
}

export const getCountryMessages = functions.https.onCall(
  async (
    data: { country?: string; limit?: number; lastTimestamp?: string },
    context
  ) => {
    const { country, limit = 10, lastTimestamp } = data || {};

    if (country && typeof country !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'country' must be a string if provided"
      );
    }

    if (typeof limit !== "number" || limit <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'limit' must be a positive number"
      );
    }

    try {
      let queryRef = db.collection("bombs")
        .orderBy("timestamp", "desc")
        .limit(limit);

      if (country?.trim()) {
        queryRef = queryRef.where("country", "==", country.trim());
      }

      if (lastTimestamp) {
        queryRef = queryRef.startAfter(new Date(lastTimestamp));
      }

      const querySnapshot = await queryRef.get();

      const messages: Message[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          country: data.country,
          message: data.message,
          timestamp: data.timestamp,
          gifUrl: data.gifUrl ?? undefined,
          source: data.source ?? undefined,
        };
      });

      return { messages };
    } catch (err) {
      console.error("getCountryMessages error:", err);
      throw new functions.https.HttpsError(
        "internal",
        "Internal server error"
      );
    }
  }
);

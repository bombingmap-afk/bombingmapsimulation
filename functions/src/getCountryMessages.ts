import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { db } from "./firebase"; // adapte selon ton import

export const getCountryMessages = functions.https.onCall(
  async (
    data: { country?: string; limit?: number; lastTimestamp?: number },
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
      let queryRef = db
        .collection("bombs")
        .orderBy("timestamp", "desc")
        .limit(limit);

      if (country?.trim()) {
        queryRef = queryRef.where("country", "==", country.trim());
      }

      if (lastTimestamp) {
        const cursor = admin.firestore.Timestamp.fromMillis(lastTimestamp);
        queryRef = queryRef.startAfter(cursor);
      }

      const querySnapshot = await queryRef.get();

      const messages = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          country: data.country,
          message: data.message,
          gifUrl: data.gifUrl ?? undefined,
          source: data.source ?? undefined,
          timestamp: data.timestamp.toMillis(),
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

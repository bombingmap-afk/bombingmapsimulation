import * as functions from "firebase-functions";

import { Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase";

interface Message {
  id: string;
  country: string;
  message: string;
  timestamp: Timestamp;
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

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    try {
      let queryRef = db
        .collection("bombs")
        .where("timestamp", ">=", startDate)
        .where("timestamp", "<=", endDate)
        .orderBy("timestamp", "desc")
        .limit(limit);

      if (country?.trim()) {
        queryRef = queryRef.where("country", "==", country.trim());
      }

      // Pagination par curseur
      if (lastTimestamp) {
        const lastDate = new Date(lastTimestamp);
        queryRef = queryRef.startAfter(lastDate);
      }

      const querySnapshot = await queryRef.get();

      const messages: Message[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate().toISOString(),
        } as Message;
      });

      let total = querySnapshot.size;
      if (!lastTimestamp) {
        let totalQueryRef = db
          .collection("bombs")
          .where("timestamp", ">=", startDate)
          .where("timestamp", "<=", endDate);

        if (country?.trim()) {
          totalQueryRef = totalQueryRef.where("country", "==", country.trim());
        }

        const totalSnapshot = await totalQueryRef.get();
        total = totalSnapshot.size;
      }

      return { messages, total };
    } catch (err) {
      console.error("getCountryMessages error:", err);
      throw new functions.https.HttpsError(
        "internal",
        "Internal server error"
      );
    }
  }
);
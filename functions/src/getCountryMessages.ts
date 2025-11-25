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
    data: { country?: string; days?: number; limit?: number; offset?: number },
    context
  ) => {
    const { country, days = 1, limit = 10, offset = 0 } = data || {};

    if (country && typeof country !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'country' must be a string if provided"
      );
    }

    if (typeof days !== "number" || days <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'days' must be a positive number"
      );
    }

    if (typeof limit !== "number" || limit <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'limit' must be a positive number"
      );
    }

    if (typeof offset !== "number" || offset < 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "'offset' must be >= 0"
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    try {
      let queryRef = db
        .collection("bombs")
        .where("timestamp", ">=", startDate)
        .where("timestamp", "<=", endDate)
        .orderBy("timestamp", "desc");

      if (country && country.trim() !== "") {
        queryRef = queryRef.where("country", "==", country.trim());
      }

      const querySnapshot = await queryRef.offset(offset).limit(limit).get();

      const messages: Message[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate().toISOString(),
        } as Message;
        });

      // Pour le front, on renvoie aussi le total correspondant au filtre
      let total = querySnapshot.size;
      if (offset === 0) {
        // Si c’est la première page, on fait une requête séparée pour le total
        let totalQueryRef = db
          .collection("bombs")
          .where("timestamp", ">=", startDate)
          .where("timestamp", "<=", endDate);
        if (country && country.trim() !== "") {
          totalQueryRef = totalQueryRef.where("country", "==", country.trim());
        }
        const totalSnapshot = await totalQueryRef.get();
        total = totalSnapshot.size;
      }

      return {
        messages,
        total,
      };
    } catch (err) {
      console.error("getCountryMessages error:", err);
      throw new functions.https.HttpsError(
        "internal",
        "Internal server error"
      );
    }
  }
);
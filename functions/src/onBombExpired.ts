import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { db } from "./firebase";

export const onBombExpired = functions.firestore
  .document("bombs/{bombId}")
  .onDelete(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const bombId = context.params.bombId;
    const country = data.country;

    const bombDate = data.timestamp?.toDate
      ? data.timestamp.toDate()
      : new Date(data.timestamp);

    const dayId = bombDate.toISOString().split("T")[0]; 

    const stats24hRef = db.collection("stats_24h").doc("counts");

    const expiredRef = db
      .collection("expired_bombs")
      .doc(dayId)
      .collection("items")
      .doc(bombId);

    try {
      await db.runTransaction(async (tx) => {
        tx.set(
          stats24hRef,
          {
            total: admin.firestore.FieldValue.increment(-1),
            countries: {
              [country]: admin.firestore.FieldValue.increment(-1),
            },
          },
          { merge: true }
        );

        tx.set(expiredRef, {
          ...data,
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          expiredDate: dayId,
        });
      });

      console.log(`Bomb ${bombId} moved to expired_bombs/${dayId}`);
    } catch (err) {
      console.error("Error in onBombExpired:", err);
    }
  });

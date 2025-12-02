import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { db } from "./firebase";

export async function expireBombsLogic() {
  const now = admin.firestore.Timestamp.now();

  const expiredSnapshot = await db
    .collection("bombs")
    .where("expiresAt", "<=", now)
    .limit(500)
    .get();

  if (expiredSnapshot.empty) return 0;

  const countryCounts: Record<string, number> = {};
  const batch = db.batch();

  expiredSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const country = data.country;

    countryCounts[country] = (countryCounts[country] || 0) + 1;

    const bombDate = data.timestamp?.toDate?.() || new Date(data.timestamp);
    const dayId = bombDate.toISOString().split("T")[0];

    const expiredRef = db
      .collection("expired_bombs")
      .doc(dayId)
      .collection("items")
      .doc(doc.id);

    batch.set(expiredRef, {
      ...data,
      expiredAt: now,
      expiredDate: dayId,
    });

    batch.delete(doc.ref);
  });

  const statsRef = db.collection("stats_24h").doc("counts");
  const statsUpdate: any = { total: admin.firestore.FieldValue.increment(-expiredSnapshot.size) };
  for (const country in countryCounts) {
    statsUpdate[`countries.${country}`] = admin.firestore.FieldValue.increment(-countryCounts[country]);
  }
  batch.update(statsRef, statsUpdate);

  await batch.commit();
  return expiredSnapshot.size;
}

export const expireBombsBatch = functions.pubsub
  .schedule("every 1 hours")
  .timeZone("Etc/UTC") 
  .onRun(async () => {
    await expireBombsLogic();
    return null;
  });
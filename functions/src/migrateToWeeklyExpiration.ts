import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { db } from "./firebase";

// Script de migration ONE-TIME : passer de 24h à 1 semaine
export const migrateToWeeklyExpiration = functions.https.onRequest(
  async (req, res) => {
    // Sécurité : nécessite un token secret
    const SECRET_TOKEN = functions.config()?.migration?.token || process.env.MIGRATION_TOKEN;
    if (req.query.token !== SECRET_TOKEN) {
      res.status(403).send("Unauthorized");
      return;
    }

    try {
      const results = {
        bombsUpdated: 0,
        expiredBombsRestored: 0,
        statsWeekCreated: false,
        stats24hMigrated: false,
      };

      // === ÉTAPE 1 : Mettre à jour les expiresAt des bombes actuelles ===
      console.log("Step 1: Updating expiresAt for current bombs...");
      
      const currentBombsSnapshot = await db.collection("bombs").get();
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      
      const batch1 = db.batch();
      let batchCount = 0;

      for (const doc of currentBombsSnapshot.docs) {
        const data = doc.data();
        const currentExpires = data.expiresAt?.toDate();
        
        if (currentExpires) {
          // Ajoute 6 jours (car déjà 1 jour)
          const newExpires = new Date(currentExpires.getTime() + (6 * 24 * 60 * 60 * 1000));
          batch1.update(doc.ref, { expiresAt: admin.firestore.Timestamp.fromDate(newExpires) });
          batchCount++;
          
          if (batchCount >= 500) {
            await batch1.commit();
            results.bombsUpdated += batchCount;
            batchCount = 0;
          }
        }
      }

      if (batchCount > 0) {
        await batch1.commit();
        results.bombsUpdated += batchCount;
      }

      console.log(`Updated ${results.bombsUpdated} bombs`);

// === ÉTAPE 2 : Restaurer les bombes de expired_bombs (< 7 jours) ===
console.log("Step 2: Restoring bombs from expired_bombs...");

const sevenDaysAgo = new Date(Date.now() - ONE_WEEK_MS);
const cutoffDate = sevenDaysAgo.toISOString().split("T")[0];

// Récupère tous les items dans expired_bombs (quel que soit le jour)
const itemsSnapshot = await db.collectionGroup("items").get();
console.log("Total items in expired_bombs:", itemsSnapshot.size);

let batch2 = db.batch();
let restoredCount = 0;

for (const itemDoc of itemsSnapshot.docs) {
  const pathParts = itemDoc.ref.path.split("/");
  const dayId = pathParts[1]; // expired_bombs/YYYY-MM-DD/items/ID -> index 1 = YYYY-MM-DD

  if (dayId >= cutoffDate) {
    const bombData = itemDoc.data();
    const originalTimestamp = bombData.timestamp?.toDate() || new Date(bombData.timestamp);
    const newExpiresAt = new Date(originalTimestamp.getTime() + ONE_WEEK_MS);

    const bombRef = db.collection("bombs").doc(itemDoc.id);
    batch2.set(bombRef, {
      country: bombData.country,
      message: bombData.message,
      gifUrl: bombData.gifUrl || null,
      source: bombData.source || null,
      timestamp: bombData.timestamp,
      expiresAt: admin.firestore.Timestamp.fromDate(newExpiresAt),
    });

    restoredCount++;

    if (restoredCount % 500 === 0) {
      await batch2.commit();
      batch2 = db.batch(); // reset batch
    }
  }
}

if (restoredCount % 500 !== 0) {
  await batch2.commit();
}

results.expiredBombsRestored = restoredCount;
console.log(`Restored ${restoredCount} expired bombs`);

      console.log(`Restored ${results.expiredBombsRestored} expired bombs`);

      // === ÉTAPE 3 : Créer stats_week à partir de stats_24h ===
      console.log("Step 3: Creating stats_week from stats_24h...");

      const stats24hDoc = await db.collection("stats_24h").doc("counts").get();
      
      if (stats24hDoc.exists) {
        const stats24hData = stats24hDoc.data();
        
        await db.collection("stats_week").doc("counts").set({
          total: stats24hData?.total || 0,
          countries: stats24hData?.countries || {},
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });

        results.statsWeekCreated = true;
        results.stats24hMigrated = true;
      }

      console.log("Stats migrated successfully");

      // === ÉTAPE 4 : Recalculer stats_week à partir des vraies bombes ===
      console.log("Step 4: Recalculating stats_week from actual bombs...");

      const allBombsSnapshot = await db.collection("bombs").get();
      const countryCounts: Record<string, number> = {};
      let totalBombs = 0;

      allBombsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const country = data.country;
        
        if (country) {
          countryCounts[country] = (countryCounts[country] || 0) + 1;
          totalBombs++;
        }
      });

      await db.collection("stats_week").doc("counts").set({
        total: totalBombs,
        countries: countryCounts,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log("Stats recalculated from actual bombs");

      // === RÉSUMÉ ===
      res.status(200).json({
        success: true,
        message: "Migration completed successfully",
        results,
      });

    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({
        success: false,
        error: String(error),
      });
    }
  }
);
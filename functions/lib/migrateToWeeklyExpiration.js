"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateToWeeklyExpiration = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("./firebase");
// Script de migration ONE-TIME : passer de 24h à 1 semaine
exports.migrateToWeeklyExpiration = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d;
    // Sécurité : nécessite un token secret
    const SECRET_TOKEN = ((_b = (_a = functions.config()) === null || _a === void 0 ? void 0 : _a.migration) === null || _b === void 0 ? void 0 : _b.token) || process.env.MIGRATION_TOKEN;
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
        const currentBombsSnapshot = await firebase_1.db.collection("bombs").get();
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        const batch1 = firebase_1.db.batch();
        let batchCount = 0;
        for (const doc of currentBombsSnapshot.docs) {
            const data = doc.data();
            const currentExpires = (_c = data.expiresAt) === null || _c === void 0 ? void 0 : _c.toDate();
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
        const itemsSnapshot = await firebase_1.db.collectionGroup("items").get();
        console.log("Total items in expired_bombs:", itemsSnapshot.size);
        let batch2 = firebase_1.db.batch();
        let restoredCount = 0;
        for (const itemDoc of itemsSnapshot.docs) {
            const pathParts = itemDoc.ref.path.split("/");
            const dayId = pathParts[1]; // expired_bombs/YYYY-MM-DD/items/ID -> index 1 = YYYY-MM-DD
            if (dayId >= cutoffDate) {
                const bombData = itemDoc.data();
                const originalTimestamp = ((_d = bombData.timestamp) === null || _d === void 0 ? void 0 : _d.toDate()) || new Date(bombData.timestamp);
                const newExpiresAt = new Date(originalTimestamp.getTime() + ONE_WEEK_MS);
                const bombRef = firebase_1.db.collection("bombs").doc(itemDoc.id);
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
                    batch2 = firebase_1.db.batch(); // reset batch
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
        const stats24hDoc = await firebase_1.db.collection("stats_24h").doc("counts").get();
        if (stats24hDoc.exists) {
            const stats24hData = stats24hDoc.data();
            await firebase_1.db.collection("stats_week").doc("counts").set({
                total: (stats24hData === null || stats24hData === void 0 ? void 0 : stats24hData.total) || 0,
                countries: (stats24hData === null || stats24hData === void 0 ? void 0 : stats24hData.countries) || {},
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            });
            results.statsWeekCreated = true;
            results.stats24hMigrated = true;
        }
        console.log("Stats migrated successfully");
        // === ÉTAPE 4 : Recalculer stats_week à partir des vraies bombes ===
        console.log("Step 4: Recalculating stats_week from actual bombs...");
        const allBombsSnapshot = await firebase_1.db.collection("bombs").get();
        const countryCounts = {};
        let totalBombs = 0;
        allBombsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const country = data.country;
            if (country) {
                countryCounts[country] = (countryCounts[country] || 0) + 1;
                totalBombs++;
            }
        });
        await firebase_1.db.collection("stats_week").doc("counts").set({
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
    }
    catch (error) {
        console.error("Migration error:", error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
//# sourceMappingURL=migrateToWeeklyExpiration.js.map
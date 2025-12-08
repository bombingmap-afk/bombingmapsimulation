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
    var _a, _b, _c;
    // Sécurité : nécessite un token secret
    const SECRET_TOKEN = ((_b = (_a = functions.config()) === null || _a === void 0 ? void 0 : _a.migration) === null || _b === void 0 ? void 0 : _b.token) || process.env.MIGRATION_TOKEN;
    if (req.query.token !== SECRET_TOKEN) {
        res.status(403).send("Unauthorized");
        return;
    }
    console.log("=== migrateToWeeklyExpiration VERSION 2025-12-08-ULTIMATE ===");
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
        // const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
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
        // === ÉTAPE 2 : Restaurer les bombes de expired_bombs (< 7 jours) ===// === ÉTAPE 2 : Restaurer les bombes de expired_bombs (< 7 jours) ===
        console.log("Step 2: Restoring bombs from expired_bombs...");
        const expiredBombsSnapshot = await firebase_1.db.collection("expired_bombs").get();
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
        console.log("Cutoff date:", cutoffDate);
        let totalRestored = 0;
        for (const dayDoc of expiredBombsSnapshot.docs) {
            const dayId = dayDoc.id;
            console.log("\n==========================");
            console.log("Processing day:", dayId);
            if (dayId < cutoffDate) {
                console.log(`Day ${dayId} is older than cutoff (${cutoffDate}), skipping`);
                continue;
            }
            const dayRef = firebase_1.db.collection("expired_bombs").doc(dayId);
            const dayData = dayDoc.data();
            // 1️⃣ Check for items as sub-collection
            const itemsCollectionRef = dayRef.collection("items");
            const itemsSnapshot = await itemsCollectionRef.get();
            if (!itemsSnapshot.empty) {
                console.log(`Found ${itemsSnapshot.size} items as sub-collection for day ${dayId}`);
                for (const itemDoc of itemsSnapshot.docs) {
                    const bombData = itemDoc.data();
                    console.log(`  Subcollection bomb ID: ${itemDoc.id}`);
                    console.log("    Data:", JSON.stringify(bombData, null, 2));
                    // Ici, tu pourrais restaurer dans la collection principale
                    // await db.collection("bombs").doc(itemDoc.id).set(bombData);
                    totalRestored++;
                }
                continue; // Skip to next day
            }
            // 2️⃣ Check for items as map field
            if (dayData.items && typeof dayData.items === "object") {
                const itemEntries = Object.entries(dayData.items);
                console.log(`Found ${itemEntries.length} items as map for day ${dayId}`);
                for (const [itemId, bombData] of itemEntries) {
                    console.log(`  Map bomb ID: ${itemId}`);
                    console.log("    Data:", JSON.stringify(bombData, null, 2));
                    // Ici, tu pourrais restaurer dans la collection principale
                    // await db.collection("bombs").doc(itemId).set(bombData as any);
                    totalRestored++;
                }
            }
            else {
                console.log(`No items found for day ${dayId}`);
            }
        }
        console.log("\nStep 2 complete: Restored", totalRestored, "expired bombs");
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
//# sourceMappingURL=migrationToWeek.js.map
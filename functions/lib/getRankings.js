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
exports.getRankings = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("./firebase");
exports.getRankings = functions.https.onCall(async (data, context) => {
    const { date } = data || {};
    // --- Validations ---
    if (!date || typeof date !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "The 'date' field is required and must be a string (ISO format).");
    }
    // ---- Helpers ----
    const getDateRange = (iso) => {
        const start = new Date(iso);
        const end = new Date(iso);
        end.setDate(end.getDate() + 1);
        return { start, end };
    };
    // ---- MODE 2: Trending ----
    const d = new Date(date);
    const dYesterday = new Date(date);
    dYesterday.setDate(dYesterday.getDate() - 1);
    const today = d.toISOString().split("T")[0];
    const yesterday = dYesterday.toISOString().split("T")[0];
    /**
     * Récupère et retourne la liste triée [{ country, bombCount, rank }]
     * en appliquant un classement qui donne le même rank en cas d'égalité.
     *
     * Ici j'implémente le "standard competition ranking" (1224).
     */
    const getRankings = async (day) => {
        const { start, end } = getDateRange(day);
        const snap = await firebase_1.db
            .collection("bombs")
            .where("timestamp", ">=", start)
            .where("timestamp", "<", end)
            .get();
        const counts = {};
        snap.forEach(doc => {
            const c = doc.data().country;
            counts[c] = (counts[c] || 0) + 1;
        });
        // array trié par bombCount descendant
        const sorted = Object.entries(counts)
            .map(([country, bombCount]) => ({ country, bombCount }))
            .sort((a, b) => b.bombCount - a.bombCount);
        // assignation de rangs avec gestion des égalités (standard competition ranking)
        const result = [];
        let prevCount = null;
        let prevRank = 0;
        for (let i = 0; i < sorted.length; i++) {
            const item = sorted[i];
            if (prevCount !== null && item.bombCount === prevCount) {
                // même bombCount => même rang que le précédent
                result.push(Object.assign(Object.assign({}, item), { rank: prevRank }));
            }
            else {
                // différent => rang = position (i) + 1
                const rank = i + 1;
                prevRank = rank;
                prevCount = item.bombCount;
                result.push(Object.assign(Object.assign({}, item), { rank }));
            }
        }
        return result;
    };
    const [todayR, yesterdayR] = await Promise.all([
        getRankings(today),
        getRankings(yesterday),
    ]);
    const yMap = new Map(yesterdayR.map(r => [r.country, r.rank]));
    const trending = todayR.map(t => ({
        country: t.country,
        todayRank: t.rank,
        yesterdayRank: yMap.get(t.country) || yesterdayR.length + 1,
        change: (yMap.get(t.country) || yesterdayR.length + 1) - t.rank,
        bombCount: t.bombCount,
    }));
    return { trending };
});
//# sourceMappingURL=getRankings.js.map
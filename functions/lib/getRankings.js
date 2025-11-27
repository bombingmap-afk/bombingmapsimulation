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
const cache = {};
const CACHE_TTL_MS = 5000;
exports.getRankings = functions.https.onCall(async (data) => {
    var _a, _b;
    const { date } = data || {};
    if (!date)
        throw new functions.https.HttpsError("invalid-argument", "'date' required");
    const todayId = new Date(date).toISOString().split("T")[0];
    const yesterdayDate = new Date(date);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayId = yesterdayDate.toISOString().split("T")[0];
    const cacheKey = `${todayId}-${yesterdayId}`;
    const now = Date.now();
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL_MS) {
        return cache[cacheKey].data;
    }
    const [todaySnap, yesterdaySnap] = await Promise.all([
        firebase_1.db.collection("stats_daily").doc(todayId).get(),
        firebase_1.db.collection("stats_daily").doc(yesterdayId).get(),
    ]);
    const todayData = ((_a = todaySnap.data()) === null || _a === void 0 ? void 0 : _a.countries) || {};
    const yesterdayData = ((_b = yesterdaySnap.data()) === null || _b === void 0 ? void 0 : _b.countries) || {};
    const buildRanks = (data) => {
        const sorted = Object.entries(data)
            .map(([country, bombCount]) => ({ country, bombCount: bombCount }))
            .sort((a, b) => b.bombCount - a.bombCount);
        const ranks = new Map();
        let prevCount = null;
        let prevRank = 0;
        for (let i = 0; i < sorted.length; i++) {
            const item = sorted[i];
            if (prevCount !== null && item.bombCount === prevCount) {
                // egalité -> même rang que prevRank
                ranks.set(item.country, prevRank);
            }
            else {
                const rank = i + 1;
                prevRank = rank;
                prevCount = item.bombCount;
                ranks.set(item.country, rank);
            }
        }
        return {
            ranks,
            sorted,
        };
    };
    const { ranks: todayRanks, sorted: todaySorted } = buildRanks(todayData);
    const { ranks: yesterdayRanks, sorted: yesterdaySorted } = buildRanks(yesterdayData);
    const referenceCount = Math.max(todaySorted.length, yesterdaySorted.length);
    const defaultYesterdayRank = referenceCount + 1;
    const trending = todaySorted.map((t, idx) => {
        var _a;
        const country = t.country;
        const todayRank = (_a = todayRanks.get(country)) !== null && _a !== void 0 ? _a : (idx + 1);
        const yesterdayRankRaw = yesterdayRanks.get(country);
        const yesterdayRank = typeof yesterdayRankRaw === "number" ? yesterdayRankRaw : defaultYesterdayRank;
        const change = yesterdayRank - todayRank;
        return {
            country,
            todayRank,
            yesterdayRank,
            change,
            bombCount: t.bombCount,
        };
    });
    const returnData = { trending };
    cache[cacheKey] = { timestamp: now, data: returnData };
    return returnData;
});
//# sourceMappingURL=getRankings.js.map
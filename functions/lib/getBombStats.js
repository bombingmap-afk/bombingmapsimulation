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
exports.getBombStats = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("./firebase");
let bombStatsCache = null;
const CACHE_TTL_MS = 5000;
exports.getBombStats = functions.https.onCall(async (data, context) => {
    var _a, _b;
    const { days, country } = data || {};
    if (!days || typeof days !== "number" || days <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "'days' must be a positive number.");
    }
    if (country && typeof country !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "'country' must be a string if provided.");
    }
    const key = `${days}_${country || "ALL"}`;
    const now = Date.now();
    if (bombStatsCache && bombStatsCache.key === key) {
        if (now - bombStatsCache.timestamp < CACHE_TTL_MS) {
            return bombStatsCache.result;
        }
    }
    const today = new Date();
    const daily = [];
    let total = 0;
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];
        const doc = await firebase_1.db.collection("stats_daily").doc(dayStr).get();
        let count = 0;
        if (doc.exists) {
            const data = doc.data() || {};
            if (country && country.trim() !== "") {
                count = (((_a = data.countries) === null || _a === void 0 ? void 0 : _a[country.trim()]) || 0);
            }
            else {
                count = (data.total || 0);
            }
        }
        daily.push({ date: dayStr, count });
        total += count;
    }
    const average = daily.length > 0 ? total / daily.length : 0;
    const record = daily.reduce((max, d) => (d.count > max.count ? d : max), { date: ((_b = daily[0]) === null || _b === void 0 ? void 0 : _b.date) || null, count: 0 });
    const result = {
        total,
        average,
        record,
        daily,
    };
    bombStatsCache = {
        timestamp: now,
        key,
        result,
    };
    return result;
});
//# sourceMappingURL=getBombStats.js.map
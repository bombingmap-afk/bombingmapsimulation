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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropBomb = exports.canBombTodayServer = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const crypto_1 = __importDefault(require("crypto"));
const firebase_1 = require("./firebase");
const IP_LIMIT = 3;
// --- HMAC IP hashing utils ---
const MASTER_KEY = ((_b = (_a = functions.config()) === null || _a === void 0 ? void 0 : _a.iphash) === null || _b === void 0 ? void 0 : _b.key) || process.env.MASTER_IP_KEY || "";
if (!MASTER_KEY) {
    console.warn("WARNING: MASTER_KEY for IP hashing not set (functions.config().iphash.key).");
}
function getDayString(date = new Date()) {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
}
// derive a daily key from the master key: HMAC(masterKey, day)
function deriveDailyKey(masterKeyHex, dayStr) {
    const masterKey = Buffer.from(masterKeyHex, "hex");
    return crypto_1.default.createHmac("sha256", masterKey).update(dayStr).digest();
}
// hash ip with daily key, return truncated hex (configurable)
function hashIpForToday(ip, masterKeyHex, truncateHex = 32) {
    const dayStr = getDayString();
    const dailyKey = deriveDailyKey(masterKeyHex, dayStr); // Buffer
    const h = crypto_1.default.createHmac("sha256", dailyKey).update(ip).digest("hex");
    return h.slice(0, truncateHex); // default 32 hex chars = 128 bits
}
// --- Helpers ---
function toISODateString(dateStrOrIso) {
    const d = typeof dateStrOrIso === "string" ? new Date(dateStrOrIso) : dateStrOrIso;
    return d.toISOString();
}
function isSameDayUTC(isoA, isoB) {
    const dayA = toISODateString(isoA).split("T")[0];
    const dayB = toISODateString(isoB).split("T")[0];
    return dayA === dayB;
}
const canBombTodayServer = (lastBombDate) => {
    if (!lastBombDate)
        return true;
    return !isSameDayUTC(lastBombDate, new Date().toISOString());
};
exports.canBombTodayServer = canBombTodayServer;
function safeId(id) {
    return id.replace(/[:./\\#\$[\]]/g, "_");
}
function todayKey(prefix, id) {
    const today = new Date().toISOString().split("T")[0];
    return `${prefix}_${safeId(id)}_${today}`;
}
function getClientIp(rawRequest) {
    var _a, _b;
    const xff = (_a = rawRequest === null || rawRequest === void 0 ? void 0 : rawRequest.headers) === null || _a === void 0 ? void 0 : _a["x-forwarded-for"];
    if (xff)
        return xff.split(",")[0].trim();
    // @ts-ignore
    return (rawRequest === null || rawRequest === void 0 ? void 0 : rawRequest.ip) || ((_b = rawRequest === null || rawRequest === void 0 ? void 0 : rawRequest.connection) === null || _b === void 0 ? void 0 : _b.remoteAddress) || "unknown";
}
exports.dropBomb = functions.https.onCall(async (data, context) => {
    const { country, message, sessionId, gifUrl, source } = data || {};
    if (!country || !message || !sessionId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields (country, message, sessionId).");
    }
    // get client IP from rawRequest
    const rawReq = context.rawRequest;
    const ip = getClientIp(rawReq); // ta fonction existante
    // compute hashed ip (never store raw ip)
    const ipHash = MASTER_KEY ? hashIpForToday(ip, MASTER_KEY, 32) : "no_key_" + getDayString();
    const ipDocId = todayKey("ip", ipHash); // ip_<hash>_YYYY-MM-DD
    const sessionDocId = todayKey("session", sessionId);
    const ipDocRef = firebase_1.db.collection("ipCounters").doc(ipDocId);
    const sessionDocRef = firebase_1.db.collection("sessions").doc(sessionDocId);
    const statsDailyRef = firebase_1.db.collection("stats_daily").doc(getDayString());
    const bombsRef = firebase_1.db.collection("bombs").doc();
    const stats24hRef = firebase_1.db.collection("stats_24h").doc("counts");
    try {
        await firebase_1.db.runTransaction(async (tx) => {
            var _a, _b, _c;
            const [ipSnap, sessionSnap] = await Promise.all([
                tx.get(ipDocRef),
                tx.get(sessionDocRef)
            ]);
            const ipCount = ipSnap.exists ? ((_b = (_a = ipSnap.data()) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0) : 0;
            if (ipCount >= IP_LIMIT) {
                throw new functions.https.HttpsError("resource-exhausted", "IP limit reached for today");
            }
            if (sessionSnap.exists) {
                const lastBombDate = (_c = sessionSnap.data()) === null || _c === void 0 ? void 0 : _c.lastBombDate;
                if (!(0, exports.canBombTodayServer)(lastBombDate)) {
                    throw new functions.https.HttpsError("already-exists", "This session has already sent a bomb today");
                }
            }
            const nextMidnight = new Date();
            nextMidnight.setUTCHours(24, 0, 0, 0);
            const expiresAt = admin.firestore.Timestamp.fromDate(nextMidnight);
            const bombExpiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
            tx.set(ipDocRef, {
                count: ipCount + 1,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt,
            }, { merge: true });
            const nowIso = new Date().toISOString();
            tx.set(sessionDocRef, {
                lastBombDate: nowIso,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt,
            }, { merge: true });
            tx.set(bombsRef, {
                country,
                message,
                gifUrl: gifUrl !== null && gifUrl !== void 0 ? gifUrl : null,
                source: source !== null && source !== void 0 ? source : null,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: bombExpiresAt
            });
            tx.set(statsDailyRef, {
                total: admin.firestore.FieldValue.increment(1),
                countries: {
                    [country]: admin.firestore.FieldValue.increment(1)
                }
            }, { merge: true });
            tx.set(stats24hRef, {
                total: admin.firestore.FieldValue.increment(1),
                countries: {
                    [country]: admin.firestore.FieldValue.increment(1),
                },
            }, { merge: true });
        });
        return { ok: true };
    }
    catch (err) {
        if (err instanceof functions.https.HttpsError)
            throw err;
        console.error("dropBomb error:", err);
        throw new functions.https.HttpsError("internal", "Internal server error");
    }
});
//# sourceMappingURL=dropBomb.js.map
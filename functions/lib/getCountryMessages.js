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
exports.getCountryMessages = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("./firebase");
exports.getCountryMessages = functions.https.onCall(async (data, context) => {
    const { country, limit = 10, lastTimestamp } = data || {};
    if (country && typeof country !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "'country' must be a string if provided");
    }
    if (typeof limit !== "number" || limit <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "'limit' must be a positive number");
    }
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    try {
        let queryRef = firebase_1.db
            .collection("bombs")
            .where("timestamp", ">=", startDate)
            .where("timestamp", "<=", endDate)
            .orderBy("timestamp", "desc")
            .limit(limit);
        if (country === null || country === void 0 ? void 0 : country.trim()) {
            queryRef = queryRef.where("country", "==", country.trim());
        }
        // Pagination par curseur
        if (lastTimestamp) {
            const lastDate = new Date(lastTimestamp);
            queryRef = queryRef.startAfter(lastDate);
        }
        const querySnapshot = await queryRef.get();
        const messages = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { timestamp: data.timestamp.toDate().toISOString() });
        });
        let total = querySnapshot.size;
        if (!lastTimestamp) {
            let totalQueryRef = firebase_1.db
                .collection("bombs")
                .where("timestamp", ">=", startDate)
                .where("timestamp", "<=", endDate);
            if (country === null || country === void 0 ? void 0 : country.trim()) {
                totalQueryRef = totalQueryRef.where("country", "==", country.trim());
            }
            const totalSnapshot = await totalQueryRef.get();
            total = totalSnapshot.size;
        }
        return { messages, total };
    }
    catch (err) {
        console.error("getCountryMessages error:", err);
        throw new functions.https.HttpsError("internal", "Internal server error");
    }
});
//# sourceMappingURL=getCountryMessages.js.map
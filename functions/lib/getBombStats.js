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
exports.getBombStats = functions.https.onCall(async (data, context) => {
    const { days, country } = data || {};
    // --- VALIDATIONS ---
    if (!days || typeof days !== "number" || days <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "'days' must be a positive number.");
    }
    if (country && typeof country !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "'country' must be a string if provided.");
    }
    // --- TIME WINDOW ---
    const endDate = new Date(); // today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // --- Build query ---
    let query = firebase_1.db.collection("bombs")
        .where("timestamp", ">=", startDate)
        .where("timestamp", "<=", endDate);
    if (country && typeof country === "string" && country.trim() !== "") {
        query = query.where("country", "==", country.trim());
    }
    const snapshot = await query.get();
    if (snapshot.empty) {
        return {
            daily: [],
            total: 0,
            average: 0,
            record: { date: null, count: 0 }
        };
    }
    // --- Count bombs per day ---
    const dayCounts = {};
    snapshot.forEach(doc => {
        const ts = doc.data().timestamp.toDate();
        const day = ts.toISOString().split("T")[0];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    // --- Convert to array ---
    const daily = Object.entries(dayCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    // --- TOTAL ---
    const total = daily.reduce((sum, d) => sum + d.count, 0);
    // --- AVERAGE ---
    const average = daily.length > 0 ? total / daily.length : 0;
    // --- RECORD ---
    const record = daily.reduce((max, d) => (d.count > max.count ? d : max), { date: "", count: 0 });
    return {
        total,
        average,
        record,
        daily,
    };
});
//# sourceMappingURL=getBombStats.js.map
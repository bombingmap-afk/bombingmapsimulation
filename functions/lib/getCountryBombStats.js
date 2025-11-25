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
exports.getCountryBombStats = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("./firebase");
exports.getCountryBombStats = functions.https.onCall(async (data, context) => {
    const { days } = data || {};
    if (!days || typeof days !== "number" || days <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "'days' must be a positive number.");
    }
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Firestore query
    const snapshot = await firebase_1.db
        .collection("bombs")
        .where("timestamp", ">=", startDate)
        .where("timestamp", "<=", endDate)
        .get();
    const countryCounts = {};
    snapshot.forEach((doc) => {
        var _a;
        const c = (_a = doc.data().country) === null || _a === void 0 ? void 0 : _a.trim();
        if (!c)
            return;
        countryCounts[c] = (countryCounts[c] || 0) + 1;
    });
    const total = Object.values(countryCounts).reduce((sum, n) => sum + n, 0);
    return {
        countryCounts,
        total,
    };
});
//# sourceMappingURL=getCountryBombStats.js.map
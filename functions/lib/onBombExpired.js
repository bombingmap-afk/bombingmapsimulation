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
exports.onBombExpired = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("./firebase");
exports.onBombExpired = functions.firestore
    .document("bombs/{bombId}")
    .onDelete(async (snap, context) => {
    var _a;
    const data = snap.data();
    if (!data)
        return;
    const bombId = context.params.bombId;
    const country = data.country;
    const bombDate = ((_a = data.timestamp) === null || _a === void 0 ? void 0 : _a.toDate)
        ? data.timestamp.toDate()
        : new Date(data.timestamp);
    const dayId = bombDate.toISOString().split("T")[0];
    const stats24hRef = firebase_1.db.collection("stats_24h").doc("counts");
    const expiredRef = firebase_1.db
        .collection("expired_bombs")
        .doc(dayId)
        .collection("items")
        .doc(bombId);
    try {
        await firebase_1.db.runTransaction(async (tx) => {
            tx.set(stats24hRef, {
                total: admin.firestore.FieldValue.increment(-1),
                countries: {
                    [country]: admin.firestore.FieldValue.increment(-1),
                },
            }, { merge: true });
            tx.set(expiredRef, Object.assign(Object.assign({}, data), { expiredAt: admin.firestore.FieldValue.serverTimestamp(), expiredDate: dayId }));
        });
        console.log(`Bomb ${bombId} moved to expired_bombs/${dayId}`);
    }
    catch (err) {
        console.error("Error in onBombExpired:", err);
    }
});
//# sourceMappingURL=onBombExpired.js.map
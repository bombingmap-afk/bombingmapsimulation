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
exports.expireBombsBatch = void 0;
exports.expireBombsLogic = expireBombsLogic;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("./firebase");
async function expireBombsLogic() {
    const now = admin.firestore.Timestamp.now();
    const expiredSnapshot = await firebase_1.db
        .collection("bombs")
        .where("expiresAt", "<=", now)
        .limit(500)
        .get();
    if (expiredSnapshot.empty)
        return 0;
    const countryCounts = {};
    const batch = firebase_1.db.batch();
    expiredSnapshot.docs.forEach((doc) => {
        var _a, _b;
        const data = doc.data();
        const country = data.country;
        countryCounts[country] = (countryCounts[country] || 0) + 1;
        const bombDate = ((_b = (_a = data.timestamp) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(data.timestamp);
        const dayId = bombDate.toISOString().split("T")[0];
        const expiredRef = firebase_1.db
            .collection("expired_bombs")
            .doc(dayId)
            .collection("items")
            .doc(doc.id);
        batch.set(expiredRef, Object.assign(Object.assign({}, data), { expiredAt: now, expiredDate: dayId }));
        batch.delete(doc.ref);
    });
    const statsRef = firebase_1.db.collection("stats_24h").doc("counts");
    const statsUpdate = { total: admin.firestore.FieldValue.increment(-expiredSnapshot.size) };
    for (const country in countryCounts) {
        statsUpdate[`countries.${country}`] = admin.firestore.FieldValue.increment(-countryCounts[country]);
    }
    batch.set(statsRef, statsUpdate, { merge: true });
    await batch.commit();
    return expiredSnapshot.size;
}
exports.expireBombsBatch = functions.pubsub
    .schedule("every 1 hours")
    .timeZone("Etc/UTC")
    .onRun(async () => {
    await expireBombsLogic();
    return null;
});
//# sourceMappingURL=expireBombsBatch.js.map
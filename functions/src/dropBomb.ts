import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import crypto from "crypto";
import { db } from "./firebase";

const IP_LIMIT = 3;


// --- HMAC IP hashing utils ---
const MASTER_KEY = functions.config()?.iphash?.key || process.env.MASTER_IP_KEY || "";

if (!MASTER_KEY) {
  console.warn("WARNING: MASTER_KEY for IP hashing not set (functions.config().iphash.key).");
}

function getDayString(date = new Date()): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

// derive a daily key from the master key: HMAC(masterKey, day)
function deriveDailyKey(masterKeyHex: string, dayStr: string): Buffer {
  const masterKey = Buffer.from(masterKeyHex, "hex");
  return crypto.createHmac("sha256", masterKey).update(dayStr).digest();
}

// hash ip with daily key, return truncated hex (configurable)
function hashIpForToday(ip: string, masterKeyHex: string, truncateHex = 32): string {
  const dayStr = getDayString();
  const dailyKey = deriveDailyKey(masterKeyHex, dayStr); // Buffer
  const h = crypto.createHmac("sha256", dailyKey).update(ip).digest("hex");
  return h.slice(0, truncateHex); // default 32 hex chars = 128 bits
}

// --- Helpers ---
function toISODateString(dateStrOrIso: string | Date): string {
  const d = typeof dateStrOrIso === "string" ? new Date(dateStrOrIso) : dateStrOrIso;
  return d.toISOString();
}

function isSameDayUTC(isoA: string, isoB: string): boolean {
  const dayA = toISODateString(isoA).split("T")[0];
  const dayB = toISODateString(isoB).split("T")[0];
  return dayA === dayB;
}

export const canBombTodayServer = (lastBombDate: string | null): boolean => {
  if (!lastBombDate) return true;
  return !isSameDayUTC(lastBombDate, new Date().toISOString());
};

function safeId(id: string): string {
  return id.replace(/[:./\\#\$[\]]/g, "_");
}

function todayKey(prefix: string, id: string) {
  const today = new Date().toISOString().split("T")[0];
  return `${prefix}_${safeId(id)}_${today}`;
}

function getClientIp(rawRequest: functions.https.CallableContext["rawRequest"]): string {
  const xff = rawRequest?.headers?.["x-forwarded-for"] as string | undefined;
  if (xff) return xff.split(",")[0].trim();

  // @ts-ignore
  return rawRequest?.ip || rawRequest?.connection?.remoteAddress || "unknown";
}

export const dropBomb = functions.https.onCall(
  async (
    data: any,
    context: functions.https.CallableContext
  ): Promise<{ ok: boolean }> => {

    const { country, message, sessionId, gifUrl, source } = data || {};

    if (!country || !message || !sessionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields (country, message, sessionId)."
      );
    }

    const emojiRegex = /\p{Extended_Pictographic}/gu;

    if (message.length > 70) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Message too long, max 70 characters"
      );
    }

    const nonEmoji = message.replace(emojiRegex, "");
    if (nonEmoji.length > 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Message must contain only emojis"
      );
    }

    // get client IP from rawRequest
    const rawReq = context.rawRequest as any;
    const ip = getClientIp(rawReq); 

    // compute hashed ip (never store raw ip)
    const ipHash = MASTER_KEY ? hashIpForToday(ip, MASTER_KEY, 32) : "no_key_" + getDayString();
    const ipDocId = todayKey("ip", ipHash); // ip_<hash>_YYYY-MM-DD
    const sessionDocId = todayKey("session", sessionId);

    const ipDocRef = db.collection("ipCounters").doc(ipDocId);
    const sessionDocRef = db.collection("sessions").doc(sessionDocId);
    const statsDailyRef = db.collection("stats_daily").doc(getDayString());
    const bombsRef = db.collection("bombs").doc();
    const stats24hRef = db.collection("stats_24h").doc("counts");

    try {
      await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
        const [ipSnap, sessionSnap] = await Promise.all([
          tx.get(ipDocRef),
          tx.get(sessionDocRef)
        ]);

        const ipCount = ipSnap.exists ? (ipSnap.data()?.count ?? 0) : 0;

        if (ipCount >= IP_LIMIT) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            "IP limit reached for today"
          );
        }

        if (sessionSnap.exists) {
          const lastBombDate = sessionSnap.data()?.lastBombDate as string | null;
          if (!canBombTodayServer(lastBombDate)) {
            throw new functions.https.HttpsError(
              "already-exists",
              "This session has already sent a bomb today"
            );
          }
        }

        const nextMidnight = new Date();
        nextMidnight.setUTCHours(24, 0, 0, 0);
        const expiresAt = admin.firestore.Timestamp.fromDate(nextMidnight);
        const bombExpiresAt = admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 24 * 60 * 60 * 1000)
        )

        tx.set(
          ipDocRef,
          {
            count: ipCount + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
          },
          { merge: true }
        );

        const nowIso = new Date().toISOString();
        tx.set(
          sessionDocRef,
          {
            lastBombDate: nowIso,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
          },
          { merge: true }
        );

        tx.set(bombsRef, {
          country,
          message,
          gifUrl: gifUrl ?? null,
          source: source ?? null,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: bombExpiresAt
        });

        tx.set(
          statsDailyRef,
          {
            total: admin.firestore.FieldValue.increment(1),
            countries: {
              [country]: admin.firestore.FieldValue.increment(1)
            }
          },
          { merge: true }
        );

        tx.set(
          stats24hRef,
          {
            total: admin.firestore.FieldValue.increment(1),
            countries: {
              [country]: admin.firestore.FieldValue.increment(1),
            },
          },
          { merge: true }
        );
      });

      return { ok: true };
    } catch (err: any) {
      if (err instanceof functions.https.HttpsError) throw err;
      console.error("dropBomb error:", err);
      throw new functions.https.HttpsError("internal", "Internal server error");
    }
  }
);



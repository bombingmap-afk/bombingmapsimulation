import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import crypto from "crypto";
import { db } from "./firebase";

const IP_LIMIT = 3;
const MASTER_KEY = functions.config()?.iphash?.key || process.env.MASTER_IP_KEY || "";
const TURNSTILE_SECRET = functions.config()?.turnstile?.secret || process.env.TURNSTILE_SECRET || "";

if (!MASTER_KEY) {
  console.warn("⚠️ MASTER_KEY not set");
}
if (!TURNSTILE_SECRET) {
  console.warn("⚠️ TURNSTILE_SECRET not set - Bot protection disabled!");
}

// --- Vérification Turnstile ---
async function verifyTurnstile(token: string | undefined, remoteIp: string): Promise<void> {
  if (!TURNSTILE_SECRET) {
    console.error("Turnstile secret not configured");
    throw new functions.https.HttpsError("internal", "Bot protection not configured");
  }

  if (!token) {
    throw new functions.https.HttpsError("invalid-argument", "Missing verification token");
  }

  try {
    // Utilise fetch natif (Node 18+) ou importe node-fetch
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
        remoteip: remoteIp,
      }),
    });

    if (!response.ok) {
      console.error("Turnstile API error:", response.status);
      throw new functions.https.HttpsError("internal", "Verification service unavailable");
    }

    const result = await response.json() as { success: boolean; "error-codes"?: string[] };

    if (!result.success) {
      console.warn("Turnstile verification failed:", result["error-codes"]);
      throw new functions.https.HttpsError("permission-denied", "Bot verification failed");
    }

    console.log("✓ Turnstile verification passed");
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error("Turnstile verification error:", error);
    throw new functions.https.HttpsError("internal", "Verification failed");
  }
}

// --- Helpers (garde ton code existant) ---
function getDayString(date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function deriveDailyKey(masterKeyHex: string, dayStr: string): Buffer {
  const masterKey = Buffer.from(masterKeyHex, "hex");
  return crypto.createHmac("sha256", masterKey).update(dayStr).digest();
}

function hashIpForToday(ip: string, masterKeyHex: string, truncateHex = 32): string {
  const dayStr = getDayString();
  const dailyKey = deriveDailyKey(masterKeyHex, dayStr);
  const h = crypto.createHmac("sha256", dailyKey).update(ip).digest("hex");
  return h.slice(0, truncateHex);
}

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
  const today = getDayString();
  return `${prefix}_${safeId(id)}_${today}`;
}

function getClientIp(rawRequest: any): string {
  const xff = rawRequest?.headers?.["x-forwarded-for"] as string | undefined;
  if (xff) return xff.split(",")[0].trim();
  return rawRequest?.ip || rawRequest?.connection?.remoteAddress || "unknown";
}

// Validation stricte des emojis
function isEmojiOnly(text: string): boolean {
  // Regex qui vérifie que le texte contient UNIQUEMENT des emojis et espaces
  const emojiOnlyRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\s]+$/u;
  return emojiOnlyRegex.test(text.trim());
}

// --- Cloud Function ---
export const dropBomb = functions.runWith({
  timeoutSeconds: 15,
  memory: "256MB",
  maxInstances: 30, // Suffisant pour ton trafic
}).https.onCall(
  async (
    data: any,
    context: functions.https.CallableContext
  ): Promise<{ ok: boolean }> => {

    const { country, message, sessionId, gifUrl, source, turnstileToken } = data || {};

    // === VALIDATION BASIQUE ===
    if (!country || !message || !sessionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields"
      );
    }

    if (typeof message !== "string" || message.length > 70) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Message too long (max 70 characters)"
      );
    }

    if (!isEmojiOnly(message)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Message must contain only emojis"
      );
    }

    // === VÉRIFICATION TURNSTILE (PREMIÈRE LIGNE DE DÉFENSE) ===
    const rawReq = context.rawRequest as any;
    const ip = getClientIp(rawReq);
    
    await verifyTurnstile(turnstileToken, ip);

    // === IP HASHING ===
    const ipHash = MASTER_KEY ? hashIpForToday(ip, MASTER_KEY, 32) : "no_key_" + getDayString();
    const ipDocId = todayKey("ip", ipHash);
    const sessionDocId = todayKey("session", sessionId);

    // === REFS FIRESTORE ===
    const ipDocRef = db.collection("ipCounters").doc(ipDocId);
    const sessionDocRef = db.collection("sessions").doc(sessionDocId);
    const statsDailyRef = db.collection("stats_daily").doc(getDayString());
    const bombsRef = db.collection("bombs").doc();
    const stats24hRef = db.collection("stats_24h").doc("counts");

    // === TRANSACTION ===
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
              "You already sent a bomb today"
            );
          }
        }

        const nextMidnight = new Date();
        nextMidnight.setUTCHours(24, 0, 0, 0);
        const expiresAt = admin.firestore.Timestamp.fromDate(nextMidnight);
        const bombExpiresAt = admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 24 * 60 * 60 * 1000)
        );

        // Mise à jour IP counter
        tx.set(
          ipDocRef,
          {
            count: ipCount + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
          },
          { merge: true }
        );

        // Mise à jour session
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

        // Création de la bombe
        tx.set(bombsRef, {
          country,
          message,
          gifUrl: gifUrl ?? null,
          source: source ?? null,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: bombExpiresAt
        });

        // Statistiques journalières
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

        // Statistiques 24h
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

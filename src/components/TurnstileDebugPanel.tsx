import { functions } from "../config/firebase";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";

export default function TurnstileDebugPanel() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (msg: string) => {
    setResults((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  };

  // Test 1 : Requête sans token
  const testNoToken = async () => {
    setIsLoading(true);
    addResult("🧪 Test 1: Envoi sans token Turnstile...");

    try {
      const dropBomb = httpsCallable(functions, "dropBomb");
      await dropBomb({
        country: "FR",
        message: "💣",
        sessionId: "debug-session-" + Date.now(),
        // turnstileToken manquant !
      });
      addResult("❌ ÉCHEC : La requête a été acceptée sans token !");
    } catch (error: any) {
      if (error.code === "invalid-argument") {
        addResult("✅ SUCCÈS : Requête bloquée (Missing verification token)");
      } else {
        addResult(`⚠️ Erreur inattendue: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Test 2 : Requête avec faux token
  const testFakeToken = async () => {
    setIsLoading(true);
    addResult("🧪 Test 2: Envoi avec FAUX token...");

    try {
      const dropBomb = httpsCallable(functions, "dropBomb");
      await dropBomb({
        country: "FR",
        message: "💣",
        sessionId: "debug-session-" + Date.now(),
        turnstileToken: "FAKE_TOKEN_" + Math.random(),
      });
      addResult("❌ ÉCHEC : Faux token accepté !");
    } catch (error: any) {
      if (error.code === "permission-denied") {
        addResult("✅ SUCCÈS : Faux token rejeté (Bot verification failed)");
      } else {
        addResult(`⚠️ Erreur inattendue: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Test 3 : Spam de requêtes
  const testSpam = async () => {
    setIsLoading(true);
    addResult("🧪 Test 3: Spam de 5 requêtes rapides...");

    const dropBomb = httpsCallable(functions, "dropBomb");
    let blocked = 0;
    let success = 0;

    for (let i = 0; i < 5; i++) {
      try {
        await dropBomb({
          country: "FR",
          message: "💣",
          sessionId: "spam-" + i,
          turnstileToken: "FAKE_" + i,
        });
        success++;
      } catch (error: any) {
        blocked++;
        if (i === 0) {
          addResult(`Requête ${i + 1}: Bloquée (${error.code})`);
        }
      }

      // Petit délai entre les requêtes
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    addResult(
      `✅ Résultat: ${blocked}/5 requêtes bloquées, ${success}/5 passées`
    );
    if (success > 0) {
      addResult("⚠️ ATTENTION : Des requêtes spam ont réussi !");
    }

    setIsLoading(false);
  };

  // Test 4 : Token expiré (simulé)
  const testExpiredToken = async () => {
    setIsLoading(true);
    addResult("🧪 Test 4: Token expiré (attendre 5min après génération)...");
    addResult("ℹ️ Les tokens Turnstile expirent après 5 minutes");

    // Tu devras copier un vrai token et attendre 5min
    const oldToken = prompt("Colle un token généré il y a plus de 5 minutes:");

    if (!oldToken) {
      addResult("❌ Test annulé");
      setIsLoading(false);
      return;
    }

    try {
      const dropBomb = httpsCallable(functions, "dropBomb");
      await dropBomb({
        country: "FR",
        message: "💣",
        sessionId: "expired-test",
        turnstileToken: oldToken,
      });
      addResult("❌ ÉCHEC : Token expiré accepté !");
    } catch (error: any) {
      addResult(`✅ SUCCÈS : Token expiré rejeté (${error.code})`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-4 max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">🔬 Turnstile Debug Panel</h3>
        <button
          onClick={() => setResults([])}
          className="text-gray-400 hover:text-white text-xs"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={testNoToken}
          disabled={isLoading}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm transition"
        >
          Test 1: Sans token
        </button>

        <button
          onClick={testFakeToken}
          disabled={isLoading}
          className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-sm transition"
        >
          Test 2: Faux token
        </button>

        <button
          onClick={testSpam}
          disabled={isLoading}
          className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-sm transition"
        >
          Test 3: Spam (5x)
        </button>

        <button
          onClick={testExpiredToken}
          disabled={isLoading}
          className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded text-sm transition"
        >
          Test 4: Token expiré
        </button>
      </div>

      <div className="bg-gray-900 rounded p-3 text-xs font-mono max-h-64 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-gray-500">Aucun test lancé</p>
        ) : (
          results.map((result, idx) => (
            <div
              key={idx}
              className={`mb-1 ${
                result.includes("✅")
                  ? "text-green-400"
                  : result.includes("❌")
                  ? "text-red-400"
                  : result.includes("⚠️")
                  ? "text-yellow-400"
                  : "text-gray-300"
              }`}
            >
              {result}
            </div>
          ))
        )}
      </div>

      {isLoading && (
        <div className="mt-3 text-center text-yellow-400 text-sm">
          ⏳ Test en cours...
        </div>
      )}
    </div>
  );
}

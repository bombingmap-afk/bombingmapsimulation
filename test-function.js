/**
 * Script de test pour la Cloud Function dropBomb
 *
 * Usage:
 * node test-function.js
 *
 * Ce script teste:
 * 1. Appel réussi de dropBomb
 * 2. Validation des limites de session
 * 3. Validation des limites IP
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Configuration Firebase (même que dans votre app)
const firebaseConfig = {
  apiKey: "AIzaSyDeLj0KksVcCGvXjWs-mXn7Dyr8r3Y6gFw",
  authDomain: "bombingmap.firebaseapp.com",
  projectId: "bombingmap",
  storageBucket: "bombingmap.firebasestorage.app",
  messagingSenderId: "868119040139",
  appId: "1:868119040139:web:5a51e18344df5638a9848e"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Fonction de test
async function testDropBomb() {
  console.log('🧪 Test de la fonction dropBomb\n');

  const dropBomb = httpsCallable(functions, 'dropBomb');
  const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Test 1: Premier appel (devrait réussir)
    console.log('Test 1: Premier appel...');
    const result1 = await dropBomb({
      country: 'Test Country',
      message: 'Test bomb from automated test',
      sessionId: sessionId,
      gifUrl: null,
      source: null
    });

    if (result1.data.ok) {
      console.log('✅ Test 1 réussi: Bombe envoyée\n');
    } else {
      console.error('❌ Test 1 échoué: Résultat inattendu\n');
      return;
    }

    // Test 2: Deuxième appel avec même session (devrait échouer)
    console.log('Test 2: Deuxième appel avec même session...');
    try {
      await dropBomb({
        country: 'Test Country',
        message: 'Second test bomb',
        sessionId: sessionId,
        gifUrl: null,
        source: null
      });
      console.error('❌ Test 2 échoué: Devrait rejeter le double envoi\n');
    } catch (error) {
      if (error.code === 'already-exists') {
        console.log('✅ Test 2 réussi: Session bloquée correctement\n');
      } else {
        console.error('❌ Test 2 échoué: Erreur inattendue:', error.message, '\n');
      }
    }

    // Test 3: Avec nouvelle session (devrait réussir)
    const newSessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Test 3: Nouvelle session...');
    try {
      const result3 = await dropBomb({
        country: 'Test Country',
        message: 'Third test bomb',
        sessionId: newSessionId,
        gifUrl: null,
        source: null
      });

      if (result3.data.ok) {
        console.log('✅ Test 3 réussi: Nouvelle session acceptée\n');
      }
    } catch (error) {
      if (error.code === 'resource-exhausted') {
        console.log('⚠️  Test 3: Limite IP atteinte (normal après 3 bombes)\n');
      } else {
        console.error('❌ Test 3 échoué:', error.message, '\n');
      }
    }

    console.log('✨ Tests terminés!\n');
    console.log('🔍 Vérifiez Firebase Console:');
    console.log('   - Collection "bombs" pour voir les bombes');
    console.log('   - Collection "sessions" pour voir les sessions');
    console.log('   - Collection "ipCounters" pour voir les compteurs IP');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
  }
}

// Exécuter les tests
testDropBomb().then(() => {
  console.log('\n✅ Script terminé');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});

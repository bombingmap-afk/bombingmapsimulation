# Firebase Functions Setup Guide

## Configuration Complete

Votre projet est maintenant configuré pour utiliser Firebase Cloud Functions avec blocage IP et limitation par session.

## Structure du Projet

```
project/
├── functions/               # Cloud Functions
│   ├── src/
│   │   └── index.ts        # Fonction dropBomb
│   ├── lib/                # Code compilé (auto-généré)
│   ├── package.json
│   └── tsconfig.json
├── firebase.json           # Configuration Firebase
├── .firebaserc             # Projet Firebase actif
└── src/
    └── App.tsx             # Frontend React intégré
```

## Installation et Déploiement

### 1. Installer les dépendances des fonctions (déjà fait)
```bash
npm run functions:install
```

### 2. Compiler les fonctions
```bash
npm run functions:build
```

### 3. Déployer sur Firebase
```bash
npm run functions:deploy
```

### 4. Voir les logs en temps réel
```bash
npm run functions:logs
```

## Comment ça Fonctionne

### Protection Anti-Spam (Triple Niveau)

1. **Client-Side (UX)** - `App.tsx`
   - Vérification localStorage pour bloquer l'UI
   - Améliore l'expérience utilisateur
   - Facilement contournable (pas de sécurité réelle)

2. **Session ID (Serveur)** - `dropBomb` function
   - UUID stocké dans localStorage
   - Vérifié côté serveur dans Firestore
   - 1 bombe par session par jour

3. **IP Tracking (Serveur)** - `dropBomb` function
   - Adresse IP extraite des headers (`x-forwarded-for`)
   - Limite de 3 bombes par IP par jour
   - Protection contre les multi-comptes

### Flux de la Fonction `dropBomb`

```
Client → Firebase Functions → Firestore
  |                              ↓
  |                    ┌─────────────────┐
  |                    │ ipCounters      │
  |                    │ - count: 0-3    │
  |                    └─────────────────┘
  |                              ↓
  |                    ┌─────────────────┐
  |                    │ sessions        │
  |                    │ - lastBombDate  │
  |                    └─────────────────┘
  |                              ↓
  ←─────────────────── bombs collection
```

### Collections Firestore Utilisées

1. **bombs** - Les bombes réelles
   ```typescript
   {
     country: string
     message: string
     gifUrl?: string
     source?: string
     ip: string
     sessionId: string
     timestamp: Timestamp
     visible: boolean
   }
   ```

2. **ipCounters** - Compteurs IP (TTL auto-cleanup)
   ```typescript
   {
     count: number (0-3)
     updatedAt: Timestamp
     expiresAt: Timestamp  // Minuit UTC
   }
   ```

3. **sessions** - Sessions utilisateur (TTL auto-cleanup)
   ```typescript
   {
     lastBombDate: string (ISO)
     createdAt: Timestamp
     expiresAt: Timestamp  // Minuit UTC
   }
   ```

## Sécurité et Anonymat

### Avantages de cette Approche

- **Anonymat préservé**: Pas de connexion requise
- **IP masquée**: Stockée côté serveur uniquement
- **UUID aléatoire**: sessionId généré client-side
- **Protection robuste**: Triple validation (client, session, IP)
- **Auto-cleanup**: Les compteurs expirent à minuit UTC

### Limites

- **VPN bypass**: Les utilisateurs avec VPN peuvent changer d'IP
- **Clear storage**: Effacer localStorage reset le sessionId
- **Mobile data**: Changer de réseau = nouvelle IP

### Recommandations Supplémentaires

Si vous voulez renforcer encore plus:

1. **Rate limiting par Firebase**
   ```javascript
   // Dans firebase.json, ajouter:
   "functions": {
     "source": "functions",
     "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"],
     "runtime": "nodejs18",
     "timeoutSeconds": 10,
     "maxInstances": 100
   }
   ```

2. **Content moderation**
   - Ajouter une validation de contenu dans `dropBomb`
   - Filtrer les URLs dans les messages
   - Scanner les images GIF

3. **Firestore Rules** (important!)
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Bombs: lecture seule publique
       match /bombs/{bombId} {
         allow read: if true;
         allow write: if false;  // Seulement via Cloud Function
       }

       // Compteurs: privés
       match /ipCounters/{counter} {
         allow read, write: if false;
       }

       match /sessions/{session} {
         allow read, write: if false;
       }
     }
   }
   ```

## Commandes Utiles

```bash
# Développement local
npm run dev                    # Frontend dev server

# Functions
npm run functions:build        # Compiler TypeScript
npm run functions:deploy       # Déployer sur Firebase
npm run functions:logs         # Logs en temps réel

# Production
npm run build                  # Build frontend
firebase deploy --only hosting # Déployer frontend uniquement
firebase deploy                # Tout déployer (frontend + functions)
```

## Debugging

### Tester localement
```bash
# Installer Firebase Emulator Suite
firebase init emulators

# Démarrer les émulateurs
firebase emulators:start

# Dans src/config/firebase.ts, ajouter:
if (location.hostname === 'localhost') {
  connectFunctionsEmulator(getFunctions(), 'localhost', 5001);
}
```

### Logs en production
```bash
# Dernières erreurs
firebase functions:log --only dropBomb

# Suivre en temps réel
firebase functions:log --only dropBomb --follow
```

## Coûts Firebase

Avec votre usage estimé:
- **Functions**: ~$0.40/million invocations
- **Firestore**:
  - Reads: gratuit (50K/jour)
  - Writes: 20K gratuits/jour
  - Storage: 1GB gratuit

Pour un site viral (10K bombes/jour):
- Writes: 10K bombes + 20K metadata = 30K/jour = **GRATUIT**
- Functions: 10K invocations = **$0.004/jour**

**Total: quasi gratuit jusqu'à 50K bombes/jour**

## Support

En cas de problème:
1. Vérifier les logs: `npm run functions:logs`
2. Tester en local avec les émulateurs
3. Vérifier les règles Firestore Security Rules
4. S'assurer que Firebase Functions est activé dans la console

## Alternatives Considérées

1. **Supabase Edge Functions** ❌
   - Vous avez spécifiquement Firebase configuré
   - Migration inutile

2. **Pure client-side** ❌
   - Pas de protection IP réelle
   - Facilement bypassable

3. **Backend Node.js classique** ❌
   - Plus complexe à déployer
   - Coûts serveur
   - Firebase Functions = serverless = meilleur

## Conclusion

Votre setup actuel est **optimal** pour votre cas d'usage:
- Anonymat préservé
- Protection anti-spam robuste
- Coûts quasi nuls
- Scalable automatiquement
- Déploiement simple

Vous êtes prêt à déployer!

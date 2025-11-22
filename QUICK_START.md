# 🚀 Quick Start - Déploiement en 3 Minutes

## Prérequis

1. Firebase CLI installé: `npm install -g firebase-tools`
2. Connexion Firebase: `firebase login`

## Déploiement Express

```bash
# 1. Tout déployer d'un coup
firebase deploy

# OU étape par étape:

# 1a. Déployer les règles Firestore
firebase deploy --only firestore:rules

# 1b. Déployer la Cloud Function
npm run functions:deploy

# 1c. Déployer le frontend (optionnel si vous utilisez Vercel/Netlify)
npm run build
firebase deploy --only hosting
```

## Tester que ça Marche

```bash
# Voir les logs en temps réel
npm run functions:logs

# Tester la fonction (après déploiement)
npm run functions:test
```

## Vérifier dans Firebase Console

1. **Functions** → Voir `dropBomb` déployée
2. **Firestore** → Voir les collections:
   - `bombs` (les vraies bombes)
   - `ipCounters` (compteurs IP)
   - `sessions` (sessions utilisateurs)

## Test Manuel Rapide

1. Ouvrir votre site
2. Accepter le disclaimer
3. Cliquer sur un pays
4. Envoyer une bombe
5. Réessayer → Devrait bloquer avec "already sent today"

## Commandes Utiles

```bash
# Développement
npm run dev                      # Frontend local

# Functions
npm run functions:build          # Compiler
npm run functions:deploy         # Déployer
npm run functions:logs           # Logs temps réel
npm run functions:test           # Tester

# Production
npm run build                    # Build frontend
firebase deploy                  # Tout déployer
```

## En Cas de Problème

```bash
# Recompiler les functions
npm run functions:build

# Redéployer en force
firebase deploy --only functions --force

# Voir les erreurs
npm run functions:logs
```

## Documentation Complète

- [FIREBASE_SETUP_COMPLETE.md](./FIREBASE_SETUP_COMPLETE.md) - Vue d'ensemble
- [FIREBASE_FUNCTIONS_SETUP.md](./FIREBASE_FUNCTIONS_SETUP.md) - Guide détaillé
- [DEPLOY.md](./DEPLOY.md) - Guide déploiement approfondi

## C'est Tout!

Votre site est maintenant protégé contre le spam avec:
- ✅ Limite 1 bombe/session/jour
- ✅ Limite 3 bombes/IP/jour
- ✅ Anonymat préservé
- ✅ Coûts quasi gratuits (~$0.12/mois)

**Enjoy! 🎉**

# Guide de Déploiement Rapide

## Prérequis

1. Compte Firebase créé et projet `bombingmap` configuré
2. Firebase CLI installé: `npm install -g firebase-tools`
3. Connexion Firebase: `firebase login`

## Déploiement en 3 Étapes

### 1. Déployer les Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

Cela va sécuriser votre base de données pour que:
- Les bombes soient lisibles publiquement
- Seules les Cloud Functions puissent écrire
- Les compteurs IP et sessions soient privés

### 2. Déployer la Cloud Function

```bash
npm run functions:deploy
```

Ou directement:
```bash
firebase deploy --only functions
```

Attendez le message de succès:
```
✔ functions[dropBomb(us-central1)] Successful create operation.
Function URL: https://us-central1-bombingmap.cloudfunctions.net/dropBomb
```

### 3. Déployer le Frontend (optionnel)

Si vous utilisez Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

Ou tout déployer d'un coup:
```bash
firebase deploy
```

## Vérification Post-Déploiement

### Tester la fonction

```bash
# Voir les logs en temps réel
npm run functions:logs

# Ou avec Firebase CLI
firebase functions:log --only dropBomb --follow
```

### Test manuel depuis le frontend

1. Ouvrez votre site
2. Acceptez le disclaimer
3. Cliquez sur un pays
4. Envoyez une bombe
5. Vérifiez dans Firebase Console > Firestore que:
   - Un document apparaît dans `bombs`
   - Un document apparaît dans `ipCounters`
   - Un document apparaît dans `sessions`

### Test de la limite

1. Envoyez 1 bombe (OK)
2. Essayez d'en envoyer une 2e le même jour
3. Vous devriez voir: "You already sent a bomb today (this session)"
4. Effacez localStorage et réessayez
5. Nouvelle session OK, mais après 3 IPs différentes, limite IP atteinte

## Rollback en Cas de Problème

```bash
# Revenir à la version précédente
firebase rollback functions:dropBomb

# Ou supprimer complètement
firebase functions:delete dropBomb
```

## Structure des URLs

Une fois déployé:

- **Frontend**: `https://bombingmap.web.app` ou votre domaine custom
- **Cloud Function**: `https://us-central1-bombingmap.cloudfunctions.net/dropBomb`

La fonction est appelée automatiquement via le SDK Firebase depuis `App.tsx`.

## Monitoring

### Console Firebase

Allez dans [Firebase Console](https://console.firebase.google.com/project/bombingmap):

1. **Functions** - Voir les invocations, erreurs, temps d'exécution
2. **Firestore** - Voir les données en temps réel
3. **Usage and billing** - Surveiller les coûts

### Logs

```bash
# Tous les logs
firebase functions:log

# Seulement dropBomb
firebase functions:log --only dropBomb

# Dernière heure
firebase functions:log --only dropBomb --lines 100

# Temps réel
firebase functions:log --only dropBomb --follow
```

## Dépannage

### Erreur: "insufficient permissions"

Solution:
```bash
firebase login --reauth
```

### Erreur: "Function failed to deploy"

Solution:
```bash
# Vérifier la compilation
npm run functions:build

# Réessayer
firebase deploy --only functions --force
```

### Erreur: "CORS not allowed"

Vérifiez que dans `src/config/firebase.ts`, vous avez bien initialisé Firebase avec les bonnes credentials.

### Bombes n'apparaissent pas

1. Vérifiez les Firestore Rules: `firebase deploy --only firestore:rules`
2. Vérifiez que la fonction s'exécute: `npm run functions:logs`
3. Ouvrez la console navigateur (F12) et regardez les erreurs

## Coûts Estimés

Pour 10,000 bombes/jour:
- **Cloud Functions**: ~$0.004/jour
- **Firestore**: Gratuit (quota 50K writes/jour)
- **Hosting**: Gratuit (quota 10GB/mois)

**Total: < $0.15/mois**

## Next Steps

Une fois déployé:

1. Testez depuis plusieurs appareils
2. Vérifiez que le rate limiting fonctionne
3. Surveillez les logs pour détecter les abus
4. Configurez des alertes dans Firebase Console

Vous êtes maintenant en production avec une protection anti-spam robuste!

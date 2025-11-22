# 📥 Guide de Téléchargement et Déploiement Anonyme

## 🔽 **ÉTAPE 1 : Télécharger le code depuis Bolt**

### **Méthode 1 - Via l'interface Bolt :**
1. **Cliquez sur l'icône "Download"** en haut à droite de Bolt
2. **Sélectionnez "Download as ZIP"**
3. **Sauvegardez** le fichier sur votre ordinateur
4. **Décompressez** le fichier ZIP

### **Méthode 2 - Via le terminal Bolt :**
```bash
# Dans le terminal Bolt, créez une archive
tar -czf world-bomb-map.tar.gz --exclude=node_modules --exclude=.git .
```

## 🛡️ **ÉTAPE 2 : Préparation anonyme**

### **Avant de commencer :**
- [ ] **Activez votre VPN** (NordVPN, ExpressVPN, ou Tor)
- [ ] **Créez un email jetable** (10minutemail.com, guerrillamail.com)
- [ ] **Préparez un navigateur propre** (mode incognito + VPN)

## 🚀 **ÉTAPE 3 : Déploiement sur Vercel (Recommandé)**

### **3.1 - Créer un compte Vercel anonyme :**
1. Allez sur [vercel.com](https://vercel.com) avec VPN activé
2. **Sign up** avec votre email jetable
3. **Choisissez "Hobby"** (gratuit)
4. **Nom d'utilisateur** : Quelque chose de générique

### **3.2 - Déployer votre site :**
1. **Cliquez "Add New Project"**
2. **Sélectionnez "Import Git Repository"** 
3. **OU drag & drop** votre dossier décompressé
4. **Project Name** : `world-bomb-map` ou autre
5. **Framework Preset** : Vite
6. **Build Command** : `npm run build`
7. **Output Directory** : `dist`
8. **Cliquez "Deploy"**

### **3.3 - Configuration Firebase :**
Dans Vercel, allez dans **Settings > Environment Variables** et ajoutez :
```
VITE_FIREBASE_API_KEY=AIzaSyDeLj0KksVcCGvXjWs-mXn7Dyr8r3Y6gFw
VITE_FIREBASE_AUTH_DOMAIN=bombingmap.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bombingmap
VITE_FIREBASE_STORAGE_BUCKET=bombingmap.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=868119040139
VITE_FIREBASE_APP_ID=1:868119040139:web:5a51e18344df5638a9848e
```

## 🌐 **ÉTAPE 4 : Domaine personnalisé (Optionnel)**

### **4.1 - Acheter un domaine anonyme :**
- **Njalla.is** (paiement crypto, WHOIS anonyme)
- **Porkbun** (accepte Bitcoin)
- **Namecheap** (avec protection WHOIS)

### **4.2 - Configurer le domaine :**
1. Dans Vercel : **Settings > Domains**
2. **Add Domain** : votre-domaine.com
3. **Suivez les instructions** DNS
4. **Activez HTTPS** automatiquement

## 🔄 **ÉTAPE 5 : Alternative - Netlify**

### **Si Vercel ne marche pas :**
1. Allez sur [netlify.com](https://netlify.com)
2. **Drag & drop** votre dossier `dist` (après `npm run build`)
3. **Site Settings > Environment Variables** pour Firebase
4. **Domain Settings** pour domaine custom

## 🏗️ **ÉTAPE 6 : Build local (si nécessaire)**

### **Sur votre ordinateur :**
```bash
# Installer les dépendances
npm install

# Créer les variables d'environnement
echo "VITE_FIREBASE_API_KEY=AIzaSyDeLj0KksVcCGvXjWs-mXn7Dyr8r3Y6gFw" > .env
echo "VITE_FIREBASE_AUTH_DOMAIN=bombingmap.firebaseapp.com" >> .env
echo "VITE_FIREBASE_PROJECT_ID=bombingmap" >> .env
echo "VITE_FIREBASE_STORAGE_BUCKET=bombingmap.firebasestorage.app" >> .env
echo "VITE_FIREBASE_MESSAGING_SENDER_ID=868119040139" >> .env
echo "VITE_FIREBASE_APP_ID=1:868119040139:web:5a51e18344df5638a9848e" >> .env

# Tester localement
npm run dev

# Créer le build de production
npm run build
```

## ⚠️ **IMPORTANT - Sécurité :**

### **Toujours utiliser :**
- **VPN activé** pour toutes les étapes
- **Email jetable** différent pour chaque service
- **Navigateur en mode incognito**
- **Jamais votre vraie identité**

### **Ne jamais :**
- Vous connecter depuis votre IP réelle
- Utiliser vos vrais emails/comptes
- Lier à vos autres projets
- Oublier le VPN

## 🎯 **Résumé rapide :**

1. **Téléchargez** le code depuis Bolt
2. **VPN + Email jetable**
3. **Vercel** : Drag & drop + variables Firebase
4. **Domaine** (optionnel) : Njalla + crypto
5. **Profit** : Site en ligne anonymement !

## 🆘 **En cas de problème :**

- **Build fail** : Vérifiez les variables d'environnement
- **Firebase error** : Vérifiez la configuration
- **Domain issues** : Attendez 24h pour la propagation DNS
- **Vercel ban** : Essayez Netlify avec un autre email

**Votre site sera en ligne en 10 minutes ! 🚀**
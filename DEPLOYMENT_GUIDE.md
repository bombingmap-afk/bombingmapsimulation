# Guide de Déploiement Anonyme

## 🛡️ Étapes pour un déploiement 100% anonyme

### 1. Préparation
- [ ] Activez un VPN fiable (NordVPN, ExpressVPN, ou Tor)
- [ ] Créez un email jetable (10minutemail.com, guerrillamail.com)
- [ ] Préparez une carte prépayée ou crypto pour les paiements

### 2. Téléchargement du code
- [ ] Téléchargez tous les fichiers depuis Bolt
- [ ] Vérifiez que Firebase est configuré avec VOS clés
- [ ] Testez localement avec `npm run dev`

### 3. Options de déploiement anonyme

#### Option A - Vercel (Recommandé)
1. Créez un compte Vercel avec l'email jetable
2. Uploadez le dossier via l'interface web
3. Configurez les variables d'environnement Firebase
4. Domaine custom avec registrar anonyme

#### Option B - Netlify
1. Compte avec email jetable
2. Drag & drop du dossier `dist` après `npm run build`
3. Variables d'environnement dans les settings

#### Option C - VPS Anonyme
1. VPS chez Njalla/1984.is (paiement crypto)
2. Nginx + fichiers statiques
3. Certificat SSL Let's Encrypt
4. Accès uniquement via Tor

### 4. Domaine anonyme
- **Registrar crypto** : Njalla, Porkbun, Namecheap
- **Protection WHOIS** : Obligatoire
- **Paiement** : Bitcoin/Monero uniquement
- **DNS** : Cloudflare avec proxy activé

### 5. Monitoring anonyme
- **Analytics** : Plausible.io (privacy-focused)
- **Uptime** : UptimeRobot avec compte jetable
- **Logs** : Désactivés ou anonymisés

## ⚠️ Points critiques
- Toujours utiliser le même VPN/Tor
- Jamais de connexion depuis votre IP réelle
- Email jetable différent pour chaque service
- Paiements uniquement en crypto
- Pas de liens avec vos autres projets

## 🔧 Variables d'environnement nécessaires
```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_here
VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

## 🚀 Commandes de build
```bash
npm install
npm run build
# Le dossier 'dist' contient votre site prêt à déployer
```
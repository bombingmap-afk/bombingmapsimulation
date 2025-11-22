# 🌍 World Bomb Map - Virtual Social Experiment

A fascinating social experiment exploring digital communities and online behavior patterns.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:production
```

## 🔧 Configuration

1. Copy `.env.example` to `.env`
2. Configure Firebase variables (already set for this project)
3. Run `npm run dev` to start

## 🔥 Firebase Functions Setup

**NEW**: This project now uses Firebase Cloud Functions for robust anti-spam protection.

```bash
# Deploy everything
firebase deploy

# Or deploy functions only
npm run functions:deploy
```

See [QUICK_START.md](./QUICK_START.md) for 3-minute deployment guide.

## 📦 Deployment

See `DOWNLOAD_GUIDE.md` for complete anonymous deployment instructions.

## 🛡️ Security Features

- **Triple-layer anti-spam protection**:
  - Client-side UX validation
  - Server-side session tracking (1 bomb/day)
  - Server-side IP limiting (3 bombs/IP/day)
- URL blocking in messages
- Content moderation
- Anonymous usage tracking
- Firebase Cloud Functions security

## 🎯 Features

- **Real-time bombing** with live updates
- **Country statistics** and analytics
- **Live events** system
- **Message history** and rankings
- **Responsive design** for all devices

## 📊 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Backend**: Firebase Cloud Functions (Node.js 18)
- **Maps**: React Simple Maps
- **Icons**: Lucide React
- **Security**: Triple-layer rate limiting

## 🔒 Privacy

This is a virtual simulation. No real countries or violence involved.
All data is anonymized.

## 📚 Documentation

- [QUICK_START.md](./QUICK_START.md) - Deploy in 3 minutes
- [FIREBASE_SETUP_COMPLETE.md](./FIREBASE_SETUP_COMPLETE.md) - Complete setup overview
- [FIREBASE_FUNCTIONS_SETUP.md](./FIREBASE_FUNCTIONS_SETUP.md) - Detailed technical guide
- [DEPLOY.md](./DEPLOY.md) - Deployment guide

---

**Made for educational research on digital sociology** 🎓
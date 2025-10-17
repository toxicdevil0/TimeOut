# ⏰ TimeOut — Focus & Study App

A comprehensive productivity platform for students and educators with focus tracking, real-time collaboration, and behavioral analytics.

Status: ✅ Ready to Run — clone and start immediately!

Demo (local): http://localhost:5173 (Vite dev) or http://localhost:8080 (Docker)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Latest-FFCA28?logo=firebase)

---

## Overview

TimeOut is a full-featured student productivity and classroom management system designed to improve focus, track progress, and facilitate collaborative learning. Built with React and Firebase, it provides students and teachers with powerful tools to maximize learning effectiveness through behavioral science and real-time analytics.

Key differentiators:
- Token-based reward economy (Focus Points) that incentivizes productive study habits
- Digital Detox system with fullscreen enforcement and app restriction concepts
- Real-time collaborative study rooms with synchronized timers
- Teacher dashboards with live student monitoring and analytics
- AI-ready schedule templates and automated planning concepts
- Comprehensive analytics tracking focus patterns, streaks, and productivity scores

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+ (or yarn/pnpm)
- Git
- Optional (for full setup): Firebase CLI (`npm i -g firebase-tools`)

### Option 1: Demo Mode (Recommended to try it now)
No external services required. Local-only data with mock/demo screens.

```bash
git clone https://github.com/toxicdevil0/TimeOut.git
cd "TimeOut/TimeOut Frontend"
npm install
npm run dev
# Opens at http://localhost:5173
```

### Option 2: Full Setup (Backend + Cloud features)
Enables authentication, Firestore persistence, and real-time features.

1) Get a Clerk publishable key (optional for real auth)
   - Sign up: https://clerk.com

2) Create a Firebase project
   - Console: https://console.firebase.google.com
   - Enable Auth (Email/Password & Google), Firestore, and Storage

3) Configure frontend environment variables
Create a `.env` file in `TimeOut Frontend`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_or_test
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Local emulator
VITE_USE_EMULATOR=false
VITE_EMULATOR_HOST=localhost
```

4) Backend setup
```bash
cd "../../TimeOut Backend"
npm install
cd functions && npm install && cd ..
```

5) Run locally
```bash
# Frontend
cd "../TimeOut Frontend"
npm run dev  # http://localhost:5173

# Backend (from TimeOut Backend)
cd "../TimeOut Backend"
firebase emulators:start  # Emulator UI at http://localhost:4000
```

---

## 🎯 Features

### ✅ Working (Out-of-the-box)
- Focus Timer (Pomodoro, Deep Work, Breaks) with local persistence
- Beautiful, responsive UI (green theme, glassmorphism)
- Demo Mode: runs immediately without external setup
- Session history (local)
- Basic analytics (local/demo)

### 🎭 Demo/Interactive UI
- Group Study: virtual rooms, timer sync (simulated)
- Digital Detox: analytics views with generated data
- Community: achievements and leaderboards with sample data
- Camera verification UI (simulated)

### ☁️ Full Features (with Backend)
- Real Authentication (Clerk + Firebase)
- Cloud Sync (Firestore persistence)
- Live Group Sessions (real-time rooms)
- Real Analytics (usage tracking & insights)
- Callable Functions for Digital Detox, Tokens, Rooms, Schedule

---

## 🛠 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (fast dev/build)
- Tailwind CSS + shadcn/ui
- React Router DOM
- Lucide React (icons)
- React Hook Form + Zod
- date-fns

### Backend (Optional)
- Firebase Cloud Functions (Node.js 18)
- Firebase Auth, Firestore, Storage
- Express.js endpoints (as needed)
- Clerk webhooks for user sync

---

## 🏗 Project Structure

```
TimeOut/
├── TimeOut Frontend/           # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── dashboard/      # Dashboard views
│   │   │   │   └── tabs/       # Dashboard tab components
│   │   │   ├── layout/         # Layout components
│   │   │   ├── tokens/         # Token system UI
│   │   │   └── ui/             # shadcn UI components
│   │   ├── contexts/           # React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── config/             # Firebase & app config
│   │   ├── lib/                # Utility functions
│   │   ├── pages/              # Page components
│   │   └── utils/              # Helpers
│   ├── public/                 # Static assets
│   └── package.json
│
├── TimeOut Backend/            # Firebase backend
│   ├── functions/
│   │   ├── src/
│   │   │   ├── callable/
│   │   │   │   ├── digitalDetox.ts
│   │   │   │   ├── rooms.ts
│   │   │   │   ├── schedule.ts
│   │   │   │   ├── tokens.ts
│   │   │   │   └── users.ts
│   │   │   ├── types/
│   │   │   ├── config/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── firebase.json
│   ├── firestore.rules
│   └── storage.rules
│
├── scripts/
│   ├── setup.ps1
│   ├── setup.sh
│   ├── deploy-config.ps1
│   └── deploy-config.sh
│
└── docs/
    ├── BACKEND_INTEGRATION_SUMMARY.md
    ├── DEPLOYMENT_GUIDE.md
    ├── SETUP_GUIDE.md
    ├── TOKEN_REWARD_SYSTEM_DESIGN.md
    └── VERCEL_DEPLOYMENT_GUIDE.md
```

---

## 🔐 Environment Setup

### Demo Mode (Default)
No configuration needed — runs with local/demo data.

### Full Features
1) Clerk
   - Create app, copy publishable key to frontend `.env`
   - Configure webhook endpoint (example): `https://<region>-<project>.cloudfunctions.net/clerkWebhook`
   - Add webhook secret to backend `functions/.env`:
 ```env
 CLERK_WEBHOOK_SECRET=your_webhook_secret
 ```

2) Firebase
   - Create project, enable Auth, Firestore, Storage
   - Copy web config to frontend `.env`
   - Deploy Firestore & Storage security rules:
 ```bash
 cd "TimeOut Backend"
 firebase deploy --only firestore:rules
 firebase deploy --only storage:rules
 ```

Rules enforce:
- Users access only their data
- Room participants read/write room data
- Teachers manage their classes
- Public templates readable by all

---

## 🎮 Usage

### Study Timer
1) Set duration (25/50 custom)
2) Choose subject
3) Start session
4) Take breaks between sessions
5) Progress tracked in history

### Group Study
- Browse and join public rooms or create a private one
- Participant limits and visibility controls
- Synchronized timers
- Optional camera check-ins (demo)

### Digital Detox
- Set app restriction rules (concept/UI)
- Start focus with fullscreen enforcement (concept/UI)
- View usage analytics and recommendations

### Students
- Create account and select “Student”
- Build weekly schedule and use templates
- Start focus sessions and earn Focus Points
- Join study groups
- Track progress and streaks

### Teachers
- Create account and select “Teacher”
- Create classes and start live sessions
- Monitor student states and connections
- Share resources
- View class analytics and engagement

---

## 💰 Token System (Focus Points)

Earning:
- 25-minute session: 25 FP
- 50-minute deep work: 60 FP
- 7-day streak: 300 FP bonus
- Group session participation: 15–40 FP
- Share template: 50 FP (+10 FP per use)

Spending:
- Shop: Themes, Avatar frames, Features, Badges
- Items have rarity (Common→Legendary)
- Purchase logs recorded

---

## 🧪 Development

### Frontend scripts
```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # ESLint
```

### Backend scripts
```bash
firebase emulators:start     # Start local backend
firebase deploy              # Deploy functions, rules
firebase functions:log       # View logs
npm test                     # Functions tests (from functions/)
```

---

## 🔌 API Documentation (Firebase Callable Functions)

All functions expect authenticated requests in full setup.

### Digital Detox
`createAppRestriction(data)`
```ts
type ScheduleSlot = { day: number; start: string; end: string };
type AppRestriction = {
  id: string;
  appName: string;
  packageName?: string;
  websiteUrl?: string;
  restrictionType: 'complete' | 'scheduled' | 'time_limited';
  allowedTime?: number;
  scheduledTimes?: ScheduleSlot[];
};

Request: {
  appName: string;
  packageName?: string;
  websiteUrl?: string;
  restrictionType: 'complete' | 'scheduled' | 'time_limited';
  allowedTime?: number;
  scheduledTimes?: ScheduleSlot[];
}

Response: {
  success: boolean;
  restrictionId: string;
  restriction: AppRestriction;
}
```

`startFocusSession(data)`
```ts
type FocusSessionType = 'focus' | 'break' | 'deep_work';
type FocusSession = {
  id: string;
  sessionType: FocusSessionType;
  duration: number;
  startedAt: number;
  restrictedApps?: string[];
  allowedApps?: string[];
};

Request: {
  sessionType: FocusSessionType;
  duration: number;
  restrictedApps?: string[];
  allowedApps?: string[];
}

Response: {
  success: boolean;
  sessionId: string;
  session: FocusSession;
}
```

`endFocusSession(data)`
```ts
Request: {
  sessionId: string;
  status: 'completed' | 'interrupted';
}

Response: {
  success: boolean;
  actualDuration: number;
  productivityScore: number; // 1–100
}
```

`getFocusAnalytics()`
```ts
type FocusAnalytics = {
  totalFocusMinutes: number;
  sessionsCompleted: number;
  focusScore: number;
  streakDays: number;
};

Response: {
  todayStats: FocusAnalytics;
  weeklyTrend: number[];
  monthlyTrend: number[];
  achievements: string[];
  recommendations: string[];
}
```

### Tokens
`saveTokens(data)`
```ts
type TokenStats = { balance: number; lifetimeEarned: number; streakDays: number };
type TokenTransaction = {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  note?: string;
  createdAt: number;
};

Request: {
  tokenStats: TokenStats;
  transactions: TokenTransaction[];
}

Response: {
  success: boolean;
  message: string;
}
```

`loadTokens()`
```ts
Response: {
  tokenStats: TokenStats | null;
  transactions: TokenTransaction[];
}
```

### Rooms
`createRoom(data)`
```ts
type Room = {
  id: string;
  name: string;
  isPublic: boolean;
  maxParticipants: number;
  participants: string[];
  status: 'active' | 'waiting' | 'ended';
};

Request: {
  name: string;
  isPublic: boolean;
  maxParticipants: number;
}

Response: {
  success: boolean;
  roomId: string;
  room: Room;
}
```

`joinRoom(data)`
```ts
Request: {
  roomId: string;
}

Response: {
  success: boolean;
  room: Room;
}
```

### Schedule
`saveUserSchedule(data)`
```ts
type Event = { id: string; title: string; start: string; end: string; subject?: string; priority?: number; notes?: string };
type Template = { id: string; name: string; slots: Array<{ day: number; start: string; end: string; subject?: string }> };

Request: {
  scheduleData: {
    events: Event[];
    templates: Template[];
  }
}

Response: {
  success: boolean;
}
```

`getUserSchedule()`
```ts
Response: {
  events: Event[];
  templates: Template[];
}
```

---

## 🧰 Testing

### Frontend
```bash
cd "TimeOut Frontend"
npm run test
npm run test:ui
npm run coverage
```

### Backend
```bash
cd "TimeOut Backend/functions"
npm run test
```

End-to-end test scripts (examples):
- `production-verification.js`
- `quick-token-check.js`
- `simple-token-test.js`
- `brutal-audit.js` (comprehensive)

---

## 🚀 Deployment

### Frontend — Vercel
```bash
cd "TimeOut Frontend"
npm install -g vercel
vercel
```
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Set env vars: `VITE_*` keys from your `.env`

See [docs/VERCEL_DEPLOYMENT_GUIDE.md](docs/VERCEL_DEPLOYMENT_GUIDE.md) for details.

### Backend — Firebase
```bash
cd "TimeOut Backend"
firebase deploy                       # All
firebase deploy --only functions      # Functions only
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Docker (Frontend)
```bash
cd "TimeOut Frontend"
docker build -t timeout-frontend .
docker run -d -p 8080:80 --name timeout timeout-frontend
# Open http://localhost:8080
```

---

## 📈 Performance

Frontend:
- Code splitting via dynamic imports
- Image lazy loading and sizing
- Tree-shaking with Vite
- Optional service worker for offline support

Backend:
- Minimized cold starts
- Client-side caching of Firestore data
- Batched writes and composite indexes
- Basic rate limiting concepts for callable functions

---

## 🔒 Security

- Clerk + Firebase Auth for secure user management
- Verification on all backend calls (full setup)
- Webhook signature validation (Clerk)
- Firestore/Storage rules for least-privilege access
- HTTPS-only communication
- No secrets in client code
- Input validation and XSS protection via React

---

## 🐛 Troubleshooting

Frontend won’t start:
```bash
rm -rf node_modules package-lock.json
npm install
```

Firebase connection errors:
- Verify `.env` keys
- Check Firebase project config
- Ensure billing if needed for specific features
- Confirm emulator vs production settings

Token system not persisting:
- Confirm auth status
- Check Firestore rules and indexes
- Inspect browser console
- Ensure backend deployed or emulator running

Emulator issues:
```bash
# macOS/Linux
killall java
# Windows
taskkill /F /IM java.exe

firebase emulators:start
```

Clerk auth fails:
- Verify publishable key
- Check app status in Clerk dashboard
- Confirm webhook URL and secret
- Ensure allowed origins/URLs configured

Debugging:
```bash
# Backend logs
firebase functions:log
```

---

## 🤝 Contributing

1) Fork the repository
2) Create a feature branch: `git checkout -b feat/amazing-feature`
3) Follow code style (ESLint + Prettier)
4) Write tests
5) Update docs
6) Open a Pull Request

Standards:
- TypeScript strict mode
- ESLint enforced
- Prettier formatting
- Conventional Commits
- Component-level docs where applicable

Areas to contribute:
- Mobile app (React Native)
- i18n
- New token shop content
- Schedule template marketplace
- Analytics visualizations
- Calendar integrations
- Browser extension for blocking
- Desktop app (Electron)

---

## 🗺 Roadmap

- v2.1 (Q1 2025): Mobile app, offline mode, voice commands, calendar integration, teacher analytics
- v2.2 (Q2 2025): AI recommendations, habits, goals, social challenges, custom sounds
- v2.3 (Q3 2025): Browser extension, Electron desktop, institutional reporting, i18n, theme toggle

Long-term:
- LMS integrations (Canvas, Moodle)
- Institutional dashboards
- Public API
- ML-driven personalized plans
- Virtual study spaces with spatial audio

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Third-party licenses:
- React (MIT)
- Firebase (Apache 2.0)
- Tailwind CSS (MIT)
- shadcn/ui (MIT)
- Lucide Icons (ISC)
- date-fns (MIT)

---

## 🙏 Acknowledgments

Technologies:
- React Team
- Firebase Team
- Vercel
- Clerk
- shadcn

Design inspiration:
- TickTick
- Notion
- Forest
- Toggl

Community:
- Contributors, beta testers, students, and educators who shaped the feature set

---

## 📬 Contact

- Maintainer: Ritik Prajapat
- Email: prajapatritik73@gmail.com
- GitHub: [@toxicdevil0](https://github.com/toxicdevil0)
- Website: https://timeoutapp.com

Built with focus, designed for productivity, powered by community.
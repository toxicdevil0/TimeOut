# ⏰ TimeOut - Focus & Study App

**Status:** ✅ **Ready to Run** - Clone and start immediately!  
**Demo:** [Live Preview](http://localhost:8080) (after setup)  
**Setup Time:** 5 minutes for demo mode, 15 minutes for full features

A modern study application with timer functionality, group sessions, and clean green aesthetics.

---

## 🚀 **Quick Start**

**Want to try it now?** Just run:

```bash
git clone https://github.com/YourUsername/Timeout-DEMO.git
cd Timeout-DEMO/Timeout\ Frontend
npm install && npm run dev
```

**🎉 App starts at http://localhost:8080 in demo mode!**

---

## 🎯 **Features**

### ✅ **Working Features**
- **⏱️ Focus Timer**: Pomodoro-style study sessions with localStorage persistence
- **🎨 Beautiful UI**: Clean green theme with glassmorphism effects
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **🔧 Demo Mode**: Runs immediately without any external setup

### 🎭 **Demo Features** (Interactive UI)
- **👥 Group Study**: Virtual study sessions with mock participants
- **📊 Digital Detox**: Analytics dashboard with generated data
- **🏆 Community**: Achievements and leaderboards with sample data
- **📸 Study Verification**: Camera integration UI (simulated)

### 🔧 **Full Features** (With Backend Setup)
- **🔐 Real Authentication**: Clerk-based user management
- **☁️ Cloud Sync**: Firebase Firestore for data persistence
- **👥 Live Group Sessions**: Real multiplayer study rooms
- **📊 Real Analytics**: Actual usage tracking and insights

---

## 🛠️ **Tech Stack**

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **Tailwind CSS** for beautiful styling
- **Shadcn/ui** components for consistent design
- **React Router** for navigation
- **Lucide React** for icons

### Backend (Optional)
- **Firebase Functions** with TypeScript
- **Firebase Firestore** for real-time data
- **Clerk** for authentication
- **Express.js** API endpoints

---

## 📦 **Installation Options**

### **Option 1: Demo Mode** (Recommended for trying out)
```bash
git clone https://github.com/YourUsername/Timeout-DEMO.git
cd "Timeout-DEMO/Timeout Frontend"
npm install
npm run dev
```
✅ **Ready in 2 minutes!**

### **Option 2: Full Setup** (For development/production)
```bash
# Get the code
git clone https://github.com/YourUsername/Timeout-DEMO.git
cd Timeout-DEMO

# Setup frontend
cd "Timeout Frontend"
npm install
cp .env.example .env  # Configure with your API keys

# Setup backend
cd "../Timeout Backend"
npm install
cd functions && npm install && cd ..

# Start everything
npm run dev        # Frontend: http://localhost:8080
firebase emulators:start  # Backend: http://localhost:5001
```
✅ **Full setup in 15 minutes!**

---

## 🔐 **Environment Setup**

### **Demo Mode** (Default)
No configuration needed! The app includes a pre-configured `.env` file for demo mode.

### **Full Features**
1. **Get Clerk API key**: [Sign up at Clerk.com](https://clerk.com)
2. **Create Firebase project**: [Firebase Console](https://console.firebase.google.com)
3. **Configure `.env`**:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   # ... other Firebase config
   ```

**📖 Full setup guide:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 🎮 **Usage**

### **Study Timer**
1. Set your focus duration (default: 25 minutes)
2. Choose a subject or add custom ones
3. Click "Start" to begin your session
4. Take breaks between sessions
5. Track your progress over time

### **Group Study** (Demo/Real)
1. Browse available study rooms
2. Join a room or create your own
3. Set room visibility and participant limits
4. Study together with timer synchronization
5. Optional: Camera check-ins for accountability

### **Digital Detox** (Demo/Real)
1. Set app restrictions and time limits
2. Start focus sessions with app blocking
3. View usage analytics and insights
4. Earn achievements for focused study time

---

## 🧪 **Development**

### **Available Scripts**
```bash
# Frontend development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality

# Backend development
firebase emulators:start    # Start local backend
firebase deploy            # Deploy to production
npm test                   # Run backend tests
```

### **Project Structure**
```
📦 Timeout-DEMO/
├── 📁 Timeout Frontend/    ← React app
│   ├── 📁 src/components/ ← UI components
│   ├── 📁 src/config/     ← Firebase & app config
│   └── 📁 src/pages/      ← Route components
└── 📁 Timeout Backend/     ← Firebase functions
    ├── 📁 functions/src/  ← TypeScript functions
    └── 📄 firebase.json   ← Firebase configuration
```

---

## 🎯 **What's Real vs Demo**

| Feature | Demo Mode | Full Setup |
|---------|-----------|------------|
| Study Timer | ✅ Fully functional | ✅ + Cloud sync |
| User Interface | ✅ Complete UI | ✅ Complete UI |
| Authentication | 🎭 Mock login | ✅ Real Clerk auth |
| Group Rooms | 🎭 Sample data | ✅ Real multiplayer |
| Data Storage | 📱 localStorage | ☁️ Firebase Firestore |
| Analytics | 🎭 Generated data | ✅ Real usage data |

**✅ = Fully functional | 🎭 = Demo/Interactive mockup | 📱 = Local only | ☁️ = Cloud synced**

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Clerk** for authentication infrastructure
- **Firebase** for backend services
- **Tailwind CSS** for beautiful styling
- **Shadcn/ui** for component library
- **Lucide** for icon library

---

**Ready to focus? [Get started now!](#-quick-start) 🚀**
npm run dev
```

The app will be available at `http://localhost:8080`

## 🎯 Usage

### Demo Authentication
1. Click "Continue with Google" or "Sign in with Email"
2. Select your role (Student/Teacher)
3. Access the dashboard

### Study Timer
- Set focus duration (default: 25 minutes)
- Start/pause timer
- Timer persists across page refreshes
- Completion alerts and progress tracking

### Group Sessions
- Join virtual study rooms
- Camera integration (demo mode)
- Real-time participants display

## 🏗️ Project Structure

```
Timeout Frontend/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard and tabs
│   │   └── ui/             # Reusable UI components
│   ├── config/             # Configuration files
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── pages/              # Page components
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

### Colors
- **Primary**: Green (RGB 11, 110, 79)
- **Background**: Ghost White (RGB 248, 248, 255)
- **Glass Effects**: Backdrop blur with transparency

### Components
The app uses a curated set of UI components:
- Buttons, Cards, Inputs, Labels
- Alerts, Badges, Dialogs
- Toast notifications, Tooltips

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Static Hosting
The built files in `dist/` can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 🔮 Future Enhancements

- [ ] Real authentication system
- [ ] Database persistence
- [ ] Calendar integration
- [ ] Study analytics
- [ ] Mobile app
- [ ] Collaborative features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Design inspiration from modern study apps

---

**Note**: This is currently a demo application. For production use, implement proper authentication, database persistence, and security measures.
# TimeOut App - Vercel Deployment Guide

## 🚀 CONFIRMED: Ready for Deployment

Your app uses a **hybrid architecture** that's perfect for Vercel:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Firebase Cloud Functions  
- **Database**: Firebase Firestore
- **Auth**: Clerk (works everywhere)

## Prerequisites Checklist
✅ Real Clerk credentials configured  
✅ Firebase project setup (timeout-backend-340e2)  
✅ Vite build system configured  
✅ vercel.json exists and properly configured  

## Step 1: Deploy Backend to Firebase First

```bash
cd "Timeout Backend"
npm install
firebase deploy --only functions,firestore:rules
```

This deploys your Cloud Functions to: `https://timeout-backend-340e2.cloudfunctions.net/`

## Step 2: Update Frontend API URLs

In your frontend code, ensure API calls point to Firebase:

```typescript
// In your API configuration file
const API_BASE_URL = 'https://timeout-backend-340e2.cloudfunctions.net/api'
```

## Step 3: Deploy Frontend to Vercel

### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# In project root
cd "Timeout Frontend"
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: timeout-app
# - Directory: ./Timeout Frontend
```

### Option B: GitHub + Vercel Dashboard
1. Push code to GitHub
2. Connect repository in Vercel dashboard
3. Set build settings:
   - **Framework**: Vite
   - **Root Directory**: `Timeout Frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

## Step 4: Configure Environment Variables in Vercel

In Vercel dashboard → Project Settings → Environment Variables:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_aW1wcm92ZWQtdHJ1dC0xLmNsZXJrLmFjY291bnRzLmRldiQ
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=timeout-backend-340e2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=timeout-backend-340e2
VITE_API_BASE_URL=https://timeout-backend-340e2.cloudfunctions.net/api
```

## Step 5: Verify Deployment

1. **Frontend**: Your-app.vercel.app
2. **Backend**: Firebase Functions URL
3. **Test**: Authentication flow, room creation, database operations

## Configuration Files Status

### ✅ vercel.json (Already Configured)
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### ✅ package.json (Build Scripts Ready)
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Expected Outcome

- **Frontend URL**: `https://timeout-app.vercel.app`
- **Backend URL**: `https://timeout-backend-340e2.cloudfunctions.net`
- **Performance**: Excellent (Vercel Edge Network + Firebase)
- **Cost**: Free tier covers most usage

## Troubleshooting

### If Build Fails
```bash
# Local test first
npm run build
npm run preview
```

### CORS Issues
Your Firebase functions already have CORS configured for all origins.

### Environment Variables
Double-check all `VITE_` prefixed variables are set in Vercel dashboard.

## Security Notes

✅ CSP headers configured in vite.config.ts  
✅ Security headers for production builds  
✅ Rate limiting in Firebase functions  
✅ Input validation implemented  

## Final Status: DEPLOYMENT READY ✅

Your application architecture is solid and Vercel-compatible. The hybrid approach (Vercel frontend + Firebase backend) is a proven pattern used by many production apps.
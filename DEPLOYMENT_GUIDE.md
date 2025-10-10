# GitHub Deployment Setup Guide

This guide will help you set up automated deployment for your TimeOut application using GitHub Actions.

## 🚀 Quick Setup Overview

1. **Frontend**: Deployed to Vercel automatically
2. **Backend**: Firebase Functions deployed automatically
3. **Triggers**: Automatic deployment on push to `main` branch

## 🔐 Required GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, then add these secrets:

### 🌐 Vercel Secrets (for Frontend Deployment)

1. **`VERCEL_TOKEN`**
   - Go to [Vercel Dashboard](https://vercel.com/account/tokens)
   - Create a new token
   - Copy the token value

2. **`VERCEL_ORG_ID`**
   - Go to your Vercel team settings
   - Copy the Team ID (or use your personal account ID)

3. **`VERCEL_PROJECT_ID`**
   - Go to your Vercel project settings
   - Copy the Project ID

### 🔥 Firebase Secrets (for Backend Deployment)

1. **`FIREBASE_SERVICE_ACCOUNT`**
   ```bash
   # Generate service account key
   firebase login
   firebase projects:list
   firebase service:account:create firebaseServiceAccount.json --project YOUR_PROJECT_ID
   ```
   - Copy the entire JSON content as the secret value

2. **`FIREBASE_PROJECT_ID`**
   - Your Firebase project ID (e.g., "timeout-app-12345")

3. **`FIREBASE_TOKEN`** (Alternative method)
   ```bash
   firebase login:ci
   ```
   - Copy the generated token

### 🔧 Environment Variables Secrets

These are used to build your frontend with proper configuration:

1. **`VITE_FIREBASE_API_KEY`** - Your Firebase Web API Key
2. **`VITE_FIREBASE_AUTH_DOMAIN`** - Your Firebase Auth Domain
3. **`VITE_FIREBASE_PROJECT_ID`** - Your Firebase Project ID
4. **`VITE_FIREBASE_STORAGE_BUCKET`** - Your Firebase Storage Bucket
5. **`VITE_FIREBASE_MESSAGING_SENDER_ID`** - Your Firebase Messaging Sender ID
6. **`VITE_FIREBASE_APP_ID`** - Your Firebase App ID
7. **`VITE_CLERK_PUBLISHABLE_KEY`** - Your Clerk Publishable Key
8. **`FRONTEND_URL`** - Your deployed frontend URL (e.g., "https://timeout-app.vercel.app")

## 📋 Step-by-Step Setup Instructions

### Step 1: Set up Vercel

1. Connect your GitHub repository to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Set the **Root Directory** to `Timeout Frontend`
   - Configure build settings:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm ci`

2. Get your Vercel credentials:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and link project
   cd "Timeout Frontend"
   vercel login
   vercel link
   
   # Get project info
   vercel project ls
   ```

### Step 2: Set up Firebase

1. Install Firebase CLI and login:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Initialize your project (if not already done):
   ```bash
   cd "Timeout Backend"
   firebase init
   ```

3. Generate service account:
   ```bash
   firebase service:account:create serviceAccount.json --project YOUR_PROJECT_ID
   ```

### Step 3: Configure GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each secret listed above
4. Add all the required secrets with their respective values

### Step 4: Test Deployment

1. Commit and push the workflow files:
   ```bash
   git add .github/
   git commit -m "Add GitHub Actions deployment workflows"
   git push origin main
   ```

2. Check the **Actions** tab in your GitHub repository to see the deployment progress

## 🔄 Available Workflows

### 1. `deploy.yml` - Complete Deployment
- Deploys both frontend and backend
- Runs health checks
- Full production deployment

### 2. `vercel.yml` - Frontend Only
- Triggers only on frontend changes
- Fast Vercel deployment
- Optimized for frontend updates

### 3. `firebase.yml` - Backend Only
- Triggers only on backend changes
- Firebase Functions deployment
- Optimized for backend updates

## 🛠️ Manual Deployment Commands

If you prefer manual deployment:

### Frontend (Vercel)
```bash
cd "Timeout Frontend"
vercel --prod
```

### Backend (Firebase)
```bash
cd "Timeout Backend"
firebase deploy --only functions
```

## 🚨 Troubleshooting

### Common Issues:

1. **Build fails**: Check that all environment variables are properly set
2. **Vercel deployment fails**: Ensure root directory is set to "Timeout Frontend"
3. **Firebase deployment fails**: Verify service account permissions
4. **Environment variables not working**: Double-check secret names match exactly

### Debug Commands:
```bash
# Test local build
cd "Timeout Frontend"
npm run build

# Test Firebase functions locally
cd "Timeout Backend"
firebase emulators:start --only functions
```

## 🎉 Success!

Once set up, every push to the `main` branch will automatically:
1. ✅ Build and test your application
2. ✅ Deploy frontend to Vercel
3. ✅ Deploy backend to Firebase
4. ✅ Run health checks
5. ✅ Notify you of successful deployment

Your TimeOut application will be live and automatically updated! 🚀
# 🚀 VERCEL DEPLOYMENT GUIDE - TimeOut Hackathon Demo

## 📋 **QUICK OVERVIEW**
Deploy your React/Vite TimeOut app to Vercel in ~10 minutes for hackathon demo.

---

## 🎯 **METHOD 1: GitHub Integration (RECOMMENDED)**

### **Step 1: Prepare Your Repository**
```bash
# Make sure everything is committed and pushed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### **Step 2: Create Vercel Account**
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. **Choose "Continue with GitHub"** (easiest for hackathons)
4. Authorize Vercel to access your repositories

### **Step 3: Deploy from Dashboard**
1. Click **"New Project"** on Vercel dashboard
2. **Import Git Repository** → Find your `TimeOut` repo
3. Click **"Import"** next to your repository

### **Step 4: Configure Build Settings**
Vercel should auto-detect, but verify these settings:
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### **Step 5: Add Environment Variables**
Click **"Environment Variables"** and add:
```bash
# Required for demo mode
VITE_DEMO_MODE=true
VITE_LOG_LEVEL=info

# Firebase (use demo values for hackathon)
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_PROJECT_ID=timeout-demo
VITE_FIREBASE_AUTH_DOMAIN=timeout-demo.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=timeout-demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Clerk (use demo values for hackathon)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_demo-key-for-hackathon
```

### **Step 6: Deploy**
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Get your live URL: `https://your-app-name.vercel.app`

---

## 🛠️ **METHOD 2: CLI Deployment (Alternative)**

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Login**
```bash
vercel login
# Choose GitHub authentication
```

### **Step 3: Navigate to Frontend**
```bash
cd "Timeout Frontend"
```

### **Step 4: Deploy**
```bash
vercel
# Answer prompts:
# - Link to existing project? N
# - Project name: timeout-hackathon
# - Directory: ./
# - Want to override settings? N
```

### **Step 5: Set Environment Variables**
```bash
vercel env add VITE_DEMO_MODE
# Enter: true

vercel env add VITE_FIREBASE_PROJECT_ID  
# Enter: timeout-demo

# Repeat for other variables...
```

### **Step 6: Redeploy with Env Vars**
```bash
vercel --prod
```

---

## 🎯 **HACKATHON-SPECIFIC CONFIGURATION**

### **Create `vercel.json` in Frontend Directory**
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "VITE_DEMO_MODE": "true"
  },
  "functions": {
    "app/api/**/*.js": {
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

### **Update `package.json` Scripts**
Make sure you have:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🔧 **TROUBLESHOOTING COMMON ISSUES**

### **Issue 1: Build Fails**
```bash
# Error: "vite: command not found"
# Solution: Make sure dependencies are in package.json, not just installed locally
```

### **Issue 2: Environment Variables Not Working**
- Make sure they start with `VITE_`
- Restart deployment after adding env vars
- Check Vercel dashboard → Project → Settings → Environment Variables

### **Issue 3: Firebase Connection Fails**
```typescript
// Add this fallback in your firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'timeout-demo',
  // ... other config
};
```

### **Issue 4: Routing Issues (404 on refresh)**
Add to `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🎪 **DEMO DAY PREPARATION**

### **Pre-Demo Checklist:**
- [ ] Test deployment URL works
- [ ] Mock mode functions properly
- [ ] All major features work
- [ ] Mobile responsive (basic)
- [ ] Have backup localhost ready

### **Demo Environment Variables (Safe for Public)**
```bash
VITE_DEMO_MODE=true
VITE_FIREBASE_PROJECT_ID=timeout-hackathon-demo
VITE_CLERK_PUBLISHABLE_KEY=pk_test_hackathon-demo
# Use fake/demo keys - no real user data
```

### **Backup Plan:**
```bash
# If Vercel deployment fails, local backup:
cd "Timeout Frontend"
npm run dev
# Use localhost:5173 for demo
```

---

## ⚡ **QUICK DEPLOYMENT (5 minutes)**

1. **GitHub → Push your code**
2. **Vercel → Import repository**
3. **Add demo environment variables**
4. **Deploy**
5. **Test your URL**

**Expected result:** Live demo URL in 5-10 minutes! 🎉

---

## 🏆 **POST-DEPLOYMENT**

### **Share Your Demo:**
- **Live URL:** `https://timeout-hackathon.vercel.app`
- **GitHub:** `https://github.com/toxicdevil0/TimeOut`
- **Tech Stack:** React + TypeScript + Firebase + Vercel

### **Judges Will See:**
- Professional deployment on live URL
- Real-time token system
- Database integration
- Clean, modern UI
- Responsive design

---

**🚀 Ready to impress those hackathon judges!**
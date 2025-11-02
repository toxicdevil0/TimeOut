@echo off
echo Setting up Vercel Environment Variables...
echo.

echo Adding VITE_CLERK_PUBLISHABLE_KEY...
echo pk_test_am9pbnQtY29yYWwtNDIuY2xlcmsuYWNjb3VudHMuZGV2JA | vercel env add VITE_CLERK_PUBLISHABLE_KEY production

echo Adding VITE_FIREBASE_API_KEY...
echo AIza7yA6-CYwPrmTgz9SsWyc6iZ0drVHd-fiCO4 | vercel env add VITE_FIREBASE_API_KEY production

echo Adding VITE_FIREBASE_AUTH_DOMAIN...
echo timeout-backend-340e2.firebaseapp.com | vercel env add VITE_FIREBASE_AUTH_DOMAIN production

echo Adding VITE_FIREBASE_PROJECT_ID...
echo timeout-backend-340e2 | vercel env add VITE_FIREBASE_PROJECT_ID production

echo Adding VITE_FIREBASE_STORAGE_BUCKET...
echo timeout-backend-340e2.firebasestorage.app | vercel env add VITE_FIREBASE_STORAGE_BUCKET production

echo Adding VITE_FIREBASE_MESSAGING_SENDER_ID...
echo 176409782600 | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production

echo Adding VITE_FIREBASE_APP_ID...
echo 1:176409782600:web:fd0068f3745ee0da302b7d | vercel env add VITE_FIREBASE_APP_ID production

echo Adding VITE_FIREBASE_MEASUREMENT_ID...
echo G-B033H3NW2W | vercel env add VITE_FIREBASE_MEASUREMENT_ID production

echo.
echo ✅ All environment variables added!
echo Run 'vercel --prod' to redeploy with new environment variables.
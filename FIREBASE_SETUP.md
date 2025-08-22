# 🔥 Firebase Setup Guide - Fix Authentication Issues

## 🚨 Current Problem
Account creation is failing, which means Firebase isn't properly configured.

## 🔧 Step-by-Step Firebase Setup

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Sign in with your Google account

### 2. Create/Select Your Project
- **Project ID**: `journalling-a8f38` (from your config)
- **Project Name**: SentimentScope (or any name you prefer)

### 3. Enable Authentication
1. In Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click **"Email/Password"**
5. **Enable** Email/Password authentication
6. Click **"Save"**

### 4. Enable Firestore Database
1. In Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location (choose closest to you)
5. Click **"Done"**

### 5. Set Firestore Security Rules
1. In Firestore Database, click **"Rules"** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /journalEntries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

### 6. Verify Your Config
Your `frontend/src/firebase.js` should match your Firebase project:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 🧪 Test After Setup

1. **Restart your frontend**: `Ctrl+C` then `npm run dev`
2. **Try creating an account** again
3. **Check browser console** for any errors

## 🐛 Common Issues & Solutions

### Issue: "Firebase: Error (auth/invalid-api-key)"
- **Solution**: Check your `apiKey` in Firebase Console → Project Settings → General

### Issue: "Firebase: Error (auth/operation-not-allowed)"
- **Solution**: Enable Email/Password in Authentication → Sign-in methods

### Issue: "Firebase: Error (permission-denied)"
- **Solution**: Check Firestore security rules and enable test mode

### Issue: "Firebase: Error (auth/network-request-failed)"
- **Solution**: Check your internet connection and Firebase project status

## 🔍 Debug Steps

1. **Open browser console** (F12 → Console)
2. **Try to register** and watch for error messages
3. **Check Network tab** for failed requests
4. **Verify Firebase project status** in console

## 📱 Quick Test

After setup, test with this curl command:
```bash
curl -X POST http://localhost:3001/api/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "I am happy today!"}'
```

## 🎯 Expected Result

After proper setup, you should be able to:
- ✅ Create new accounts
- ✅ Log in with existing accounts
- ✅ Write journal entries
- ✅ See sentiment analysis
- ✅ View dashboard with data

---

**Need help? Check the browser console for specific error messages!**

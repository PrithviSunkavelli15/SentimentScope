# 🔐 Secure Setup Guide

## ⚠️ IMPORTANT: Security First!

This project requires Firebase configuration. **NEVER commit your actual API keys to GitHub!**

## 🚀 Quick Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd my_journaling_app
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Configure Firebase

#### Option A: Environment Variables (Recommended)
Create a `.env` file in the `frontend` directory:

```bash
# frontend/.env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_BACKEND_URL=http://localhost:3001
```

#### Option B: Direct Configuration
Copy `src/config.template.js` to `src/config.js` and fill in your values:

```javascript
export const firebaseConfig = {
  apiKey: "your_actual_api_key_here",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project_id.firebasestorage.app",
  messagingSenderId: "your_messaging_sender_id",
  appId: "your_app_id",
  measurementId: "your_measurement_id"
};
```

### 4. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication (Email/Password)
4. Create Firestore Database (start in test mode)
5. Get your configuration from Project Settings

### 5. Start the Application

#### Terminal 1: Backend
```bash
cd backend
npm start
```

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

## 🔒 Security Checklist

- [ ] `.env` file is created with your Firebase config
- [ ] `.env` file is in `.gitignore`
- [ ] No API keys are committed to Git
- [ ] Firebase rules are configured properly
- [ ] Authentication is enabled
- [ ] Firestore is created

## 🚨 What NOT to Do

- ❌ Never commit `.env` files
- ❌ Never commit `config.js` with real keys
- ❌ Never share your Firebase config publicly
- ❌ Never use test mode in production

## 🆘 Troubleshooting

### "Firebase not initialized" Error
- Check that your `.env` file exists
- Verify all environment variables are set
- Restart your development server

### "Permission denied" Error
- Check Firebase security rules
- Ensure Authentication is enabled
- Verify your project ID is correct

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React Security Best Practices](https://reactjs.org/docs/security.html)

## 🤝 Contributing

When contributing to this project:
1. Use the template files for configuration
2. Never commit real API keys
3. Test with your own Firebase project
4. Update documentation if needed

---

**Remember: Security is everyone's responsibility! 🔐**

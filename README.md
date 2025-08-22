**Sentiment Scope — AI-Powered Journaling Web App**

Sentiment Scope is a full-stack journaling application that applies natural language processing (NLP) to analyze journal entries across 25+ emotions with weighted intensity and contextual understanding. It computes a composite emotional score, visualizes trends over time, and surfaces actionable insights. The app is built with React 18, Vite, TypeScript, Tailwind CSS, Firebase (Firestore, Authentication), and optionally a Node.js backend for background processing and advanced analysis.

**Features**

Multi-dimensional emotion detection with intensity weighting and context awareness

Custom scoring algorithm combining emotion ratio, intensity balance, emotional diversity, and contextual analysis

Real-time analysis feedback while typing, with optimized React state management

Secure user accounts and per-user data isolation via Firebase Auth and Security Rules

Interactive analytics: 30-day trends, emotion distribution, streak tracking, and insights dashboard (Chart.js)

Modern UI with responsive, mobile-first layout and TipTap rich-text journaling

Production-minded performance: code splitting, lazy loading, and minimized re-renders

**Tech Stack**

Frontend: React 18, Vite, TypeScript, Tailwind CSS, Chart.js, TipTap

Backend (optional): Node.js for heavy processing and background tasks

Cloud: Firebase Authentication and Firestore

Build/Tooling: ESLint, Prettier, vite-tsconfig-paths (optional)

Architecture (High Level)

Client (Vite + React + TypeScript): Auth, editor, analysis UI, charts, and API client.

Firebase: Auth for identity, Firestore for per-user entries and analytics.

Optional Node service: Receives text payloads, performs heavier NLP or queued tasks, returns structured analysis.

Scoring and lightweight analysis can be performed client-side; more advanced or costly steps can be handled server-side.

**Prerequisites**

Node.js 18+ and npm 9+

A Firebase project with Authentication and Firestore enabled

(Optional) A local Node.js backend if using server-side analysis

Local Setup
1) Clone and install
git clone https://github.com/your-username/sentiment-scope.git
cd sentiment-scope
npm install

2) Configure environment variables (Frontend)

Create a .env file in the project root. Vite requires variables to be prefixed with VITE_.

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: point to local or remote analysis API
VITE_API_BASE_URL=http://localhost:3001

# Optional: if you call a third-party NLP service
VITE_NLP_API_KEY=your_nlp_api_key


Never commit your real .env to version control. Check in a .env.example with placeholder keys.

3) Firebase configuration

Enable Authentication in the Firebase Console (start with Email/Password; add OAuth providers as needed).

Enable Firestore (Start in production mode if you understand rules; otherwise test mode temporarily, then lock down).

Add the Firebase web app to obtain the config you placed in .env.

Minimal Firestore Security Rules (tighten as needed)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Per-user journal entries
    match /users/{userId}/journalEntries/{entryId} {
      allow read, write: if isOwner(userId);
    }

    // Per-user analytics or settings
    match /users/{userId}/{document=**} {
      allow read, write: if isOwner(userId);
    }
  }
}

**Suggested Composite Indexes**

For per-user queries sorted by timestamp and optionally filtered by emotion or score, create composite indexes such as:

Collection: users/{userId}/journalEntries

Fields: createdAt (Descending), primaryEmotion (Ascending)

Collection: users/{userId}/journalEntries

Fields: createdAt (Descending), compositeScore (Descending)

You can add indexes via the Firestore console when prompted or export an indexes.json later.

4) Run the client
npm run dev


By default Vite serves at http://localhost:5173.

5) Optional: Run the Node backend

If you plan to offload heavier analysis to a server:

cd server
npm install
npm run dev


Configure VITE_API_BASE_URL in the root .env to http://localhost:3001 (or whatever your server uses).

Data Model (example)

Journal entry document (nested under users/{uid}/journalEntries/{entryId}):

{
  "uid": "abc123",
  "content": "Today I felt overwhelmed but hopeful about the new role.",
  "emotions": {
    "anxiety": { "score": 0.62, "intensity": 0.8 },
    "hope": { "score": 0.41, "intensity": 0.6 }
  },
  "diversity": 0.37,
  "ratio": 0.58,
  "intensityBalance": 0.73,
  "contextualScore": 0.52,
  "compositeScore": 0.61,
  "createdAt": 1724284800000,
  "updatedAt": 1724284800000
}


User settings document (optional):

{
  "uid": "abc123",
  "streakCount": 12,
  "lastEntryAt": 1724284800000,
  "preferences": { "insightLevel": "standard" }
}

**Scoring Algorithm (summary)**

Emotion ratio (40 percent): proportion and dominance of top emotions

Intensity balance (30 percent): weighted intensity across detected emotions on a 0.5 to 1.0 scale

Emotional diversity (20 percent): spread across emotion categories to avoid single-emotion bias

Contextual analysis (10 percent): modifiers derived from context keywords and patterns

Composite score is a normalized combination of the above; tune weights in utils/scoring.ts.

API (if using backend)

Base URL: VITE_API_BASE_URL (for example, http://localhost:3001)


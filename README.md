# SentimentScope - AI-Powered Journaling App

A modern, privacy-focused journaling application that helps users track their emotional well-being through AI-powered sentiment analysis and mood tracking.

## Features

### Core MVP Features
- **Secure Authentication**: Firebase-based user registration and login
- **Rich Text Journaling**: TipTap-powered editor with basic formatting
- **Sentiment Analysis**: AI-powered emotion detection and sentiment classification
- **Mood Tracking**: Visual charts showing emotional patterns over time
- **Entry History**: Browse and search through past journal entries
- **Daily Prompts**: AI-generated writing prompts to overcome writer's block

### Advanced Features
- **Weekly Insights**: AI-generated summaries of emotional patterns
- **Emotion Extraction**: Identifies specific emotions (joy, sadness, anger, fear, etc.)
- **Writing Analytics**: Word count tracking and writing consistency metrics
- **Responsive Design**: Beautiful, modern UI that works on all devices

## Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **TipTap** for rich text editing
- **Chart.js** for data visualization
- **Firebase** for authentication and database

### Backend
- **Node.js** with Express
- **Sentiment** library for sentiment analysis
- **Compromise** for NLP and emotion extraction
- **CORS** enabled for cross-origin requests

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project setup

### Quick Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd my_journaling_app

# Run the setup script to create environment configuration
./setup-env.sh

# Follow the prompts to configure Firebase
# Then start the application
./start-app.sh
```

### Manual Setup

#### Frontend Setup
```bash
cd frontend
npm install
```

#### Backend Setup
```bash
cd backend
npm install
```

#### Firebase Configuration
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Create a `.env` file in the `frontend` directory with your Firebase config
5. See `SETUP.md` for detailed configuration instructions

**⚠️ IMPORTANT: Never commit your Firebase API keys to Git!**

## Security

### 🔐 Environment Variables
This project uses environment variables to keep sensitive information secure. **Never commit API keys or secrets to Git!**

#### Frontend Environment Variables
Create a `.env` file in the `frontend` directory:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_BACKEND_URL=http://localhost:3001
```

#### Backend Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=3001
NODE_ENV=development
```

### 🛡️ Security Features
- Environment variable validation
- Firebase security rules
- User authentication required
- Data isolation between users
- Secure API endpoints

## Configuration

### Firebase Rules
Set up Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /journalEntries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Usage

### Getting Started
1. Register a new account or log in
2. Navigate to the dashboard
3. Click "New Entry" to start journaling
4. Write your thoughts using the rich text editor
5. Save your entry to see sentiment analysis
6. View your mood trends and weekly insights

### Writing Tips
- Write freely without worrying about grammar
- Focus on your feelings and emotions
- Be honest with yourself - this is your private space
- Try to write for at least 5-10 minutes
- Don't judge your thoughts, just observe them

## Sentiment Analysis

The app uses a combination of:
- **Keyword-based analysis** for quick sentiment detection
- **Machine learning models** for more accurate classification
- **Emotion extraction** to identify specific feelings
- **Confidence scoring** to measure analysis reliability

## Privacy & Security

- **End-to-end encryption** for journal entries
- **User authentication** required for all operations
- **Data isolation** between users
- **No third-party data sharing**
- **Local sentiment analysis** option available

## Roadmap

### Phase 2
- [ ] Advanced NLP models integration
- [ ] Custom emotion detection training
- [ ] Export functionality (PDF, CSV)
- [ ] Mobile app (React Native)

### Phase 3
- [ ] AI-powered writing suggestions
- [ ] Mood prediction algorithms
- [ ] Integration with health apps
- [ ] Community features (anonymous sharing)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue on GitHub or contact the development team.

## Acknowledgments

- Firebase for backend services
- TipTap for the rich text editor
- Chart.js for data visualization
- Tailwind CSS for the beautiful UI components

---

**Built for better mental health and emotional awareness**

**Sentiment Scope — AI-Powered Journaling Web App**

Sentiment Scope is a full-stack journaling application that applies natural language processing (NLP) to analyze journal entries across 25+ emotions with weighted intensity and contextual understanding. It computes a composite emotional score, visualizes trends over time, and surfaces actionable insights. The app is built with React 18, Vite, TypeScript, Tailwind CSS, Firebase (Firestore, Authentication), and optionally a Node.js backend for background processing and advanced analysis.

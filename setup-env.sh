#!/bin/bash

echo "🔐 SentimentScope Environment Setup"
echo "=================================="
echo ""

# Check if .env already exists
if [ -f "frontend/.env" ]; then
    echo "⚠️  .env file already exists in frontend directory!"
    echo "   Please backup and remove it before running this script."
    exit 1
fi

echo "📝 Creating .env file in frontend directory..."
echo ""

# Create .env file
cat > frontend/.env << 'EOF'
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Backend Configuration
VITE_BACKEND_URL=http://localhost:3001
EOF

echo "✅ .env file created successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit frontend/.env and replace the placeholder values with your actual Firebase config"
echo "2. Get your Firebase config from: https://console.firebase.google.com/"
echo "3. Go to Project Settings > General > Your Apps"
echo "4. Copy the config values to your .env file"
echo ""
echo "⚠️  IMPORTANT: Never commit the .env file to Git!"
echo "   It's already added to .gitignore for your safety."
echo ""
echo "🚀 After configuring, you can start the app with:"
echo "   ./start-app.sh"
echo ""
echo "📚 For detailed setup instructions, see SETUP.md"

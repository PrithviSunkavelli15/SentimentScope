#!/bin/bash

echo "🚀 Starting SentimentScope Journaling App..."
echo "=============================================="

# Start backend server
echo "📡 Starting backend server on port 3001..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers are starting up!"
echo "📡 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait

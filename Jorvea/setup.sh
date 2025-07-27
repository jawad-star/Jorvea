#!/bin/bash

# Jorvea Social Media App - Firebase Setup Script

echo "🔥 Setting up Jorvea Social Media App with Firebase + MUX..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Firebase config exists
if [ ! -f "src/config/firebase.ts" ]; then
    echo "❌ Error: Firebase config not found. Please ensure src/config/firebase.ts exists."
    exit 1
fi

# Check if .env file exists with MUX credentials
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Creating template..."
    cat > .env << 'EOF'
# MUX Configuration
MUX_TOKEN_ID=your_mux_token_id_here
MUX_TOKEN_SECRET=your_mux_token_secret_here

# Firebase Configuration (if needed)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
EOF
    echo "📝 .env template created. Please fill in your MUX and Firebase credentials."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Clear Metro cache to ensure fresh build
echo "🧹 Clearing Metro cache..."
npx react-native start --reset-cache &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null || true

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 Next Steps:"
echo "1. Update your .env file with your MUX credentials:"
echo "   - MUX_TOKEN_ID: Your MUX token ID"
echo "   - MUX_TOKEN_SECRET: Your MUX token secret"
echo ""
echo "2. Configure Firebase Security Rules in your Firebase Console:"
echo "   - Go to Firestore Database > Rules"
echo "   - Copy the rules from the DataMigrationScreen"
echo ""
echo "3. Test the setup:"
echo "   - Start the app: npm start"
echo "   - Go to Profile > Cloud icon > Test Firebase Connection"
echo "   - Clear old local data if migrating from AsyncStorage"
echo ""
echo "4. For video uploads to work:"
echo "   - Ensure MUX project is set up"
echo "   - Verify MUX credentials in .env file"
echo ""
echo "🎯 Features Available:"
echo "✅ Dynamic user profiles with Firebase"
echo "✅ Real-time posts and reels"
echo "✅ Follow system with requests"
echo "✅ Video streaming with MUX"
echo "✅ Real-time updates and notifications"
echo "✅ Automatic data cleanup when users are deleted"
echo ""
echo "🔧 Debug Tools:"
echo "   - Navigate to Profile > Cloud icon for migration tools"
echo "   - Test Firebase connection and data flow"
echo "   - Clear old AsyncStorage data"
echo ""
echo "Happy coding! 🎉"

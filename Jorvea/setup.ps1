# Jorvea Social Media App - Firebase Setup Script (PowerShell)

Write-Host "🔥 Setting up Jorvea Social Media App with Firebase + MUX..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Check if Firebase config exists
if (-Not (Test-Path "src/config/firebase.ts")) {
    Write-Host "❌ Error: Firebase config not found. Please ensure src/config/firebase.ts exists." -ForegroundColor Red
    exit 1
}

# Check if .env file exists with MUX credentials
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found. Creating template..." -ForegroundColor Yellow
    $envContent = @'
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
'@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "📝 .env template created. Please fill in your MUX and Firebase credentials." -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Clear Metro cache to ensure fresh build
Write-Host "🧹 Clearing Metro cache..." -ForegroundColor Yellow
Start-Process -FilePath "npx" -ArgumentList "react-native", "start", "--reset-cache" -NoNewWindow -PassThru | ForEach-Object {
    Start-Sleep 3
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env file with your MUX credentials:"
Write-Host "   - MUX_TOKEN_ID: Your MUX token ID"
Write-Host "   - MUX_TOKEN_SECRET: Your MUX token secret"
Write-Host ""
Write-Host "2. Configure Firebase Security Rules in your Firebase Console:"
Write-Host "   - Go to Firestore Database > Rules"
Write-Host "   - Copy the rules from the DataMigrationScreen"
Write-Host ""
Write-Host "3. Test the setup:"
Write-Host "   - Start the app: npm start"
Write-Host "   - Go to Profile then Cloud icon then Test Firebase Connection"
Write-Host "   - Clear old local data if migrating from AsyncStorage"
Write-Host ""
Write-Host "4. For video uploads to work:"
Write-Host "   - Ensure MUX project is set up"
Write-Host "   - Verify MUX credentials in .env file"
Write-Host ""
Write-Host "🎯 Features Available:" -ForegroundColor Green
Write-Host "✅ Dynamic user profiles with Firebase"
Write-Host "✅ Real-time posts and reels"
Write-Host "✅ Follow system with requests"
Write-Host "✅ Video streaming with MUX"
Write-Host "✅ Real-time updates and notifications"
Write-Host "✅ Automatic data cleanup when users are deleted"
Write-Host ""
Write-Host "🔧 Debug Tools:" -ForegroundColor Yellow
Write-Host "   - Navigate to Profile then Cloud icon for migration tools"
Write-Host "   - Test Firebase connection and data flow"
Write-Host "   - Clear old AsyncStorage data"
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Magenta

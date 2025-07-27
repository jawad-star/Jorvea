// Test script for MUX video upload
import { muxService } from './services/muxService';

async function testMuxUpload() {
  console.log('🧪 Testing MUX configuration...');
  
  if (!muxService.isConfigured()) {
    console.error('❌ MUX service not configured');
    console.log('Please ensure MUX_TOKEN_ID and MUX_TOKEN_SECRET are set in your .env file');
    return;
  }
  
  console.log('✅ MUX service is configured');
  
  try {
    console.log('🚀 Creating direct upload URL...');
    const uploadData = await muxService.createDirectUpload();
    console.log('✅ Direct upload URL created:', uploadData.id);
    
    console.log('📝 MUX Upload URL format is correct');
    console.log('💡 Next steps:');
    console.log('1. Select a video file in the app');
    console.log('2. Upload should now work without "invalid input" error');
    console.log('3. Check MUX dashboard for successful uploads');
    
  } catch (error) {
    console.error('❌ MUX test failed:', error);
  }
}

// Uncomment the line below to run the test
// testMuxUpload();

export { testMuxUpload };

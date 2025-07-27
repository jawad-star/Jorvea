// MUX Configuration Test Script
// Run this to verify your MUX credentials are working

import { muxService } from '../services/muxService';

export async function testMuxConfiguration() {
  console.log('🎥 Testing MUX Configuration...');
  
  try {
    if (!muxService) {
      console.error('❌ MUX Service not initialized');
      return false;
    }

    // Test 1: Check if service is properly initialized
    console.log('✅ MUX Service instance exists');

    // Test 2: Try to create a direct upload (this doesn't actually upload, just creates the URL)
    console.log('📝 Testing MUX API connection...');
    const uploadData = await muxService.createDirectUpload();
    
    if (uploadData && uploadData.uploadUrl) {
      console.log('✅ MUX API connection successful!');
      console.log('📤 Upload URL created:', uploadData.uploadUrl.substring(0, 50) + '...');
      return true;
    } else {
      console.error('❌ MUX API connection failed - no upload URL returned');
      return false;
    }
    
  } catch (error) {
    console.error('❌ MUX Configuration Error:', error);
    return false;
  }
}

// Instructions to run this test:
// 1. In your app, import this function
// 2. Call testMuxConfiguration() in a useEffect or button press
// 3. Check the console logs for results

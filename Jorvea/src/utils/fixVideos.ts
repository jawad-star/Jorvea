/**
 * Utility to fix existing reels that have upload IDs instead of asset IDs
 * This can be run to convert all existing reels to use proper MUX asset IDs
 */

import { contentService } from '../services';

export async function fixExistingReels() {
  try {
    console.log('🔧 Starting batch fix for existing reels...');
    
    // Get all reels
    const reels = await contentService.getAllReels();
    console.log(`📊 Found ${reels.length} reels to check`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const reel of reels) {
      try {
        // Skip if already has proper different asset and playback IDs
        if (reel.muxAssetId && reel.muxPlaybackId && reel.muxAssetId !== reel.muxPlaybackId) {
          console.log(`✅ Reel ${reel.id} already has proper IDs, skipping`);
          skippedCount++;
          continue;
        }
        
        // Skip if no asset ID at all
        if (!reel.muxAssetId) {
          console.log(`⚠️ Reel ${reel.id} has no asset ID, skipping`);
          skippedCount++;
          continue;
        }
        
        console.log(`🔄 Fixing reel ${reel.id} with asset ID: ${reel.muxAssetId}`);
        
        // Try to refresh this reel's video status
        const updated = await contentService.refreshReelVideoStatus(reel.id);
        
        if (updated) {
          console.log(`✅ Fixed reel ${reel.id}`);
          fixedCount++;
        } else {
          console.log(`⏳ Reel ${reel.id} still processing or not ready`);
          skippedCount++;
        }
        
        // Add delay to avoid overwhelming MUX API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error fixing reel ${reel.id}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`🎉 Batch fix complete!`);
    console.log(`   Fixed: ${fixedCount} reels`);
    console.log(`   Skipped: ${skippedCount} reels`);
    
    return { fixed: fixedCount, skipped: skippedCount };
    
  } catch (error) {
    console.error('❌ Error in batch fix:', error);
    throw error;
  }
}

export async function fixSingleReel(reelId: string) {
  try {
    console.log(`🔧 Fixing single reel: ${reelId}`);
    
    const updated = await contentService.refreshReelVideoStatus(reelId);
    
    if (updated) {
      console.log(`✅ Successfully fixed reel ${reelId}`);
      return true;
    } else {
      console.log(`⏳ Reel ${reelId} still processing or not ready`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error fixing reel ${reelId}:`, error);
    return false;
  }
}

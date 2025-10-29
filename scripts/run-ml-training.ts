/**
 * Manual ML Training Script
 * 
 * Triggers ML model training on-demand
 * Usage: tsx scripts/run-ml-training.ts
 */

import { MLTrainingService } from '../src/workers/services/ml-training-service';

async function main() {
  console.log('🤖 Starting manual ML training...\n');
  
  const service = new MLTrainingService();
  
  try {
    await service.run();
    console.log('\n✅ ML training completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ML training failed:', error);
    process.exit(1);
  }
}

main();

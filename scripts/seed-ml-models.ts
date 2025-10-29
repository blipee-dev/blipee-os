/**
 * Seed ML Models Configuration
 *
 * Creates initial ML model configurations in the database
 * These will be trained automatically on the 15th, or manually with npm run ml:train
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedMLModels() {
  console.log('🌱 Seeding ML model configurations...\n');

  // Get all organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name');

  if (orgsError || !orgs || orgs.length === 0) {
    console.log('⚠️  No organizations found. Skipping ML model seeding.');
    return;
  }

  console.log(`📊 Found ${orgs.length} organization(s)\n`);

  let totalSeeded = 0;

  for (const org of orgs) {
    console.log(`🏢 Setting up ML models for: ${org.name}`);

    // Model configurations for this organization
    const models = [
      {
        organization_id: org.id,
        model_type: 'emissions_prediction',
        model_name: 'Emissions Forecast Model (LSTM)',
        version: '1.0.0',
        status: 'training',
        framework: 'tensorflow.js',
        architecture: {
          type: 'lstm',
          layers: [
            { type: 'lstm', units: 50, returnSequences: true, inputShape: [30, 1] },
            { type: 'dropout', rate: 0.2 },
            { type: 'lstm', units: 25, returnSequences: false },
            { type: 'dropout', rate: 0.2 },
            { type: 'dense', units: 1, activation: 'linear' }
          ]
        },
        hyperparameters: {
          epochs: 50,
          batchSize: 32,
          learningRate: 0.001,
          windowSize: 30,
          validationSplit: 0.2
        }
      },
      {
        organization_id: org.id,
        model_type: 'anomaly_detection',
        model_name: 'Anomaly Detection Model (Autoencoder)',
        version: '1.0.0',
        status: 'training',
        framework: 'tensorflow.js',
        architecture: {
          type: 'autoencoder',
          encoderDim: 2,
          layers: [
            { type: 'dense', units: 16, activation: 'relu' },
            { type: 'dense', units: 8, activation: 'relu' },
            { type: 'dense', units: 2, activation: 'relu', name: 'encoder' },
            { type: 'dense', units: 8, activation: 'relu' },
            { type: 'dense', units: 16, activation: 'relu' },
            { type: 'dense', units: 1, activation: 'linear' }
          ]
        },
        hyperparameters: {
          epochs: 30,
          batchSize: 16,
          learningRate: 0.001,
          validationSplit: 0.2
        }
      }
    ];

    // Insert models (upsert to avoid duplicates)
    for (const model of models) {
      const { error } = await supabase
        .from('ml_models')
        .upsert(model, { onConflict: 'organization_id,model_type,version' });

      if (error) {
        console.log(`   ❌ Failed to create ${model.model_type}: ${error.message}`);
      } else {
        console.log(`   ✅ ${model.model_type}`);
        totalSeeded++;
      }
    }

    console.log('');
  }

  console.log(`\n🎉 Seeded ${totalSeeded} ML model configurations!`);
  console.log('\n📝 Next steps:');
  console.log('   1. Run manual training: npm run ml:train');
  console.log('   2. Or wait for automatic training on 15th at 2 AM UTC\n');
}

seedMLModels()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

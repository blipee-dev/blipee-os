/**
 * Seed ML Models Configuration
 * 
 * Creates initial ML model configurations in the database
 * These will be trained automatically on the 15th, or manually with npm run ml:train
 */

import { createClient } from '@supabase/supabase-js';

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
        id: `${org.id}-emissions-forecast`,
        organization_id: org.id,
        model_id: `${org.id}-emissions-forecast`,
        model_type: 'emissions_forecast',
        name: 'Emissions Forecast Model',
        description: 'LSTM model for predicting CO2 emissions',
        is_active: true,
        training_enabled: true,
        hyperparameters: {
          epochs: 50,
          batch_size: 32,
          learning_rate: 0.001,
          window_size: 30
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `${org.id}-energy-forecast`,
        organization_id: org.id,
        model_id: `${org.id}-energy-forecast`,
        model_type: 'energy_forecast',
        name: 'Energy Forecast Model',
        description: 'LSTM model for predicting energy consumption',
        is_active: true,
        training_enabled: true,
        hyperparameters: {
          epochs: 50,
          batch_size: 32,
          learning_rate: 0.001,
          window_size: 30
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `${org.id}-anomaly-detection`,
        organization_id: org.id,
        model_id: `${org.id}-anomaly-detection`,
        model_type: 'anomaly_detection',
        name: 'Anomaly Detection Model',
        description: 'Autoencoder for detecting unusual patterns',
        is_active: true,
        training_enabled: true,
        hyperparameters: {
          epochs: 30,
          batch_size: 16,
          learning_rate: 0.001,
          encoder_dim: 2
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert models (upsert to avoid duplicates)
    for (const model of models) {
      const { error } = await supabase
        .from('ml_models')
        .upsert(model, { onConflict: 'id' });

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

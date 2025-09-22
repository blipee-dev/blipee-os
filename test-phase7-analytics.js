/**
 * Comprehensive Test Suite for Phase 7 Advanced Analytics System
 * Tests all 5 core components: Streaming, ML Ensemble, Computer Vision, NLP, Optimization
 */

const BASE_URL = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3001';

async function testPhase7Analytics() {
  console.log('🚀 Starting Phase 7 Advanced Analytics Test Suite\n');

  const results = {
    streaming: { passed: 0, failed: 0 },
    ml_ensemble: { passed: 0, failed: 0 },
    computer_vision: { passed: 0, failed: 0 },
    esg_nlp: { passed: 0, failed: 0 },
    optimization: { passed: 0, failed: 0 }
  };

  // Test 1: Streaming Analytics
  console.log('📊 Testing Real-time Streaming Analytics...');
  await testStreamingAnalytics(results);

  // Test 2: ML Ensemble Models
  console.log('\n🤖 Testing ML Ensemble Models...');
  await testMLEnsemble(results);

  // Test 3: Computer Vision
  console.log('\n👁️ Testing Computer Vision...');
  await testComputerVision(results);

  // Test 4: ESG NLP Processing
  console.log('\n📝 Testing ESG NLP Processing...');
  await testESGNLP(results);

  // Test 5: Optimization Algorithms
  console.log('\n⚡ Testing Optimization Algorithms...');
  await testOptimization(results);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 PHASE 7 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  let totalPassed = 0, totalFailed = 0;

  Object.entries(results).forEach(([component, result]) => {
    const status = result.failed === 0 ? '✅' : '❌';
    console.log(`${status} ${component.toUpperCase().replace('_', ' ')}: ${result.passed} passed, ${result.failed} failed`);
    totalPassed += result.passed;
    totalFailed += result.failed;
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`🎯 OVERALL: ${totalPassed} passed, ${totalFailed} failed`);
  console.log(`✨ Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

  if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Phase 7 Advanced Analytics is fully operational!');
  } else {
    console.log(`\n⚠️  ${totalFailed} tests failed. Check the errors above for details.`);
  }
}

async function testStreamingAnalytics(results) {
  try {
    // Test streaming processor status
    const statusRes = await fetch(`${BASE_URL}/api/analytics/streaming?action=status`);
    if (statusRes.ok) {
      console.log('  ✅ Streaming status endpoint working');
      results.streaming.passed++;
    } else {
      throw new Error(`Status check failed: ${statusRes.status}`);
    }

    // Test processors list
    const processorsRes = await fetch(`${BASE_URL}/api/analytics/streaming?action=processors`);
    if (processorsRes.ok) {
      const data = await processorsRes.json();
      if (data.processors && data.processors.length >= 4) {
        console.log(`  ✅ Found ${data.processors.length} streaming processors`);
        results.streaming.passed++;
      } else {
        throw new Error('Expected at least 4 processors');
      }
    } else {
      throw new Error(`Processors check failed: ${processorsRes.status}`);
    }

    // Test event processing
    const mockEvents = [
      {
        id: 'test_event_1',
        timestamp: Date.now(),
        source: 'test_facility',
        type: 'energy',
        data: { value: 1250, unit: 'kWh' },
        metadata: { facility: 'test_facility', quality: 'high', confidence: 0.95 }
      },
      {
        id: 'test_event_2',
        timestamp: Date.now(),
        source: 'test_sensor',
        type: 'sensor',
        data: { temperature: 75, vibration: 0.02, efficiency: 0.92 },
        metadata: { device: 'test_device', quality: 'high', confidence: 0.88 }
      }
    ];

    const processRes = await fetch(`${BASE_URL}/api/analytics/streaming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: mockEvents })
    });

    if (processRes.ok) {
      const data = await processRes.json();
      if (data.success && data.processed === 2) {
        console.log(`  ✅ Processed ${data.processed} events successfully`);
        results.streaming.passed++;
      } else {
        throw new Error('Event processing failed');
      }
    } else {
      throw new Error(`Event processing failed: ${processRes.status}`);
    }

  } catch (error) {
    console.log(`  ❌ Streaming test failed: ${error.message}`);
    results.streaming.failed++;
  }
}

async function testMLEnsemble(results) {
  try {
    // Test available models
    const modelsRes = await fetch(`${BASE_URL}/api/analytics/ml-ensemble?action=models`);
    if (modelsRes.ok) {
      const data = await modelsRes.json();
      if (data.available_models && data.available_models.length >= 3) {
        console.log(`  ✅ Found ${data.available_models.length} ML model types`);
        results.ml_ensemble.passed++;
      } else {
        throw new Error('Expected at least 3 model types');
      }
    } else {
      throw new Error(`Models check failed: ${modelsRes.status}`);
    }

    // Test sustainability models
    const sustainRes = await fetch(`${BASE_URL}/api/analytics/ml-ensemble?action=sustainability_models`);
    if (sustainRes.ok) {
      const data = await sustainRes.json();
      if (data.sustainability_models && data.sustainability_models.length >= 3) {
        console.log(`  ✅ Found ${data.sustainability_models.length} sustainability models`);
        results.ml_ensemble.passed++;
      } else {
        throw new Error('Expected sustainability models');
      }
    } else {
      throw new Error(`Sustainability models check failed: ${sustainRes.status}`);
    }

    // Test model training
    const trainingData = {
      action: 'train',
      modelType: 'gradient_boosting',
      data: {
        features: [
          [1000, 1, 20, 8], // energy, facility_type, temperature, hours
          [1200, 1, 22, 10],
          [800, 2, 18, 6],
          [1500, 1, 25, 12],
          [900, 2, 19, 7]
        ],
        targets: [450, 540, 360, 675, 405] // carbon emissions
      },
      config: { n_estimators: 10, max_depth: 3 }
    };

    const trainRes = await fetch(`${BASE_URL}/api/analytics/ml-ensemble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainingData)
    });

    if (trainRes.ok) {
      const data = await trainRes.json();
      if (data.success && data.modelId) {
        console.log(`  ✅ Model training completed: ${data.modelId}`);
        results.ml_ensemble.passed++;
      } else {
        throw new Error('Model training failed');
      }
    } else {
      throw new Error(`Training failed: ${trainRes.status}`);
    }

  } catch (error) {
    console.log(`  ❌ ML Ensemble test failed: ${error.message}`);
    results.ml_ensemble.failed++;
  }
}

async function testComputerVision(results) {
  try {
    // Test capabilities
    const capabilitiesRes = await fetch(`${BASE_URL}/api/analytics/computer-vision?action=capabilities`);
    if (capabilitiesRes.ok) {
      const data = await capabilitiesRes.json();
      if (data.capabilities && data.capabilities.ocr && data.capabilities.extraction) {
        console.log('  ✅ Computer vision capabilities available');
        results.computer_vision.passed++;
      } else {
        throw new Error('Missing capabilities');
      }
    } else {
      throw new Error(`Capabilities check failed: ${capabilitiesRes.status}`);
    }

    // Test supported formats
    const formatsRes = await fetch(`${BASE_URL}/api/analytics/computer-vision?action=supported_formats`);
    if (formatsRes.ok) {
      const data = await formatsRes.json();
      if (data.supported_formats && data.supported_formats.images && data.supported_formats.documents) {
        console.log('  ✅ Multiple file formats supported');
        results.computer_vision.passed++;
      } else {
        throw new Error('Missing format support');
      }
    } else {
      throw new Error(`Formats check failed: ${formatsRes.status}`);
    }

    // Test sustainability patterns
    const patternsRes = await fetch(`${BASE_URL}/api/analytics/computer-vision?action=sustainability_patterns`);
    if (patternsRes.ok) {
      const data = await patternsRes.json();
      if (data.sustainability_patterns && Object.keys(data.sustainability_patterns).length >= 4) {
        console.log(`  ✅ Found ${Object.keys(data.sustainability_patterns).length} sustainability patterns`);
        results.computer_vision.passed++;
      } else {
        throw new Error('Missing sustainability patterns');
      }
    } else {
      throw new Error(`Patterns check failed: ${patternsRes.status}`);
    }

  } catch (error) {
    console.log(`  ❌ Computer Vision test failed: ${error.message}`);
    results.computer_vision.failed++;
  }
}

async function testESGNLP(results) {
  try {
    // Test frameworks
    const frameworksRes = await fetch(`${BASE_URL}/api/analytics/esg-nlp?action=frameworks`);
    if (frameworksRes.ok) {
      const data = await frameworksRes.json();
      if (data.supported_frameworks && Object.keys(data.supported_frameworks).length >= 5) {
        console.log(`  ✅ Found ${Object.keys(data.supported_frameworks).length} ESG frameworks`);
        results.esg_nlp.passed++;
      } else {
        throw new Error('Missing ESG frameworks');
      }
    } else {
      throw new Error(`Frameworks check failed: ${frameworksRes.status}`);
    }

    // Test NLP capabilities
    const capabilitiesRes = await fetch(`${BASE_URL}/api/analytics/esg-nlp?action=capabilities`);
    if (capabilitiesRes.ok) {
      const data = await capabilitiesRes.json();
      if (data.nlp_capabilities && data.nlp_capabilities.entity_extraction && data.nlp_capabilities.sentiment_analysis) {
        console.log('  ✅ NLP capabilities confirmed');
        results.esg_nlp.passed++;
      } else {
        throw new Error('Missing NLP capabilities');
      }
    } else {
      throw new Error(`Capabilities check failed: ${capabilitiesRes.status}`);
    }

    // Test ESG document processing
    const sampleText = `
      Our company achieved a 25% reduction in Scope 1 emissions this year, totaling 1,250 tonnes CO2e.
      Energy consumption decreased by 15% to 2,500 MWh through efficiency improvements.
      We increased our board diversity with 40% women directors and implemented new ethics training programs.
      Water usage was reduced by 10% to 50,000 gallons through conservation measures.
      Our ESG score improved from 75 to 82 this year due to these sustainability initiatives.
    `;

    const processRes = await fetch(`${BASE_URL}/api/analytics/esg-nlp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: sampleText,
        documentType: 'sustainability_report',
        industry: 'manufacturing'
      })
    });

    if (processRes.ok) {
      const data = await processRes.json();
      if (data.success && data.result.key_metrics && data.result.key_metrics.length > 0) {
        console.log(`  ✅ Extracted ${data.result.key_metrics.length} ESG metrics from sample text`);
        results.esg_nlp.passed++;
      } else {
        throw new Error('ESG processing failed');
      }
    } else {
      throw new Error(`ESG processing failed: ${processRes.status}`);
    }

  } catch (error) {
    console.log(`  ❌ ESG NLP test failed: ${error.message}`);
    results.esg_nlp.failed++;
  }
}

async function testOptimization(results) {
  try {
    // Test algorithms list
    const algorithmsRes = await fetch(`${BASE_URL}/api/analytics/optimization?action=algorithms`);
    if (algorithmsRes.ok) {
      const data = await algorithmsRes.json();
      if (data.available_algorithms && data.available_algorithms.length >= 4) {
        console.log(`  ✅ Found ${data.available_algorithms.length} optimization algorithms`);
        results.optimization.passed++;
      } else {
        throw new Error('Missing optimization algorithms');
      }
    } else {
      throw new Error(`Algorithms check failed: ${algorithmsRes.status}`);
    }

    // Test sustainability problems
    const problemsRes = await fetch(`${BASE_URL}/api/analytics/optimization?action=sustainability_problems`);
    if (problemsRes.ok) {
      const data = await problemsRes.json();
      if (data.predefined_problems && data.predefined_problems.length >= 4) {
        console.log(`  ✅ Found ${data.predefined_problems.length} sustainability optimization problems`);
        results.optimization.passed++;
      } else {
        throw new Error('Missing sustainability problems');
      }
    } else {
      throw new Error(`Problems check failed: ${problemsRes.status}`);
    }

    // Test optimization templates
    const templatesRes = await fetch(`${BASE_URL}/api/analytics/optimization?action=templates`);
    if (templatesRes.ok) {
      const data = await templatesRes.json();
      if (data.problem_templates && data.problem_templates.carbon_optimization && data.problem_templates.esg_optimization) {
        console.log('  ✅ Problem templates available');
        results.optimization.passed++;

        // Test running optimization with template
        const optimizationRes = await fetch(`${BASE_URL}/api/analytics/optimization`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            algorithm: 'pso',
            problem: data.problem_templates.carbon_optimization,
            options: { maxIterations: 50, swarmSize: 10 }
          })
        });

        if (optimizationRes.ok) {
          const optData = await optimizationRes.json();
          if (optData.success && optData.result) {
            console.log('  ✅ PSO optimization completed successfully');
            results.optimization.passed++;
          } else {
            throw new Error('Optimization execution failed');
          }
        } else {
          throw new Error(`Optimization failed: ${optimizationRes.status}`);
        }
      } else {
        throw new Error('Missing problem templates');
      }
    } else {
      throw new Error(`Templates check failed: ${templatesRes.status}`);
    }

  } catch (error) {
    console.log(`  ❌ Optimization test failed: ${error.message}`);
    results.optimization.failed++;
  }
}

// Add delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test suite
console.log('Phase 7 Advanced Analytics Test Suite');
console.log('====================================\n');

testPhase7Analytics().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
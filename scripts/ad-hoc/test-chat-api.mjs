/**
 * Test script for the unified queryMetrics tool in blipee-brain
 * Tests various natural language questions about different metrics and time periods
 */

const testQuestions = [
  {
    name: "Test 1: Emissions This Year",
    question: "What are my total emissions this year?"
  },
  {
    name: "Test 2: Energy Last Quarter",
    question: "How much energy did we use last quarter?"
  },
  {
    name: "Test 3: Water and Waste",
    question: "Show me our water and waste data"
  },
  {
    name: "Test 4: Overall Environmental Impact",
    question: "How are we doing with our environmental impact over the last 6 months?"
  },
  {
    name: "Test 5: This Month vs Last Year",
    question: "Compare this month's emissions with January last year"
  },
  {
    name: "Test 6: Electricity Consumption",
    question: "What's our electricity consumption this year?"
  }
];

async function testChatAPI(question, testName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${testName}`);
  console.log(`Question: "${question}"`);
  console.log('='.repeat(80));

  try {
    const response = await fetch('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, CSRF token would be needed
        // For testing purposes, we'll see if the API responds
      },
      body: JSON.stringify({
        message: question,
        conversationId: `test_${Date.now()}`
      })
    });

    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP ${response.status}: ${errorText}`);
      return;
    }

    const data = await response.json();

    console.log('\n✅ Response received:');
    console.log('Content:', data.content ? data.content.substring(0, 200) + '...' : 'No content');

    if (data.blipee) {
      console.log('\n📊 Blipee Brain Data:');
      if (data.blipee.toolCalls) {
        console.log(`  Tool Calls: ${data.blipee.toolCalls.length}`);
        data.blipee.toolCalls.forEach((call, i) => {
          console.log(`    ${i + 1}. ${call.name}(${JSON.stringify(call.parameters).substring(0, 100)}...)`);
        });
      }
      if (data.blipee.streamingUpdates) {
        console.log(`  Streaming Updates: ${data.blipee.streamingUpdates.length}`);
      }
      if (data.blipee.charts && data.blipee.charts.length > 0) {
        console.log(`  Charts Generated: ${data.blipee.charts.length}`);
      }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Testing Unified queryMetrics Tool');
  console.log('====================================\n');
  console.log('This tests the new multi-metric architecture that handles:');
  console.log('- Natural language understanding of metric types (emissions, energy, water, waste)');
  console.log('- Flexible time periods (ytd, 1m, 3m, 6m, 12m, custom dates)');
  console.log('- Balancing between not too restrictive (bot-like) and not too open (silly)\n');

  for (const test of testQuestions) {
    await testChatAPI(test.question, test.name);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Testing Complete');
  console.log('='.repeat(80));
}

runTests().catch(console.error);

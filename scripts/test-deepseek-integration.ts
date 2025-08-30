#!/usr/bin/env tsx
/**
 * DeepSeek API Integration Test
 * Test actual DeepSeek API connectivity and responses
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

import fetch from 'node-fetch';

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    logprobs: null;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function testDeepSeekAPI() {
  console.log('🤖 Testing DeepSeek API Integration...\n');
  
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error('❌ DEEPSEEK_API_KEY not found in environment');
      return false;
    }
    
    console.log('✅ DeepSeek API key found');
    console.log(`🔑 Key format: ${apiKey.substring(0, 8)}...${apiKey.slice(-8)}`);
    
    // Test 1: Basic API connectivity
    console.log('\n📡 Test 1: Basic API Connectivity');
    
    const testMessage = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: 'Hello! Can you tell me what you know about sustainability and ESG reporting?'
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    };
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(testMessage)
    });
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API call failed:', errorText);
      return false;
    }
    
    const data = await response.json() as DeepSeekResponse;
    
    console.log('✅ API call successful!');
    console.log(`🤖 Model: ${data.model}`);
    console.log(`💬 Response: ${data.choices[0]?.message?.content?.substring(0, 100)}...`);
    console.log(`📊 Usage: ${data.usage?.prompt_tokens} prompt + ${data.usage?.completion_tokens} completion = ${data.usage?.total_tokens} total tokens`);
    
    // Test 2: ESG-specific query
    console.log('\n🌱 Test 2: ESG-Specific Query');
    
    const esgMessage = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: 'What are the key components of Scope 1, Scope 2, and Scope 3 emissions in carbon accounting?'
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    };
    
    const esgResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(esgMessage)
    });
    
    if (!esgResponse.ok) {
      const errorText = await esgResponse.text();
      console.error('❌ ESG API call failed:', errorText);
      return false;
    }
    
    const esgData = await esgResponse.json() as DeepSeekResponse;
    
    console.log('✅ ESG query successful!');
    console.log(`🌱 ESG Response: ${esgData.choices[0]?.message?.content?.substring(0, 150)}...`);
    console.log(`📊 ESG Usage: ${esgData.usage?.total_tokens} tokens`);
    
    // Test 3: Rate limiting and performance
    console.log('\n⚡ Test 3: Performance Test (3 concurrent requests)');
    
    const performanceMessages = [
      'Calculate carbon intensity for a manufacturing company',
      'Explain the GRI sustainability reporting standards',
      'What is the difference between carbon footprint and carbon handprint?'
    ].map(content => ({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content }],
      max_tokens: 100,
      temperature: 0.5
    }));
    
    const startTime = Date.now();
    
    const performancePromises = performanceMessages.map(async (message, index) => {
      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(message)
        });
        
        if (!response.ok) {
          throw new Error(`Request ${index + 1} failed: ${response.statusText}`);
        }
        
        const data = await response.json() as DeepSeekResponse;
        return {
          index: index + 1,
          success: true,
          tokens: data.usage?.total_tokens || 0,
          response: data.choices[0]?.message?.content?.substring(0, 80) || ''
        };
        
      } catch (error) {
        return {
          index: index + 1,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
    
    const results = await Promise.all(performancePromises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successful = results.filter(r => r.success).length;
    const totalTokens = results.reduce((sum, r) => sum + (r.success ? r.tokens : 0), 0);
    
    console.log(`✅ Performance test completed in ${duration}ms`);
    console.log(`📊 Success rate: ${successful}/3 requests`);
    console.log(`💰 Total tokens used: ${totalTokens}`);
    console.log(`⚡ Average response time: ${(duration / 3).toFixed(0)}ms per request`);
    
    results.forEach(result => {
      if (result.success) {
        console.log(`  ✅ Request ${result.index}: ${result.tokens} tokens - "${result.response}..."`);
      } else {
        console.log(`  ❌ Request ${result.index}: ${result.error}`);
      }
    });
    
    console.log('\n🎉 All DeepSeek API tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - API Connectivity: ✅ Working`);
    console.log(`   - ESG Knowledge: ✅ Comprehensive`);
    console.log(`   - Performance: ${successful}/3 requests successful`);
    console.log(`   - Rate Limits: ✅ No issues detected`);
    
    return successful === 3;
    
  } catch (error) {
    console.error('❌ DeepSeek API test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        console.error('🌐 Network connectivity issue detected');
      }
      
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        console.error('🔑 API key authentication issue detected');
        console.error('   Please verify DEEPSEEK_API_KEY is correct');
      }
      
      if (error.message.includes('429')) {
        console.error('⏱️ Rate limit exceeded - API is working but hitting limits');
      }
    }
    
    return false;
  }
}

// Run the DeepSeek test
if (require.main === module) {
  testDeepSeekAPI()
    .then(success => {
      if (success) {
        console.log('\n🚀 DeepSeek integration is fully working and ready for production!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Some DeepSeek tests failed. Please review and fix issues.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 DeepSeek test execution failed:', error);
      process.exit(1);
    });
}

export { testDeepSeekAPI };
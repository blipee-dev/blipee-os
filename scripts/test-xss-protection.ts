#!/usr/bin/env tsx

/**
 * Test script for XSS protection
 * Run with: npm run test:xss
 */

import { sanitizeUserInput, sanitizeHTML } from '../src/lib/validation/sanitization';

const xssTestCases = [
  {
    name: 'Script tag injection',
    input: 'Hello <script>alert("XSS")</script> World',
    expected: 'Hello  World',
  },
  {
    name: 'Event handler injection',
    input: '<img src="x" onerror="alert(\'XSS\')">',
    expected: '<img src="x">',
  },
  {
    name: 'JavaScript URL injection',
    input: '<a href="javascript:alert(\'XSS\')">Click me</a>',
    expected: '<a>Click me</a>',
  },
  {
    name: 'Data URL injection',
    input: '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>',
    expected: '<a>Click</a>',
  },
  {
    name: 'Style injection',
    input: '<div style="background: url(javascript:alert(\'XSS\'))">Test</div>',
    expected: '<div>Test</div>',
  },
  {
    name: 'Iframe injection',
    input: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    expected: '',
  },
  {
    name: 'SVG script injection',
    input: '<svg><script>alert("XSS")</script></svg>',
    expected: '<svg></svg>',
  },
  {
    name: 'Valid markdown should work',
    input: '**Bold text** and *italic* with `code`',
    expected: '**Bold text** and *italic* with `code`',
  },
  {
    name: 'Valid links should be preserved',
    input: '[Click here](https://example.com)',
    expected: '[Click here](https://example.com)',
  },
];

console.log('🔐 Testing XSS Protection...\n');

let passed = 0;
let failed = 0;

// Test sanitizeUserInput
console.log('Testing sanitizeUserInput function:');
console.log('=================================');

xssTestCases.forEach((testCase) => {
  const result = sanitizeUserInput(testCase.input);
  const success = result === testCase.expected;
  
  if (success) {
    console.log(`✅ ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ ${testCase.name}`);
    console.log(`   Input:    ${testCase.input}`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got:      ${result}`);
    failed++;
  }
});

// Test HTML sanitization for safe HTML rendering
console.log('\n\nTesting sanitizeHTML function:');
console.log('==============================');

const htmlTestCases = [
  {
    name: 'Safe HTML formatting',
    input: '<strong>Bold</strong> and <em>italic</em>',
    shouldContain: ['<strong>Bold</strong>', '<em>italic</em>'],
  },
  {
    name: 'Script removal',
    input: '<p>Hello <script>alert("XSS")</script> World</p>',
    shouldNotContain: ['<script>', 'alert'],
    shouldContain: ['<p>Hello  World</p>'],
  },
  {
    name: 'Event handler removal',
    input: '<button onclick="alert(\'XSS\')">Click</button>',
    shouldNotContain: ['onclick', 'alert'],
    shouldContain: ['<button>Click</button>'],
  },
];

htmlTestCases.forEach((testCase) => {
  const result = sanitizeHTML(testCase.input);
  let success = true;
  
  if (testCase.shouldContain) {
    testCase.shouldContain.forEach(str => {
      if (!result.includes(str)) {
        success = false;
      }
    });
  }
  
  if (testCase.shouldNotContain) {
    testCase.shouldNotContain.forEach(str => {
      if (result.includes(str)) {
        success = false;
      }
    });
  }
  
  if (success) {
    console.log(`✅ ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ ${testCase.name}`);
    console.log(`   Input:  ${testCase.input}`);
    console.log(`   Result: ${result}`);
    failed++;
  }
});

// Summary
console.log('\n\n📊 Test Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n✨ All XSS protection tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please check the XSS protection implementation.');
  process.exit(1);
}
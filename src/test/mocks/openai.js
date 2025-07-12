// Mock for openai
class MockOpenAI {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;
    this.chat = {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{ message: { content: 'Mock response' } }]
        }))
      }
    };
  }
}

module.exports = MockOpenAI;
module.exports.default = MockOpenAI;
// ESM Mock for openai
class MockOpenAI {
  constructor(config) {
    this.apiKey = config?.apiKey || 'mock-key';
    this.chat = {
      completions: {
        create: jest.fn(async (params) => {
          if (params.stream) {
            // Return async generator for streaming
            return {
              async *[Symbol.asyncIterator]() {
                yield {
                  id: 'chatcmpl-mock',
                  object: 'chat.completion.chunk',
                  created: Date.now(),
                  model: params.model,
                  choices: [{
                    index: 0,
                    delta: { content: 'Mock ' },
                    finish_reason: null
                  }]
                };
                yield {
                  id: 'chatcmpl-mock',
                  object: 'chat.completion.chunk',
                  created: Date.now(),
                  model: params.model,
                  choices: [{
                    index: 0,
                    delta: { content: 'response' },
                    finish_reason: null
                  }]
                };
                yield {
                  id: 'chatcmpl-mock',
                  object: 'chat.completion.chunk',
                  created: Date.now(),
                  model: params.model,
                  choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: 'stop'
                  }]
                };
              }
            };
          }
          
          return {
            id: 'chatcmpl-mock',
            object: 'chat.completion',
            created: Date.now(),
            model: params.model,
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: 'Mock response'
              },
              finish_reason: 'stop'
            }],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 5,
              total_tokens: 15
            }
          };
        })
      }
    };
    
    this.embeddings = {
      create: jest.fn(async () => ({
        object: 'list',
        data: [{
          object: 'embedding',
          embedding: new Array(1536).fill(0.1),
          index: 0
        }],
        model: 'text-embedding-ada-002',
        usage: {
          prompt_tokens: 8,
          total_tokens: 8
        }
      }))
    };
    
    this.images = {
      generate: jest.fn(async () => ({
        created: Date.now(),
        data: [{
          url: 'https://example.com/mock-image.png'
        }]
      }))
    };
  }
}

export default MockOpenAI;
export { MockOpenAI as OpenAI };
// ESM Mock for @anthropic-ai/sdk
class MockAnthropic {
  constructor(config) {
    this.apiKey = config?.apiKey || 'mock-key';
    this.messages = {
      create: jest.fn(async (params) => {
        if (params.stream) {
          // Return async generator for streaming
          return {
            async *[Symbol.asyncIterator]() {
              yield {
                type: 'message_start',
                message: {
                  id: 'msg_mock',
                  type: 'message',
                  role: 'assistant',
                  content: [],
                  model: params.model,
                  stop_reason: null,
                  stop_sequence: null,
                  usage: { input_tokens: 0, output_tokens: 0 }
                }
              };
              yield {
                type: 'content_block_start',
                index: 0,
                content_block: { type: 'text', text: '' }
              };
              yield {
                type: 'content_block_delta',
                index: 0,
                delta: { type: 'text_delta', text: 'Mock anthropic response' }
              };
              yield {
                type: 'content_block_stop',
                index: 0
              };
              yield {
                type: 'message_delta',
                delta: { stop_reason: 'end_turn', stop_sequence: null }
              };
              yield {
                type: 'message_stop'
              };
            }
          };
        }
        
        return {
          id: 'msg_mock',
          type: 'message',
          role: 'assistant',
          content: [{
            type: 'text',
            text: 'Mock anthropic response'
          }],
          model: params.model,
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: 10,
            output_tokens: 5
          }
        };
      })
    };
  }
}

export default MockAnthropic;
export { MockAnthropic as Anthropic };
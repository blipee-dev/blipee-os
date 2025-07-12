// ESM Mock for graphql-ws
export const createClient = jest.fn((options) => ({
  subscribe: jest.fn((payload, sink) => {
    // Simulate subscription
    setTimeout(() => {
      sink.next({ data: { mockSubscription: true } });
    }, 0);
    
    return () => {
      // Unsubscribe function
    };
  }),
  
  dispose: jest.fn(),
  
  on: jest.fn(),
  
  terminate: jest.fn()
}));

export const GRAPHQL_TRANSPORT_WS_PROTOCOL = 'graphql-transport-ws';

export default {
  createClient,
  GRAPHQL_TRANSPORT_WS_PROTOCOL
};
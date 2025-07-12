// Test fixtures for Fortune 10 testing

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin'
};

export const mockOrganization = {
  id: 'test-org-id',
  name: 'Test Organization',
  created_at: new Date().toISOString()
};

export const mockBuilding = {
  id: 'test-building-id',
  name: 'Test Building',
  organization_id: 'test-org-id',
  address: '123 Test St',
  square_footage: 10000
};

export const mockConversation = {
  id: 'test-conversation-id',
  user_id: 'test-user-id',
  messages: []
};

export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data)
});

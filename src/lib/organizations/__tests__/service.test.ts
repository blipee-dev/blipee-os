import { jest } from '@jest/globals';
import { 
  OrganizationService,
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  listOrganizations 
} from '../service';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => ({ 
        data: { 
          id: 'org-1', 
          name: 'Test Org',
          slug: 'test-org'
        }, 
        error: null 
      })),
      limit: jest.fn(() => ({ 
        data: [
          { id: 'org-1', name: 'Test Org 1' },
          { id: 'org-2', name: 'Test Org 2' }
        ], 
        error: null 
      }))
    }))
  }))
}));

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(() => {
    service = new OrganizationService();
    jest.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create a new organization', async () => {
      const org = await createOrganization({
        name: 'New Organization',
        slug: 'new-org',
        ownerId: 'user-1'
      });

      expect(org).toHaveProperty('id');
      expect(org.name).toBe('Test Org');
    });

    it('should validate organization data', async () => {
      await expect(createOrganization({
        name: '',
        slug: 'invalid',
        ownerId: 'user-1'
      })).rejects.toThrow();
    });
  });

  describe('getOrganization', () => {
    it('should retrieve organization by ID', async () => {
      const org = await getOrganization('org-1');
      
      expect(org).toBeDefined();
      expect(org?.id).toBe('org-1');
      expect(org?.name).toBe('Test Org');
    });

    it('should return null for non-existent organization', async () => {
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => ({ data: null, error: new Error('Not found') }))
        }))
      });

      const org = await getOrganization('non-existent');
      expect(org).toBeNull();
    });
  });

  describe('updateOrganization', () => {
    it('should update organization details', async () => {
      const updated = await updateOrganization('org-1', {
        name: 'Updated Org Name'
      });

      expect(updated).toBeDefined();
      expect(updated?.id).toBe('org-1');
    });

    it('should validate update data', async () => {
      await expect(updateOrganization('org-1', {
        name: ''
      })).rejects.toThrow();
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization', async () => {
      await expect(deleteOrganization('org-1')).resolves.not.toThrow();
    });

    it('should handle deletion errors', async () => {
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn(() => ({ error: new Error('Delete failed') }))
        }))
      });

      await expect(deleteOrganization('org-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('listOrganizations', () => {
    it('should list organizations for user', async () => {
      const orgs = await listOrganizations('user-1');
      
      expect(orgs).toHaveLength(2);
      expect(orgs[0].name).toBe('Test Org 1');
      expect(orgs[1].name).toBe('Test Org 2');
    });

    it('should return empty array for user with no organizations', async () => {
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn(() => ({ data: [], error: null }))
        }))
      });

      const orgs = await listOrganizations('user-no-orgs');
      expect(orgs).toEqual([]);
    });
  });
});
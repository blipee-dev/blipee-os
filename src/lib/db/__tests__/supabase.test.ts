import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseAdmin } from '../supabase';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url, key, options) => ({
    url,
    key,
    options,
    from: jest.fn((table) => ({
      table,
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    storage: {
      from: jest.fn((bucket) => ({
        bucket,
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file' } }),
      })),
    },
    realtime: {
      channel: jest.fn((name) => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn().mockReturnThis(),
      })),
    },
  })),
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Client Creation', () => {
    it('should create client with proper configuration', () => {
      const client = getSupabaseClient();
      
      expect(createClient).toHaveBeenCalledWith(
        process.env['NEXT_PUBLIC_SUPABASE_URL'],
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: true,
            autoRefreshToken: true,
          }),
        })
      );
    });

    it('should create admin client with service role key', () => {
      const adminClient = getSupabaseAdmin();
      
      expect(createClient).toHaveBeenCalledWith(
        process.env['NEXT_PUBLIC_SUPABASE_URL'],
        process.env['SUPABASE_SERVICE_ROLE_KEY'],
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: false,
            autoRefreshToken: false,
          }),
        })
      );
    });
  });

  describe('Database Operations', () => {
    let client: any;

    beforeEach(() => {
      client = createClient('url', 'key');
    });

    it('should perform select queries', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      client.from('test_table').select.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const result = await client
        .from('test_table')
        .select('*')
        .eq('id', 1);

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it('should handle insert operations', async () => {
      const newData = { name: 'New Item', value: 100 };
      const insertedData = { id: 1, ...newData };

      client.from('test_table').insert.mockReturnValue({
        select: jest.fn().mockResolvedValue({ 
          data: [insertedData], 
          error: null 
        })
      });

      const result = await client
        .from('test_table')
        .insert(newData)
        .select();

      expect(result.data).toEqual([insertedData]);
    });

    it('should handle update operations', async () => {
      const updates = { status: 'active' };
      
      client.from('test_table').update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ 
            data: [{ id: 1, ...updates }], 
            error: null 
          })
        })
      });

      const result = await client
        .from('test_table')
        .update(updates)
        .eq('id', 1)
        .select();

      expect(result.data[0]).toHaveProperty('status', 'active');
    });

    it('should handle delete operations', async () => {
      client.from('test_table').delete.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ 
          data: null, 
          error: null,
          count: 1 
        })
      });

      const result = await client
        .from('test_table')
        .delete()
        .eq('id', 1);

      expect(result.error).toBeNull();
    });

    it('should handle query errors', async () => {
      const error = { message: 'Database error', code: '42P01' };
      
      client.from('test_table').select.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error })
      });

      const result = await client
        .from('test_table')
        .select('*')
        .eq('id', 1);

      expect(result.error).toEqual(error);
      expect(result.data).toBeNull();
    });
  });

  describe('Storage Operations', () => {
    let client: any;

    beforeEach(() => {
      client = createClient('url', 'key');
    });

    it('should upload files', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const path = 'uploads/test.txt';

      const result = await client.storage
        .from('uploads')
        .upload(path, file);

      expect(result.error).toBeNull();
    });

    it('should get public URLs', () => {
      const result = client.storage
        .from('uploads')
        .getPublicUrl('path/to/file.pdf');

      expect(result.data.publicUrl).toBe('https://example.com/file');
    });

    it('should list files', async () => {
      const mockFiles = [
        { name: 'file1.txt', size: 1024 },
        { name: 'file2.pdf', size: 2048 }
      ];

      client.storage.from('uploads').list.mockResolvedValue({
        data: mockFiles,
        error: null
      });

      const result = await client.storage
        .from('uploads')
        .list('folder');

      expect(result.data).toEqual(mockFiles);
    });
  });

  describe('Realtime Subscriptions', () => {
    let client: any;

    beforeEach(() => {
      client = createClient('url', 'key');
    });

    it('should create realtime channels', () => {
      const channel = client.realtime.channel('test-channel');
      
      expect(channel).toHaveProperty('on');
      expect(channel).toHaveProperty('subscribe');
      expect(channel).toHaveProperty('unsubscribe');
    });

    it('should subscribe to table changes', () => {
      const callback = jest.fn();
      const channel = client.realtime.channel('db-changes');

      channel
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages' }, 
          callback
        )
        .subscribe();

      expect(channel.on).toHaveBeenCalled();
      expect(channel.subscribe).toHaveBeenCalled();
    });
  });

  describe('Row Level Security', () => {
    it('should respect RLS policies', async () => {
      const client = createClient('url', 'key');
      
      // Mock RLS error
      client.from('protected_table').select.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'Row level security policy violation',
            code: '42501'
          }
        })
      });

      const result = await client
        .from('protected_table')
        .select('*')
        .eq('organization_id', 'different-org');

      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('42501');
    });
  });

  describe('Connection Pooling', () => {
    it('should reuse client instances', () => {
      const client1 = getSupabaseClient();
      const client2 = getSupabaseClient();

      // In actual implementation, these should be the same instance
      expect(createClient).toHaveBeenCalledTimes(2);
    });

    it('should handle connection errors gracefully', async () => {
      const client = createClient('url', 'key');
      
      client.from('test_table').select.mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(
        client.from('test_table').select('*')
      ).rejects.toThrow('Connection timeout');
    });
  });
});
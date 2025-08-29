import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn()
      }))
    }
  }))
}));

describe('File Upload API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = require('@/lib/supabase/server').createClient();
  });

  describe('POST /api/files/upload', () => {
    it('should upload file', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        _error: null
      });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'uploads/file123.pdf' },
        _error: null
      });

      const formData = new FormData();
      formData.append('file', new Blob(['test content']), 'test.pdf');

      const _request = new NextRequest('http://localhost:3000/api/files/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.path).toContain('file123.pdf');
    });

    it('should validate file type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        _error: null
      });

      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.exe');

      const _request = new NextRequest('http://localhost:3000/api/files/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should enforce file size limit', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        _error: null
      });

      const largeFile = new Blob([new Array(11 * 1024 * 1024).join('a')]);
      const formData = new FormData();
      formData.append('file', largeFile, 'large.pdf');

      const _request = new NextRequest('http://localhost:3000/api/files/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      expect(response.status).toBe(413);
    });
  });
});
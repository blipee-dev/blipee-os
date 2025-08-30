import { describe, it, expect } from '@jest/globals';

describe('API Response Utilities', () => {
  // Response builders
  const successResponse = (data, message = 'Success') => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
  
  const errorResponse = (error, code = 'ERROR') => ({
    success: false,
    error: {
      code,
      message: error.message || error,
      timestamp: new Date().toISOString()
    }
  });
  
  const paginatedResponse = (data, page, limit, total) => ({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
  
  describe('Success responses', () => {
    it('should create success response', () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Success');
      expect(response.timestamp).toBeDefined();
    });
    
    it('should allow custom success message', () => {
      const response = successResponse({}, 'Data saved');
      expect(response.message).toBe('Data saved');
    });
  });
  
  describe('Error responses', () => {
    it('should create error response from Error object', () => {
      const error = new Error('Something went wrong');
      const response = errorResponse(error);
      
      expect(response.success).toBe(false);
      expect(response..message).toBe('Something went wrong');
      expect(response.error.code).toBe('ERROR');
    });
    
    it('should create error response from string', () => {
      const response = errorResponse('Invalid input', 'VALIDATION_ERROR');
      
      expect(response.success).toBe(false);
      expect(response..message).toBe('Invalid input');
      expect(response.error.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('Paginated responses', () => {
    it('should create paginated response', () => {
      const data = [1, 2, 3, 4, 5];
      const response = paginatedResponse(data, 1, 10, 50);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(10);
      expect(response.pagination.total).toBe(50);
      expect(response.pagination.pages).toBe(5);
    });
    
    it('should calculate correct page count', () => {
      const response = paginatedResponse([], 1, 20, 45);
      expect(response.pagination.pages).toBe(3); // ceil(45/20) = 3
    });
  });
});
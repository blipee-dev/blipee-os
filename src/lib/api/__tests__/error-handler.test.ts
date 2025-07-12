import { 
  handleApiError, 
  ApiError, 
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError 
} from '../error-handler';

describe('error-handler', () => {
  describe('ApiError', () => {
    it('should create basic API error', () => {
      const error = new ApiError('Something went wrong', 500);
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ApiError');
    });

    it('should include error code if provided', () => {
      const error = new ApiError('Not found', 404, 'RESOURCE_NOT_FOUND');
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
    });

    it('should include validation details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ValidationError('Validation failed', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with 404 status', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with 401 status', () => {
      const error = new UnauthorizedError('Please login');
      expect(error.message).toBe('Please login');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with 403 status', () => {
      const error = new ForbiddenError('Access denied');
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('handleApiError', () => {
    it('should format ApiError correctly', () => {
      const error = new ApiError('Test error', 500, 'TEST_ERROR');
      const response = handleApiError(error);
      expect(response.error).toBe('Test error');
      expect(response.code).toBe('TEST_ERROR');
      expect(response.statusCode).toBe(500);
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');
      const response = handleApiError(error);
      expect(response.error).toBe('Generic error');
      expect(response.statusCode).toBe(500);
    });

    it('should handle unknown errors', () => {
      const response = handleApiError('String error');
      expect(response.error).toBe('An unexpected error occurred');
      expect(response.statusCode).toBe(500);
    });
  });
});
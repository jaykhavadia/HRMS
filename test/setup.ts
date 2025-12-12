// Jest test setup file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_URI = 'mongodb://localhost:27017/hrms_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRATION = '1h';

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
  console.log('🧪 Setting up tests...');
});

afterAll(async () => {
  // Any global cleanup can go here
  console.log('🧪 Cleaning up tests...');
});

// Increase timeout for async operations
jest.setTimeout(10000);

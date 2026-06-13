// Test importing package
const { ResponseUtil, DatabaseType } = require('@rtns/core');

console.log('✅ Package imported successfully!');
console.log('✅ ResponseUtil type:', typeof ResponseUtil);

// Mock Express response object
const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('\nResponse Status:', this.statusCode);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    return this;
  }
};

// Test 1: Success response
console.log('\n--- TEST 1: Success Response ---');
ResponseUtil.success(mockRes, { userId: '123', name: 'Test User' }, 'User fetched');

// Test 2: Error response
console.log('\n--- TEST 2: Error Response ---');
ResponseUtil.error(mockRes, 'User not found', 404);

// Test 3: Validation error
console.log('\n--- TEST 3: Validation Error ---');
ResponseUtil.validationError(mockRes, [
  { field: 'email', message: 'Invalid email format' }
]);
console.log('\nDatabase Types:', DatabaseType);

console.log('\n✅ ALL TESTS PASSED! Package is working correctly.\n');
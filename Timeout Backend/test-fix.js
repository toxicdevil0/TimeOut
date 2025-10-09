// Test script to verify our timestamp fix logic
console.log('Testing timestamp handling fix...');

// Simulate different timestamp formats
const testCases = [
  {
    name: 'JavaScript Date',
    startTime: new Date('2025-09-21T02:26:26.000Z'),
    expected: 'Should work'
  },
  {
    name: 'Firestore Timestamp-like object',
    startTime: {
      toDate: () => new Date('2025-09-21T02:26:26.000Z')
    },
    expected: 'Should work'
  },
  {
    name: 'Invalid object',
    startTime: { invalid: true },
    expected: 'Should throw error'
  }
];

function testTimestampHandling(startTime) {
  try {
    const endTime = new Date();
    let startTimeMs;
    
    if (startTime instanceof Date) {
      startTimeMs = startTime.getTime();
      console.log('✅ Handled as Date object');
    } else if (startTime && typeof startTime === 'object' && 'toDate' in startTime) {
      startTimeMs = startTime.toDate().getTime();
      console.log('✅ Handled as Firestore Timestamp');
    } else {
      console.error('❌ Invalid startTime format:', startTime);
      throw new Error('Invalid session startTime format');
    }
    
    const actualDuration = Math.floor((endTime.getTime() - startTimeMs) / (1000 * 60));
    console.log(`Duration: ${actualDuration} minutes`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testCases.forEach(testCase => {
  console.log(`\n--- Testing: ${testCase.name} ---`);
  const result = testTimestampHandling(testCase.startTime);
  console.log(`Expected: ${testCase.expected}, Got: ${result ? 'Success' : 'Error'}`);
});
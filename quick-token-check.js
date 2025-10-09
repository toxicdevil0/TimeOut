/**
 * Quick Token System Status Check
 * 
 * Simple validation to check if token system is implemented correctly
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - File not found: ${path.basename(filePath)}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, patterns, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ ${description} - File not found`, 'red');
    return 0;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let matchCount = 0;

  for (const { pattern, desc } of patterns) {
    if (pattern.test(content)) {
      log(`  ✅ ${desc}`, 'green');
      matchCount++;
    } else {
      log(`  ❌ ${desc}`, 'red');
    }
  }

  return matchCount;
}

async function quickTokenCheck() {
  log('🔍 Quick Token System Status Check', 'bright');
  log('═'.repeat(40), 'cyan');

  let totalChecks = 0;
  let passedChecks = 0;

  // Backend Files
  log('\n🔧 BACKEND FILES:', 'blue');
  const backendFiles = [
    'Timeout Backend/functions/src/callable/tokens.ts',
    'Timeout Backend/functions/src/types/tokens.ts',
    'Timeout Backend/functions/src/index.ts'
  ];

  for (const file of backendFiles) {
    totalChecks++;
    if (checkFileExists(file, `Backend: ${path.basename(file)}`)) {
      passedChecks++;
    }
  }

  // Frontend Files
  log('\n🌐 FRONTEND FILES:', 'blue');
  const frontendFiles = [
    'Timeout Frontend/src/contexts/TokenContext.tsx',
    'Timeout Frontend/src/config/tokenFirebase.ts',
    'Timeout Frontend/src/components/tokens/TokenDisplay.tsx',
    'Timeout Frontend/src/components/tokens/TokenStatsDashboard.tsx',
    'Timeout Frontend/src/components/tokens/TokenShop.tsx'
  ];

  for (const file of frontendFiles) {
    totalChecks++;
    if (checkFileExists(file, `Frontend: ${path.basename(file)}`)) {
      passedChecks++;
    }
  }

  // Quick Content Checks
  log('\n📋 QUICK CONTENT VALIDATION:', 'blue');
  
  // Check TokenContext has key functions
  const tokenContextPath = 'Timeout Frontend/src/contexts/TokenContext.tsx';
  if (fs.existsSync(tokenContextPath)) {
    const contextMatches = checkFileContent(tokenContextPath, [
      { pattern: /export const TokenProvider/, desc: 'TokenProvider exported' },
      { pattern: /export const useTokens/, desc: 'useTokens hook exported' },
      { pattern: /awardTokens/, desc: 'awardTokens function' },
      { pattern: /spendTokens/, desc: 'spendTokens function' },
      { pattern: /syncToDatabase/, desc: 'Database sync' }
    ], 'TokenContext functionality');
    
    totalChecks += 5;
    passedChecks += contextMatches;
  }

  // Check backend tokens file
  const backendTokensPath = 'Timeout Backend/functions/src/callable/tokens.ts';
  if (fs.existsSync(backendTokensPath)) {
    const backendMatches = checkFileContent(backendTokensPath, [
      { pattern: /export const saveUserTokens/, desc: 'saveUserTokens function' },
      { pattern: /export const getUserTokens/, desc: 'getUserTokens function' },
      { pattern: /export const addTokenTransaction/, desc: 'addTokenTransaction function' },
      { pattern: /getFirestore/, desc: 'Firestore integration' }
    ], 'Backend token functions');
    
    totalChecks += 4;
    passedChecks += backendMatches;
  }

  // Check Integration
  log('\n🔗 INTEGRATION CHECK:', 'blue');
  const timeoutAppPath = 'Timeout Frontend/src/components/TimeOutApp.tsx';
  if (fs.existsSync(timeoutAppPath)) {
    const integrationMatches = checkFileContent(timeoutAppPath, [
      { pattern: /TokenProvider/, desc: 'TokenProvider integration in main app' }
    ], 'App integration');
    
    totalChecks += 1;
    passedChecks += integrationMatches;
  }

  // Token Usage Check
  log('\n💰 TOKEN USAGE CHECK:', 'blue');
  const componentsToCheck = [
    'Timeout Frontend/src/components/layout/TimerView.tsx',
    'Timeout Frontend/src/components/dashboard/tabs/DigitalDetoxTab.tsx',
    'Timeout Frontend/src/components/tokens/TokenShop.tsx'
  ];

  let usageCount = 0;
  for (const file of componentsToCheck) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('useTokens') || content.includes('awardTokens') || content.includes('spendTokens')) {
        log(`  ✅ ${path.basename(file)} uses token system`, 'green');
        usageCount++;
      }
    }
  }
  
  totalChecks += 1;
  if (usageCount > 0) {
    passedChecks += 1;
    log(`  📊 Token system used in ${usageCount} components`, 'cyan');
  } else {
    log(`  ❌ No token usage found in key components`, 'red');
  }

  // Summary
  log('\n📊 SUMMARY:', 'bright');
  log('─'.repeat(20), 'cyan');
  
  const successRate = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  
  log(`Total Checks: ${totalChecks}`, 'blue');
  log(`Passed: ${passedChecks}`, 'green');
  log(`Failed: ${totalChecks - passedChecks}`, passedChecks === totalChecks ? 'green' : 'red');
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

  log('\n🎯 STATUS:', 'bright');
  if (successRate >= 90) {
    log('🎉 EXCELLENT! Token system is fully implemented!', 'green');
    log('   Ready for production testing', 'green');
  } else if (successRate >= 75) {
    log('👍 GOOD! Token system is mostly complete', 'yellow');
    log('   Minor issues may need attention', 'yellow');
  } else if (successRate >= 50) {
    log('⚠️ PARTIAL! Token system has some components', 'yellow');
    log('   Significant work still needed', 'yellow');
  } else {
    log('❌ INCOMPLETE! Token system needs major work', 'red');
    log('   Most components are missing', 'red');
  }

  log('\n🚀 NEXT STEPS:', 'bright');
  if (successRate >= 75) {
    log('1. Start the development server: npm run dev', 'cyan');
    log('2. Test token functionality in the UI', 'cyan');
    log('3. Check browser console for any errors', 'cyan');
    log('4. Try switching between mock and database modes', 'cyan');
  } else {
    log('1. Review the failed checks above', 'cyan');
    log('2. Ensure all token files are properly created', 'cyan');
    log('3. Verify imports and exports are correct', 'cyan');
    log('4. Re-run this check after fixes', 'cyan');
  }
}

// Run the check
quickTokenCheck();
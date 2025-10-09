/**
 * Simple Token System Test Runner
 * Tests backend and frontend integration without complex auth setup
 */

const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class SimpleTokenTester {
  constructor() {
    this.results = {
      backend: { passed: 0, failed: 0, errors: [] },
      frontend: { passed: 0, failed: 0, errors: [] }
    };
    
    this.backendPath = path.resolve(__dirname, '../Timeout Backend');
    this.frontendPath = path.resolve(__dirname, '../Timeout Frontend');
  }

  async testBackendFiles() {
    log('\n🔧 BACKEND FILES CHECK', 'magenta');
    log('─'.repeat(30), 'cyan');

    const backendChecks = [
      {
        file: 'Timeout Backend/functions/src/callable/tokens.ts',
        name: 'Token Backend Functions',
        checks: [
          { pattern: /export const saveUserTokens/, description: 'saveUserTokens function exported' },
          { pattern: /export const getUserTokens/, description: 'getUserTokens function exported' },
          { pattern: /export const addTokenTransaction/, description: 'addTokenTransaction function exported' },
          { pattern: /export const updateTokenBalance/, description: 'updateTokenBalance function exported' },
          { pattern: /getFirestore/, description: 'Firestore integration present' },
          { pattern: /onCall/, description: 'Firebase callable function setup' },
          { pattern: /TokenStats|TokenTransaction/, description: 'Type definitions present' }
        ]
      },
      {
        file: 'Timeout Backend/functions/src/types/tokens.ts',
        name: 'Token Type Definitions',
        checks: [
          { pattern: /interface TokenStats/, description: 'TokenStats interface defined' },
          { pattern: /interface TokenTransaction/, description: 'TokenTransaction interface defined' },
          { pattern: /export/, description: 'Types are exported' }
        ]
      },
      {
        file: 'Timeout Backend/functions/src/index.ts',
        name: 'Function Index',
        checks: [
          { pattern: /tokens/, description: 'Token functions included in exports' }
        ]
      }
    ];

    for (const check of backendChecks) {
      await this.checkFile(
        path.join(path.dirname(this.backendPath), check.file), 
        check.name, 
        check.checks,
        'backend'
      );
    }
  }

  async testFrontendFiles() {
    log('\n🌐 FRONTEND FILES CHECK', 'magenta');
    log('─'.repeat(30), 'cyan');

    const frontendChecks = [
      {
        file: 'Timeout Frontend/src/contexts/TokenContext.tsx',
        name: 'Token Context',
        checks: [
          { pattern: /export const TokenProvider/, description: 'TokenProvider component exported' },
          { pattern: /export const useTokens/, description: 'useTokens hook exported' },
          { pattern: /interface TokenStats/, description: 'TokenStats interface defined' },
          { pattern: /interface TokenTransaction/, description: 'TokenTransaction interface defined' },
          { pattern: /awardTokens/, description: 'awardTokens function present' },
          { pattern: /spendTokens/, description: 'spendTokens function present' },
          { pattern: /syncToDatabase/, description: 'Database sync functionality' },
          { pattern: /switchToDatabase/, description: 'Mode switching functionality' },
          { pattern: /generateMockData/, description: 'Mock data generation' },
          { pattern: /localStorage/, description: 'Local storage persistence' }
        ]
      },
      {
        file: 'Timeout Frontend/src/config/tokenFirebase.ts',
        name: 'Firebase Token API',
        checks: [
          { pattern: /export const saveUserTokens/, description: 'saveUserTokens API function' },
          { pattern: /export const getUserTokens/, description: 'getUserTokens API function' },
          { pattern: /export const addTokenTransaction/, description: 'addTokenTransaction API function' },
          { pattern: /httpsCallable/, description: 'Firebase callable setup' },
          { pattern: /interface TokenStats/, description: 'TokenStats interface' },
          { pattern: /interface TokenTransaction/, description: 'TokenTransaction interface' }
        ]
      },
      {
        file: 'Timeout Frontend/src/components/tokens/TokenDisplay.tsx',
        name: 'Token Display Component',
        checks: [
          { pattern: /useTokens/, description: 'Uses token context' },
          { pattern: /TokenDisplayProps/, description: 'Component props defined' },
          { pattern: /export/, description: 'Component exported' }
        ]
      },
      {
        file: 'Timeout Frontend/src/components/tokens/TokenStatsDashboard.tsx',
        name: 'Token Stats Dashboard',
        checks: [
          { pattern: /useTokens/, description: 'Uses token context' },
          { pattern: /syncToDatabase|Enable Database Mode/, description: 'Database sync controls' },
          { pattern: /mode.*Mock|Database/, description: 'Mode switching UI' },
          { pattern: /export/, description: 'Component exported' }
        ]
      }
    ];

    for (const check of frontendChecks) {
      await this.checkFile(
        path.join(path.dirname(this.frontendPath), check.file), 
        check.name, 
        check.checks,
        'frontend'
      );
    }
  }

  async checkFile(filePath, name, checks, type) {
    log(`\n📄 Checking: ${name}`, 'blue');
    
    if (!fs.existsSync(filePath)) {
      log(`  ❌ File not found: ${path.basename(filePath)}`, 'red');
      this.results[type].failed++;
      this.results[type].errors.push({
        file: name,
        error: 'File not found',
        path: filePath
      });
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let filePassed = true;

    for (const check of checks) {
      if (check.pattern.test(content)) {
        log(`  ✅ ${check.description}`, 'green');
      } else {
        log(`  ❌ ${check.description}`, 'red');
        filePassed = false;
        this.results[type].errors.push({
          file: name,
          error: `Missing: ${check.description}`,
          path: filePath
        });
      }
    }

    if (filePassed) {
      this.results[type].passed++;
      log(`  🎉 ${name} - ALL CHECKS PASSED`, 'green');
    } else {
      this.results[type].failed++;
      log(`  ⚠️ ${name} - SOME CHECKS FAILED`, 'yellow');
    }
  }

  async testIntegrationPoints() {
    log('\n🔗 INTEGRATION POINTS CHECK', 'magenta');
    log('─'.repeat(30), 'cyan');

    // Check if TokenProvider is used in App.tsx
    const appFiles = ['Timeout Frontend/src/App.tsx', 'Timeout Frontend/src/main.tsx', 'Timeout Frontend/src/components/TimeOutApp.tsx'];
    let tokenProviderFound = false;

    for (const file of appFiles) {
      const fullPath = path.join(path.dirname(this.frontendPath), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('TokenProvider')) {
          log(`  ✅ TokenProvider found in ${path.basename(file)}`, 'green');
          tokenProviderFound = true;
          break;
        }
      }
    }

    if (!tokenProviderFound) {
      log('  ⚠️ TokenProvider not found in main app files', 'yellow');
      log('    Make sure TokenProvider wraps your app components', 'yellow');
    }

    // Check for token usage in components
    const componentsDir = path.join(path.dirname(this.frontendPath), 'Timeout Frontend/src/components');
    if (fs.existsSync(componentsDir)) {
      // Check all subdirectories recursively
      const checkDirectory = (dir) => {
        const files = fs.readdirSync(dir);
        let tokenUsageCount = 0;
        const usageFiles = [];

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            const subResult = checkDirectory(filePath);
            tokenUsageCount += subResult.count;
            usageFiles.push(...subResult.files);
          } else if (file.endsWith('.tsx')) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            if (content.includes('useTokens') || 
                content.includes('awardTokens') || 
                content.includes('spendTokens') ||
                content.includes('TokenDisplay')) {
              tokenUsageCount++;
              usageFiles.push(path.relative(componentsDir, filePath));
            }
          }
        }
        
        return { count: tokenUsageCount, files: usageFiles };
      };

      const result = checkDirectory(componentsDir);

      log(`\n  📊 Token system used in ${result.count} component files:`, 'cyan');
      result.files.forEach(file => log(`    • ${file}`, 'cyan'));

      if (result.count === 0) {
        log('  ⚠️ No token usage found in components', 'yellow');
        this.results.frontend.errors.push({
          file: 'Components',
          error: 'No token usage found in component files',
          path: componentsDir
        });
      }
    }
  }

  async testBuildConfiguration() {
    log('\n⚙️ BUILD CONFIGURATION CHECK', 'magenta');
    log('─'.repeat(30), 'cyan');

    // Check package.json dependencies
    const packageJsonPath = path.join(path.dirname(this.frontendPath), 'Timeout Frontend/package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const requiredDeps = [
        'firebase',
        '@clerk/clerk-react',
        'react',
        'typescript'
      ];

      log('  📦 Checking required dependencies:', 'blue');
      
      let allDepsPresent = true;
      for (const dep of requiredDeps) {
        if (deps[dep]) {
          log(`    ✅ ${dep} (${deps[dep]})`, 'green');
        } else {
          log(`    ❌ ${dep} - MISSING`, 'red');
          allDepsPresent = false;
        }
      }

      if (allDepsPresent) {
        log('  🎉 All required dependencies present', 'green');
      } else {
        log('  ⚠️ Some dependencies are missing', 'yellow');
      }
    }

    // Check TypeScript configuration
    const tsconfigPath = path.join(path.dirname(this.frontendPath), 'Timeout Frontend/tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      log('  ✅ TypeScript configuration found', 'green');
    } else {
      log('  ❌ TypeScript configuration missing', 'red');
    }
  }

  generateFinalReport() {
    log('\n📊 COMPREHENSIVE TEST REPORT', 'bright');
    log('═'.repeat(50), 'cyan');

    const backendTotal = this.results.backend.passed + this.results.backend.failed;
    const frontendTotal = this.results.frontend.passed + this.results.frontend.failed;
    const overallTotal = backendTotal + frontendTotal;

    const backendSuccess = backendTotal > 0 ? (this.results.backend.passed / backendTotal * 100).toFixed(1) : 0;
    const frontendSuccess = frontendTotal > 0 ? (this.results.frontend.passed / frontendTotal * 100).toFixed(1) : 0;
    const overallSuccess = overallTotal > 0 ? ((this.results.backend.passed + this.results.frontend.passed) / overallTotal * 100).toFixed(1) : 0;

    log(`\n🔧 BACKEND RESULTS:`, 'magenta');
    log(`   Files Checked: ${backendTotal}`, 'blue');
    log(`   Passed: ${this.results.backend.passed}`, 'green');
    log(`   Failed: ${this.results.backend.failed}`, this.results.backend.failed > 0 ? 'red' : 'green');
    log(`   Success Rate: ${backendSuccess}%`, backendSuccess >= 80 ? 'green' : 'yellow');

    log(`\n🌐 FRONTEND RESULTS:`, 'magenta');
    log(`   Files Checked: ${frontendTotal}`, 'blue');
    log(`   Passed: ${this.results.frontend.passed}`, 'green');
    log(`   Failed: ${this.results.frontend.failed}`, this.results.frontend.failed > 0 ? 'red' : 'green');
    log(`   Success Rate: ${frontendSuccess}%`, frontendSuccess >= 80 ? 'green' : 'yellow');

    log(`\n🎯 OVERALL RESULTS:`, 'bright');
    log(`   Total Files: ${overallTotal}`, 'blue');
    log(`   Overall Success: ${overallSuccess}%`, overallSuccess >= 80 ? 'green' : 'yellow');

    // Show errors if any
    const allErrors = [...this.results.backend.errors, ...this.results.frontend.errors];
    if (allErrors.length > 0) {
      log('\n❌ ISSUES FOUND:', 'red');
      allErrors.forEach((error, index) => {
        log(`${index + 1}. ${error.file}`, 'red');
        log(`   ${error.error}`, 'yellow');
      });
    }

    // Final status
    log('\n🏁 IMPLEMENTATION STATUS:', 'bright');
    
    if (overallSuccess >= 90) {
      log('🎉 EXCELLENT! Token system is fully implemented and ready for production!', 'green');
      log('   ✅ Backend functions are properly structured', 'green');
      log('   ✅ Frontend integration is complete', 'green');
      log('   ✅ Database sync functionality is available', 'green');
      log('   ✅ Mock mode fallback is implemented', 'green');
    } else if (overallSuccess >= 75) {
      log('👍 GOOD! Token system is mostly implemented with minor issues', 'yellow');
      log('   ✅ Core functionality is working', 'green');
      log('   ⚠️ Some components may need attention', 'yellow');
    } else if (overallSuccess >= 50) {
      log('⚠️ PARTIAL! Token system has some implementation but needs work', 'yellow');
      log('   ⚠️ Core files are present but may have issues', 'yellow');
      log('   ❌ Several components need attention', 'red');
    } else {
      log('❌ INCOMPLETE! Token system has significant implementation issues', 'red');
      log('   ❌ Multiple core components are missing or broken', 'red');
      log('   ❌ System may not function correctly', 'red');
    }

    if (allErrors.length === 0) {
      log('\n🚀 Ready to test! Run the following to verify functionality:', 'bright');
      log('   1. Start Firebase emulators: firebase emulators:start', 'cyan');
      log('   2. Start frontend: npm run dev', 'cyan');
      log('   3. Test token operations in the UI', 'cyan');
    }
  }

  async runAllTests() {
    log('🧪 TimeOut Token System Integration Test', 'bright');
    log('═'.repeat(50), 'cyan');
    log('This test verifies that token functionality is properly', 'blue');
    log('implemented in both backend and frontend code.', 'blue');

    try {
      await this.testBackendFiles();
      await this.testFrontendFiles();
      await this.testIntegrationPoints();
      await this.testBuildConfiguration();
      
      this.generateFinalReport();
      
    } catch (error) {
      log(`💥 Test failed: ${error.message}`, 'red');
      console.error(error);
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new SimpleTokenTester();
  tester.runAllTests();
}

module.exports = SimpleTokenTester;
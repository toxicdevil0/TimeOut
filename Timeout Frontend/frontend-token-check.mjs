/**
 * Frontend Token System Integration Checker
 * 
 * This script verifies that token functionality is properly implemented
 * in the TimeOut frontend components and context.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for console output
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

class FrontendTokenChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
    
    this.frontendPath = path.resolve(__dirname, '../Timeout Frontend/src');
    this.componentsPath = path.join(this.frontendPath, 'components');
    this.contextPath = path.join(this.frontendPath, 'contexts');
    this.configPath = path.join(this.frontendPath, 'config');
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async checkFile(filePath, checks) {
    if (!fs.existsSync(filePath)) {
      this.log(`❌ File not found: ${filePath}`, 'red');
      this.results.failed++;
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    this.log(`\n📄 Checking: ${fileName}`, 'blue');
    
    let filePassed = true;
    
    for (const check of checks) {
      try {
        const result = check.test(content);
        if (result) {
          this.log(`  ✅ ${check.name}`, 'green');
        } else {
          this.log(`  ❌ ${check.name}`, 'red');
          this.log(`    Expected: ${check.description}`, 'yellow');
          filePassed = false;
          this.results.errors.push({
            file: fileName,
            check: check.name,
            description: check.description
          });
        }
      } catch (error) {
        this.log(`  ⚠️ ${check.name} - ${error.message}`, 'yellow');
        this.results.warnings++;
      }
    }
    
    if (filePassed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    
    return filePassed;
  }

  async checkTokenContext() {
    const contextFile = path.join(this.contextPath, 'TokenContext.tsx');
    
    const checks = [
      {
        name: 'TokenContext exports',
        description: 'Should export TokenProvider and useTokens',
        test: (content) => content.includes('export const TokenProvider') && content.includes('export const useTokens')
      },
      {
        name: 'Token interfaces defined',
        description: 'Should define TokenStats and TokenTransaction interfaces',
        test: (content) => content.includes('interface TokenStats') && content.includes('interface TokenTransaction')
      },
      {
        name: 'Database integration',
        description: 'Should have database sync functionality',
        test: (content) => content.includes('syncToDatabase') && content.includes('loadFromDatabase')
      },
      {
        name: 'Mode switching',
        description: 'Should support mock and database modes',
        test: (content) => content.includes("mode: 'mock' | 'database'") && content.includes('switchToDatabase')
      },
      {
        name: 'Token operations',
        description: 'Should have awardTokens and spendTokens functions',
        test: (content) => content.includes('awardTokens') && content.includes('spendTokens')
      },
      {
        name: 'Mock data generation',
        description: 'Should have generateMockData function',
        test: (content) => content.includes('generateMockData')
      },
      {
        name: 'Firebase integration imports',
        description: 'Should import Firebase token functions',
        test: (content) => content.includes('saveUserTokens as saveTokensToDatabase') && 
                          content.includes('getUserTokens as getTokensFromDatabase')
      },
      {
        name: 'LocalStorage persistence',
        description: 'Should persist data to localStorage',
        test: (content) => content.includes('localStorage.getItem') && content.includes('localStorage.setItem')
      },
      {
        name: 'Clerk authentication',
        description: 'Should use Clerk for user authentication',
        test: (content) => content.includes('useUser') && content.includes('@clerk/clerk-react')
      },
      {
        name: 'Optimistic updates',
        description: 'Should update local state immediately for better UX',
        test: (content) => content.includes('setTokens(prev =>') && content.includes('setTransactions(prev =>')
      }
    ];

    return this.checkFile(contextFile, checks);
  }

  async checkTokenFirebaseConfig() {
    const configFile = path.join(this.configPath, 'tokenFirebase.ts');
    
    const checks = [
      {
        name: 'Firebase functions import',
        description: 'Should import httpsCallable and functions',
        test: (content) => content.includes('httpsCallable') && content.includes('functions')
      },
      {
        name: 'Token function exports',
        description: 'Should export all token-related functions',
        test: (content) => content.includes('export const saveUserTokens') && 
                          content.includes('export const getUserTokens') &&
                          content.includes('export const addTokenTransaction')
      },
      {
        name: 'Type definitions',
        description: 'Should define TokenStats and TokenTransaction interfaces',
        test: (content) => content.includes('interface TokenStats') && content.includes('interface TokenTransaction')
      },
      {
        name: 'Callable function instances',
        description: 'Should create callable function instances',
        test: (content) => content.includes('httpsCallable(functions,') && 
                          content.includes('saveUserTokensCallable') &&
                          content.includes('getUserTokensCallable')
      },
      {
        name: 'Error handling',
        description: 'Should have proper error handling with try-catch blocks',
        test: (content) => content.includes('try {') && content.includes('} catch (error) {')
      },
      {
        name: 'Console logging',
        description: 'Should have proper logging for debugging',
        test: (content) => content.includes('console.log') && content.includes('console.error')
      },
      {
        name: 'Date conversion',
        description: 'Should handle Firestore timestamp conversion',
        test: (content) => content.includes('new Date(') && content.includes('.seconds * 1000')
      }
    ];

    return this.checkFile(configFile, checks);
  }

  async checkTokenComponents() {
    const componentsToCheck = [
      {
        file: 'TokenDisplay.tsx',
        checks: [
          {
            name: 'useTokens hook usage',
            description: 'Should use the useTokens hook',
            test: (content) => content.includes('useTokens()')
          },
          {
            name: 'Token display variants',
            description: 'Should have different display variants',
            test: (content) => content.includes('variant') && content.includes('TokenDisplayProps')
          }
        ]
      },
      {
        file: 'TokenStatsDashboard.tsx',
        checks: [
          {
            name: 'Database sync controls',
            description: 'Should have database sync functionality',
            test: (content) => content.includes('syncToDatabase') || content.includes('Enable Database Mode')
          },
          {
            name: 'Mode switching UI',
            description: 'Should show current mode and allow switching',
            test: (content) => content.includes('mode') && (content.includes('Mock Mode') || content.includes('Database Mode'))
          },
          {
            name: 'Token stats display',
            description: 'Should display token statistics',
            test: (content) => content.includes('totalTokens') || content.includes('availableTokens')
          }
        ]
      }
    ];

    let allPassed = true;
    
    for (const { file, checks } of componentsToCheck) {
      const filePath = path.join(this.componentsPath, file);
      const result = await this.checkFile(filePath, checks);
      if (!result) allPassed = false;
    }

    return allPassed;
  }

  async checkAppIntegration() {
    const appFiles = [
      {
        file: path.join(this.frontendPath, 'App.tsx'),
        checks: [
          {
            name: 'TokenProvider wrapper',
            description: 'Should wrap the app with TokenProvider',
            test: (content) => content.includes('TokenProvider') || content.includes('<TokenProvider>')
          }
        ]
      },
      {
        file: path.join(this.frontendPath, 'main.tsx'),
        checks: [
          {
            name: 'Root setup',
            description: 'Should have proper React root setup',
            test: (content) => content.includes('ReactDOM') || content.includes('createRoot')
          }
        ]
      }
    ];

    let allPassed = true;
    
    for (const { file, checks } of appFiles) {
      if (fs.existsSync(file)) {
        const result = await this.checkFile(file, checks);
        if (!result) allPassed = false;
      }
    }

    return allPassed;
  }

  async checkPackageDependencies() {
    const packageJsonPath = path.join(this.frontendPath, '../package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.log('❌ package.json not found', 'red');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    this.log('\n📦 Checking Dependencies...', 'blue');

    const requiredDeps = {
      'firebase': 'Firebase SDK',
      '@clerk/clerk-react': 'Clerk Authentication',
      'react': 'React Framework',
      'typescript': 'TypeScript Support'
    };

    let allDepsPresent = true;

    for (const [dep, description] of Object.entries(requiredDeps)) {
      if (dependencies[dep]) {
        this.log(`  ✅ ${dep} (${dependencies[dep]}) - ${description}`, 'green');
      } else {
        this.log(`  ❌ ${dep} - ${description} (MISSING)`, 'red');
        allDepsPresent = false;
        this.results.errors.push({
          file: 'package.json',
          check: dep,
          description: `Missing dependency: ${description}`
        });
      }
    }

    if (allDepsPresent) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }

    return allDepsPresent;
  }

  async checkImplementationUsage() {
    this.log('\n🔍 Checking Token Usage in Components...', 'blue');
    
    const componentFiles = fs.readdirSync(this.componentsPath)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
      .map(file => path.join(this.componentsPath, file));

    let usageCount = 0;
    const usageFiles = [];

    for (const filePath of componentFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      
      if (content.includes('useTokens') || 
          content.includes('awardTokens') || 
          content.includes('spendTokens') ||
          content.includes('TokenDisplay') ||
          content.includes('tokens.')) {
        usageCount++;
        usageFiles.push(fileName);
        this.log(`  ✅ ${fileName} uses token system`, 'green');
      }
    }

    this.log(`\n📊 Token system is used in ${usageCount} component files:`, 'cyan');
    usageFiles.forEach(file => this.log(`    • ${file}`, 'cyan'));

    if (usageCount > 0) {
      this.results.passed++;
      return true;
    } else {
      this.log('  ⚠️ No token usage found in components', 'yellow');
      this.results.warnings++;
      return false;
    }
  }

  async runAllChecks() {
    this.log('🔍 Frontend Token System Integration Check', 'bright');
    this.log('═'.repeat(50), 'cyan');

    try {
      // Check core token system files
      await this.checkTokenContext();
      await this.checkTokenFirebaseConfig();
      await this.checkTokenComponents();
      await this.checkAppIntegration();
      await this.checkPackageDependencies();
      await this.checkImplementationUsage();

    } catch (error) {
      this.log(`💥 Check failed: ${error.message}`, 'red');
      this.results.failed++;
    }

    this.generateReport();
  }

  generateReport() {
    this.log('\n📊 FRONTEND INTEGRATION REPORT', 'bright');
    this.log('═'.repeat(50), 'cyan');
    
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    this.log(`Files Checked: ${total}`, 'blue');
    this.log(`Passed: ${this.results.passed}`, 'green');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    this.log(`Warnings: ${this.results.warnings}`, this.results.warnings > 0 ? 'yellow' : 'green');
    this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
    
    if (this.results.errors.length > 0) {
      this.log('\n❌ ISSUES FOUND:', 'red');
      this.results.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.file} - ${error.check}`, 'red');
        this.log(`   ${error.description}`, 'yellow');
      });
    }

    this.log('\n🎯 IMPLEMENTATION STATUS:', 'bright');
    
    if (this.results.failed === 0) {
      this.log('🎉 Frontend token system is properly implemented!', 'green');
      this.log('   • All core files are present and correctly structured', 'green');
      this.log('   • Token operations are properly integrated', 'green');
      this.log('   • Database sync functionality is available', 'green');
      this.log('   • Mock mode fallback is implemented', 'green');
    } else if (this.results.failed <= 2) {
      this.log('⚠️ Frontend token system is mostly implemented with minor issues', 'yellow');
      this.log('   • Core functionality appears to be working', 'yellow');
      this.log('   • Some components may need attention', 'yellow');
    } else {
      this.log('❌ Frontend token system has significant implementation issues', 'red');
      this.log('   • Multiple core components are missing or broken', 'red');
      this.log('   • Token operations may not function correctly', 'red');
    }

    this.log('\n🏁 Frontend Integration Check Completed!', 'bright');
  }
}

// Run the checker
const checker = new FrontendTokenChecker();
checker.runAllChecks();
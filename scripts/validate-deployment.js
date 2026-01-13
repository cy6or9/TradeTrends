#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Checks for common JavaScript errors that could break production
 * Run before deploying to catch issues early
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

// Files to check
const filesToCheck = [
  'public/admin/dashboard.html',
  'public/admin/trends.html',
  'public/admin/deals.html',
  'public/admin/activities.html',
  'public/index.html',
  'public/products.html',
  'public/activities.html'
];

console.log('🔍 Running pre-deployment validation...\n');

function checkFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    warnings.push(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const fileName = path.basename(filePath);
  
  console.log(`Checking ${fileName}...`);
  
  // Check 1: Array methods without safety checks
  const unsafeMapRegex = /(\w+)\.map\(/g;
  let match;
  while ((match = unsafeMapRegex.exec(content)) !== null) {
    const varName = match[1];
    const context = content.substring(Math.max(0, match.index - 100), match.index + 100);
    
    // Check if there's an Array.isArray check before this .map()
    const hasArrayCheck = context.includes(`Array.isArray(${varName})`);
    const hasLengthCheck = context.includes(`${varName}.length`);
    const hasTernary = context.includes(`${varName} ?`) || context.includes(`? ${varName}`);
    
    if (!hasArrayCheck && !hasLengthCheck && !hasTernary) {
      // Check if it's in a known safe context (topDeals, byDay with safeguards)
      const hasSafeguard = context.includes(`${varName} && ${varName}.length`) ||
                          context.includes(`(Array.isArray(${varName})`);
      
      if (!hasSafeguard && varName !== 'items' && varName !== 'categories') {
        warnings.push(
          `⚠️  ${fileName}: Potentially unsafe .map() on '${varName}' without Array.isArray() check at position ${match.index}`
        );
      }
    }
  }
  
  // Check 2: Division by zero risks
  const divisionRegex = /\/\s*(\w+)/g;
  while ((match = divisionRegex.exec(content)) !== null) {
    const divisor = match[1];
    const context = content.substring(Math.max(0, match.index - 50), match.index + 50);
    
    // Common divisors that need zero checks
    if (['totalClicks', 'clicks', 'count', 'total'].includes(divisor)) {
      const hasZeroCheck = context.includes(`${divisor} > 0`) || 
                          context.includes(`${divisor} === 0`) ||
                          context.includes(`${divisor} ? `);
      
      if (!hasZeroCheck) {
        warnings.push(
          `⚠️  ${fileName}: Potential division by zero with '${divisor}' at position ${match.index}`
        );
      }
    }
  }
  
  // Check 3: Missing null/undefined checks for data access
  const dataAccessRegex = /data\.(\w+)/g;
  const dataAccesses = new Set();
  while ((match = dataAccessRegex.exec(content)) !== null) {
    dataAccesses.add(match[1]);
  }
  
  // Check if data object validation exists
  const hasDataValidation = content.includes('if (!data') || 
                           content.includes('typeof data') ||
                           content.includes('data || {}');
  
  if (dataAccesses.size > 0 && !hasDataValidation) {
    warnings.push(
      `⚠️  ${fileName}: Accessing 'data.${Array.from(dataAccesses)[0]}' without data validation`
    );
  }
  
  // Check 4: Unsafe HTML insertion
  const innerHTMLRegex = /innerHTML\s*=\s*`[^`]*\$\{(?!escapeHtml\()/g;
  while ((match = innerHTMLRegex.exec(content)) !== null) {
    const context = content.substring(match.index, Math.min(content.length, match.index + 200));
    
    // Check if it contains user data variables
    if (context.includes('${deal.') || context.includes('${item.') || context.includes('${day.')) {
      warnings.push(
        `⚠️  ${fileName}: Potential XSS risk - innerHTML with unescaped user data at position ${match.index}`
      );
    }
  }
  
  // Check 5: Missing error handlers in fetch calls
  const fetchRegex = /fetch\([^)]+\)/g;
  let fetchMatches = [];
  while ((match = fetchRegex.exec(content)) !== null) {
    fetchMatches.push(match.index);
  }
  
  for (const fetchIndex of fetchMatches) {
    const afterFetch = content.substring(fetchIndex, Math.min(content.length, fetchIndex + 500));
    const hasCatch = afterFetch.includes('.catch(') || afterFetch.includes('try {');
    
    if (!hasCatch) {
      warnings.push(
        `⚠️  ${fileName}: fetch() without .catch() or try/catch at position ${fetchIndex}`
      );
    }
  }
  
  // Check 6: Console.log statements (should be removed in production)
  const consoleLogMatches = content.match(/console\.log\(/g);
  if (consoleLogMatches && consoleLogMatches.length > 5) {
    warnings.push(
      `ℹ️  ${fileName}: Contains ${consoleLogMatches.length} console.log statements (consider removing for production)`
    );
  }
  
  console.log(`  ✓ ${fileName} checked\n`);
}

// Run checks
filesToCheck.forEach(checkFile);

// Report results
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION RESULTS');
console.log('='.repeat(60) + '\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! No issues found.\n');
  process.exit(0);
}

if (errors.length > 0) {
  console.log(`❌ ERRORS (${errors.length}):\n`);
  errors.forEach(err => console.log(err));
  console.log();
}

if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
  warnings.forEach(warn => console.log(warn));
  console.log();
}

console.log('='.repeat(60));

if (errors.length > 0) {
  console.log('\n❌ Deployment validation FAILED - fix errors before deploying\n');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Deployment validation passed with warnings\n');
  process.exit(0);
} else {
  console.log('\n✅ Deployment validation PASSED\n');
  process.exit(0);
}

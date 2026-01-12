#!/usr/bin/env node
/**
 * Admin Scripts Sanity Checker
 * Parses inline <script> blocks in admin HTML pages to catch syntax errors
 * before deployment. Prevents "Unexpected token <" and similar runtime failures.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let errors = 0;

function log(type, message) {
  const icons = { error: '❌', success: '✅', info: 'ℹ️' };
  console.log(`${icons[type] || icons.info} ${message}`);
}

function extractInlineScripts(html) {
  const scripts = [];
  const scriptRegex = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push({
      fullMatch: match[0],
      content: match[1],
      startIndex: match.index
    });
  }
  
  return scripts;
}

function parseScript(scriptContent, fileName, scriptIndex) {
  try {
    // Use Node's vm module to compile the script
    new vm.Script(scriptContent, {
      filename: `${fileName}#script${scriptIndex}`,
      lineOffset: 0,
      columnOffset: 0
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      line: err.lineNumber,
      column: err.columnNumber
    };
  }
}

function checkAdminPage(filePath) {
  const fileName = path.basename(filePath);
  
  if (!fs.existsSync(filePath)) {
    log('error', `File not found: ${filePath}`);
    errors++;
    return;
  }
  
  const html = fs.readFileSync(filePath, 'utf8');
  const scripts = extractInlineScripts(html);
  
  if (scripts.length === 0) {
    log('info', `${fileName}: No inline scripts found`);
    return;
  }
  
  log('info', `${fileName}: Checking ${scripts.length} inline script(s)...`);
  
  scripts.forEach((script, index) => {
    const result = parseScript(script.content, fileName, index + 1);
    
    if (!result.ok) {
      errors++;
      const preview = script.content.trim().substring(0, 80).replace(/\n/g, ' ');
      log('error', `${fileName} [script #${index + 1}] Syntax error:`);
      console.log(`   ${result.error}`);
      if (result.line) {
        console.log(`   Line: ${result.line}, Column: ${result.column}`);
      }
      console.log(`   Preview: ${preview}...`);
    } else {
      log('success', `${fileName} [script #${index + 1}] Valid`);
    }
  });
}

// Main execution
console.log('\n🔍 Admin Scripts Sanity Check\n');

const adminDir = path.join(__dirname, '..', 'public', 'admin');
const adminPages = [
  'dashboard.html',
  'trends.html',
  'deals.html'
];

adminPages.forEach(page => {
  checkAdminPage(path.join(adminDir, page));
});

console.log('\n📊 Summary');
console.log('═══════════════════════════');
console.log(`Errors: ${errors}`);
console.log('═══════════════════════════\n');

if (errors > 0) {
  log('error', `Admin script validation FAILED with ${errors} error(s)`);
  process.exit(1);
} else {
  log('success', 'All admin scripts are syntactically valid');
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════
// ADMIN DIAGNOSTICS
// Run this in browser console on /admin page
// ═══════════════════════════════════════════════════════════

console.log('🔍 Running Admin Diagnostics...\n');

// Check #nc-root
const ncRoot = document.getElementById('nc-root');
console.log('1. CMS Mount Point (#nc-root)');
if (ncRoot) {
  const rect = ncRoot.getBoundingClientRect();
  console.log('   ✓ Element exists');
  console.log('   ✓ Dimensions:', `${rect.width}x${rect.height}`);
  console.log('   ✓ Visible:', rect.height > 0);
  console.log('   ✓ Children:', ncRoot.children.length);
} else {
  console.log('   ❌ Element not found!');
}

console.log('\n2. CMS Scripts');
const cmsScripts = Array.from(document.querySelectorAll('script[src*="decap-cms"]'));
console.log('   Script count:', cmsScripts.length);
if (cmsScripts.length === 1) {
  console.log('   ✓ Single CMS load (correct)');
  console.log('   ✓ Source:', cmsScripts[0].src);
} else if (cmsScripts.length === 0) {
  console.log('   ❌ No CMS script found!');
} else {
  console.log('   ❌ Multiple CMS scripts found (will cause crash):');
  cmsScripts.forEach((s, i) => console.log(`      ${i + 1}. ${s.src}`));
}

console.log('\n3. CMS API');
if (window.CMS) {
  console.log('   ✓ window.CMS available');
  console.log('   ✓ Version:', window.CMS.getVersion ? window.CMS.getVersion() : 'unknown');
} else {
  console.log('   ⚠️ window.CMS not yet loaded (may still be loading)');
}

console.log('\n4. Netlify Identity');
if (window.netlifyIdentity) {
  console.log('   ✓ Identity widget loaded');
  const user = window.netlifyIdentity.currentUser();
  if (user) {
    console.log('   ✓ User logged in:', user.email);
    console.log('   ✓ Roles:', user.app_metadata?.roles || []);
  } else {
    console.log('   ⚠️ No user logged in');
  }
} else {
  console.log('   ❌ Identity widget not loaded');
}

console.log('\n5. Custom Scripts');
const customScripts = Array.from(document.querySelectorAll('script[src*="/admin/"]'));
console.log('   Custom admin scripts:', customScripts.length);
customScripts.forEach(s => console.log('   -', s.src));

console.log('\n6. Config');
fetch('/admin/config.yml')
  .then(res => {
    console.log('   ✓ Config status:', res.status);
    console.log('   ✓ Content-Type:', res.headers.get('content-type'));
    return res.text();
  })
  .then(text => {
    if (text.startsWith('backend:')) {
      console.log('   ✓ Config is valid YAML');
    } else if (text.startsWith('<!DOCTYPE')) {
      console.log('   ❌ Config returns HTML (redirect issue)');
    } else {
      console.log('   ⚠️ Config format unexpected');
    }
  })
  .catch(err => console.log('   ❌ Config load failed:', err));

console.log('\n7. Environment');
console.log('   Location:', window.location.href);
console.log('   Local dev:', window.location.hostname === 'localhost');
console.log('   Port:', window.location.port || '(default)');

console.log('\n✓ Diagnostics complete');
console.log('If CMS is not rendering, check for:');
console.log('  - Multiple CMS script tags (should be exactly 1)');
console.log('  - React errors in console');
console.log('  - #nc-root hidden by CSS');
console.log('  - Config.yml returning HTML instead of YAML');

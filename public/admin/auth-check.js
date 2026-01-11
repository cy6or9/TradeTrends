// Admin authentication check
// This script must be included in all admin pages
// It redirects non-admin users to the homepage

(function() {
  'use strict';

  function isDevMode() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || 
           hostname.includes('127.0.0.1') ||
           hostname.includes('app.github.dev') ||
           hostname.includes('gitpod.io') ||
           hostname.includes('codespaces');
  }

  function checkAuth() {
    // Allow access in dev mode without authentication
    if (isDevMode()) {
      console.log('Dev mode detected - admin access granted');
      return;
    }

    if (!window.netlifyIdentity) {
      console.error('Netlify Identity not loaded');
      redirectToHome();
      return;
    }

    const user = netlifyIdentity.currentUser();
    
    if (!user) {
      console.log('No user logged in, redirecting...');
      redirectToHome();
      return;
    }

    // Check if user has admin role
    const roles = user.app_metadata?.roles || [];
    const isAdmin = roles.includes('admin');

    if (!isAdmin) {
      console.log('User is not an admin, redirecting...');
      alert('Access denied. Admin privileges required.');
      redirectToHome();
      return;
    }

    console.log('Admin access granted');
  }

  function redirectToHome() {
    window.location.href = '/';
  }

  // Run check when Identity is initialized
  if (window.netlifyIdentity) {
    netlifyIdentity.on('init', checkAuth);
    netlifyIdentity.on('logout', redirectToHome);
  }

  // Also check immediately after a short delay (in case Identity is already initialized)
  setTimeout(checkAuth, 500);
})();

# Admin CMS - React Error Fix

## Problem
Red error banner in Decap CMS:
```
NotFoundError: Failed to execute 'removeChild' on 'Node'
```

**Root cause**: Autofill system was modifying entry data during React render lifecycle, causing React reconciliation conflicts.

## Solution

### ✅ Removed ALL reactive autofill
- ❌ Deleted: `registerEventListener("entryChanged")`
- ❌ Deleted: `registerEventListener("fieldChange")`
- ❌ Deleted: `onChange` handlers
- ❌ Deleted: Form hooks during editing
- ❌ Deleted: UI modification during render

### ✅ PreSave ONLY approach
- ✓ Autofill runs **only when user clicks Save**
- ✓ No data changes during typing/editing
- ✓ React reconciliation unaffected
- ✓ No `removeChild` errors

### ✅ Zero DOM manipulation
- ✓ No `querySelector` on CMS elements
- ✓ No `addEventListener` on form fields
- ✓ No `MutationObserver` watching CMS
- ✓ Data-only operations (Immutable.js)

### ✅ Preserved functionality
- ✓ URL-first workflow
- ✓ Autofill (ID, network, category, brand)
- ✓ Admin role detection
- ✓ Google OAuth
- ✓ Media uploads
- ✓ Publishing to Git

## Implementation

### cms.js (328 lines)
```javascript
// BEFORE (unsafe - reactive updates)
CMS.registerEventListener({
  name: 'entryChanged',  // ❌ Runs during editing
  handler: ({ entry }) => {
    // Modifies data during React render → crash
  }
});

// AFTER (safe - preSave only)
CMS.registerEventListener({
  name: 'preSave',  // ✓ Runs only on save
  handler: async ({ entry }) => {
    const data = entry.get('data').toJS();
    const updated = await autofillFields(data);
    return entry.set('data', entry.get('data').merge(updated));
  }
});
```

### Key changes:
1. **Single hook**: Only `preSave` event
2. **Immutable operations**: `.toJS()` → process → `.merge()`
3. **Error handling**: Returns original entry on error
4. **No side effects**: Pure data transformation

## Verification

```bash
# Check for unsafe patterns
grep -c "entryChanged\|fieldChange\|onChange" cms.js
# Output: 0 ✓

# Check for DOM manipulation of CMS
grep "querySelector.*CMS\|querySelector.*entry\|querySelector.*form" cms.js
# Output: (none) ✓

# Verify preSave usage
grep -c "preSave" cms.js
# Output: 6 ✓
```

## Result
- ✅ No red error banner
- ✅ No React removeChild errors
- ✅ CMS renders and functions normally
- ✅ Autofill works on save
- ✅ User experience preserved

## Files Modified
- `/public/admin/cms.js` - Rewritten (preSave only)
- `/public/admin/cms_old.js` - Backup of reactive version

## Testing
1. Visit `/admin`
2. Log in with admin account
3. Create new entry
4. Paste affiliate URL
5. Click Save
6. Verify autofill worked
7. Check console - no React errors

**Status**: ✅ All tests pass, no error banner

# Language Setting Toggle - Integration Verification

This document provides manual verification steps for Task 7.1: Wire all components together.

## Test Environment Setup

1. Open Figma Desktop or Figma in browser
2. Load the Prototype Index plugin
3. Ensure you have at least one prototype starting point in your document

## Verification Tests

### Test 1: Message Passing Between UI and code.ts

**Objective:** Verify that the UI can communicate with code.ts to save and load language settings.

**Steps:**
1. Open the plugin
2. Navigate to the "Generar Frame" tab
3. Click the "Idioma / Language" toggle
4. Open browser console (if using Figma in browser) or check plugin logs

**Expected Results:**
- ✅ No console errors appear
- ✅ Toggle button changes state (moves to the right for English)
- ✅ Language setting is saved to clientStorage
- ✅ SAVE_SETTING message is sent from UI to code.ts

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 2: Language Setting Persistence

**Objective:** Verify that language preference persists across plugin sessions.

**Steps:**
1. Open the plugin
2. Navigate to "Generar Frame" tab
3. Toggle language to English (toggle should be ON/right)
4. Close the plugin
5. Reopen the plugin
6. Navigate to "Generar Frame" tab

**Expected Results:**
- ✅ Language toggle is still set to English (ON/right position)
- ✅ All UI text is displayed in English
- ✅ No flash of Spanish text before English appears

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 3: All UI Text Updates Immediately

**Objective:** Verify that all UI text updates when language changes.

**Steps:**
1. Open the plugin (should default to Spanish)
2. Note the text in various UI elements:
   - Tab labels: "Índice" and "Generar Frame"
   - Toolbar button: "Regenerar"
   - Status bar: "Listo"
3. Navigate to "Generar Frame" tab
4. Click the "Idioma / Language" toggle to switch to English
5. Observe all UI elements

**Expected Results:**
- ✅ Tab labels change to "Index" and "Generate Frame"
- ✅ Toolbar button changes to "Regenerate"
- ✅ Status bar changes to "Ready"
- ✅ All text in "Generar Frame" panel updates to English
- ✅ Changes happen immediately (< 100ms, no visible delay)
- ✅ No text remains in Spanish

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 4: Default Spanish Language for New Users

**Objective:** Verify that new users see Spanish by default.

**Steps:**
1. Clear plugin storage:
   - In browser console: `figma.clientStorage.setAsync('language', undefined)`
   - Or reinstall the plugin
2. Open the plugin
3. Observe the UI language

**Expected Results:**
- ✅ All UI text is displayed in Spanish
- ✅ Language toggle is OFF (left position)
- ✅ Header shows "Índice" and "Generar Frame"

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 5: Toggle Button State Reflects Current Language

**Objective:** Verify that the toggle button visual state matches the selected language.

**Steps:**
1. Open the plugin with Spanish (default)
2. Navigate to "Generar Frame" tab
3. Observe the "Idioma / Language" toggle
4. Click the toggle to switch to English
5. Observe the toggle state
6. Click again to switch back to Spanish

**Expected Results:**
- ✅ Spanish: Toggle is OFF (left position, gray)
- ✅ English: Toggle is ON (right position, purple accent)
- ✅ Toggle state changes immediately when clicked
- ✅ Toggle state persists after closing and reopening plugin

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 6: Dynamic Content Updates

**Objective:** Verify that dynamic content (counts, timestamps) updates with language.

**Steps:**
1. Open the plugin with at least 2 prototype starting points
2. Note the header count (e.g., "2 starting points")
3. Navigate to "Generar Frame" tab
4. Toggle language to Spanish
5. Return to "Índice" tab
6. Observe the header count

**Expected Results:**
- ✅ English: Shows "X starting points" (plural) or "1 starting point" (singular)
- ✅ Spanish: Shows "X starting points" (same in both languages per design)
- ✅ Count updates immediately when language changes
- ✅ Timestamps format correctly for each locale

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 7: Generate Frame with Language Setting

**Objective:** Verify that the language setting is used when generating frames.

**Steps:**
1. Open the plugin
2. Navigate to "Generar Frame" tab
3. Set language to English
4. Click "Generate Frame in Figma"
5. Observe the generated frame
6. Delete the frame
7. Set language to Spanish
8. Click "Generar Frame en Figma"
9. Observe the generated frame

**Expected Results:**
- ✅ Button text changes based on language
- ✅ Success message appears in the selected language
- ✅ Generated frame uses appropriate locale for dates/times
- ✅ No errors occur during generation

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 8: Error Handling

**Objective:** Verify that errors are handled gracefully.

**Steps:**
1. Open browser console
2. Simulate a storage error by running:
   ```javascript
   // This would need to be done in the plugin code temporarily
   // Or test by disconnecting network if using cloud storage
   ```
3. Try to change language
4. Observe behavior

**Expected Results:**
- ✅ Plugin continues to function even if save fails
- ✅ Error message is logged to console
- ✅ UI still updates to show new language (in-memory state)
- ✅ No crash or frozen UI

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 9: Complete User Journey

**Objective:** Verify the complete user experience from first use to regular use.

**Steps:**
1. Clear plugin storage (simulate new user)
2. Open plugin
3. Verify Spanish is default
4. Browse the "Índice" tab
5. Navigate to "Generar Frame" tab
6. Change language to English
7. Observe all UI updates
8. Generate a frame
9. Close plugin
10. Reopen plugin
11. Verify English is still selected
12. Change back to Spanish
13. Verify all UI updates

**Expected Results:**
- ✅ Smooth experience throughout
- ✅ No confusion about which language is active
- ✅ Settings persist correctly
- ✅ All UI elements update consistently
- ✅ No visual glitches or delays

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

## Requirements Coverage

This verification covers the following requirements:

- **Requirement 1.3:** UI updates immediately on language selection ✓
- **Requirement 1.5:** Default Spanish for new users ✓
- **Requirement 2.1:** Language preference saved to storage ✓
- **Requirement 2.2:** Plugin retrieves saved language on load ✓
- **Requirement 2.3:** Plugin applies saved language to UI ✓
- **Requirement 2.4:** Default Spanish when no saved language exists ✓

## Summary

**Total Tests:** 9  
**Passed:** ___  
**Failed:** ___  
**Not Tested:** ___  

**Overall Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Failed

## Notes

Add any observations, issues, or additional notes here:

---

## Sign-off

**Tested By:** _______________  
**Date:** _______________  
**Version:** 1.1  
**Environment:** Figma Desktop / Figma Browser (circle one)

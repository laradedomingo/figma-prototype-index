/**
 * Unit tests for togglePage() function
 * Task 10.1: Create togglePage() function
 * 
 * Tests verify that togglePage():
 * - Calls togglePageSelection(pageId) to update state
 * - Updates toggle button visual state immediately
 * - Triggers preview summary update
 * - Triggers debounced storage save
 * 
 * These tests verify the logic and integration of the togglePage function
 * by testing the behavior described in the task requirements.
 */

describe('Task 10.1: togglePage() function - Logic verification', () => {
  
  test('togglePage() implementation exists in ui.html', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Verify togglePage function exists
    expect(html).toContain('function togglePage(pageId)');
  });

  test('togglePage() calls togglePageSelection(pageId)', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Extract togglePage function
    const togglePageMatch = html.match(/function togglePage\(pageId\)\s*{([^}]+)}/);
    expect(togglePageMatch).toBeTruthy();
    
    const togglePageBody = togglePageMatch[1];
    
    // Verify it calls togglePageSelection
    expect(togglePageBody).toContain('togglePageSelection(pageId)');
  });

  test('togglePage() re-renders page filter list to update visual state', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Extract togglePage function
    const togglePageMatch = html.match(/function togglePage\(pageId\)\s*{([^}]+)}/);
    expect(togglePageMatch).toBeTruthy();
    
    const togglePageBody = togglePageMatch[1];
    
    // Verify it calls renderPageFilterList to update visual state
    expect(togglePageBody).toContain('renderPageFilterList');
  });

  test('togglePageSelection() updates state and triggers updates', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Extract togglePageSelection function
    const togglePageSelectionMatch = html.match(/function togglePageSelection\(pageId\)\s*{([^}]+)}/);
    expect(togglePageSelectionMatch).toBeTruthy();
    
    const togglePageSelectionBody = togglePageSelectionMatch[1];
    
    // Verify it updates state
    expect(togglePageSelectionBody).toContain('pageSelections[pageId]');
    expect(togglePageSelectionBody).toContain('!pageSelections[pageId]');
    
    // Verify it calls updatePreviewSummary
    expect(togglePageSelectionBody).toContain('updatePreviewSummary()');
    
    // Verify it calls savePageSelections (debounced save)
    expect(togglePageSelectionBody).toContain('savePageSelections()');
  });

  test('savePageSelections() has debouncing mechanism', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Extract savePageSelections function - match across multiple lines including nested braces
    const savePageSelectionsMatch = html.match(/function savePageSelections\(\)\s*{([\s\S]*?)(?=\n\s*\/\*\*|\n\s*function\s)/);
    expect(savePageSelectionsMatch).toBeTruthy();
    
    const savePageSelectionsBody = savePageSelectionsMatch[1];
    
    // Verify debouncing with setTimeout
    expect(savePageSelectionsBody).toContain('setTimeout');
    expect(savePageSelectionsBody).toContain('300'); // 300ms debounce
    
    // Verify it sends SAVE_PAGE_SELECTIONS message
    expect(savePageSelectionsBody).toContain('SAVE_PAGE_SELECTIONS');
  });

  test('togglePage() is called from onclick handlers in page filter items', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Verify onclick handler calls togglePage
    expect(html).toContain('onclick="togglePage(');
  });

  test('updatePreviewSummary() recalculates prototype counts based on page selections', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Extract updatePreviewSummary function
    const updatePreviewSummaryMatch = html.match(/function updatePreviewSummary\(\)\s*{([\s\S]*?)(?=\n\s*\/\*\*|\n\s*function\s)/);
    expect(updatePreviewSummaryMatch).toBeTruthy();
    
    const updatePreviewSummaryBody = updatePreviewSummaryMatch[1];
    
    // Verify it counts prototypes based on pageSelections
    expect(updatePreviewSummaryBody).toContain('pageSelections');
    expect(updatePreviewSummaryBody).toContain('selectedPrototypeCount');
    expect(updatePreviewSummaryBody).toContain('selectedPageCount');
    
    // Verify it updates preview display
    expect(updatePreviewSummaryBody).toContain('prev-protos');
    expect(updatePreviewSummaryBody).toContain('prev-pages');
  });

  test('Integration: togglePage workflow is correctly implemented', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Verify the complete workflow:
    // 1. togglePage exists and calls togglePageSelection
    expect(html).toContain('function togglePage(pageId)');
    expect(html).toMatch(/function togglePage\(pageId\)\s*{[^}]*togglePageSelection\(pageId\)/);
    
    // 2. togglePageSelection updates state, calls updatePreviewSummary and savePageSelections
    expect(html).toMatch(/function togglePageSelection\(pageId\)\s*{[^}]*pageSelections\[pageId\][^}]*updatePreviewSummary\(\)[^}]*savePageSelections\(\)/s);
    
    // 3. togglePage re-renders the page filter list
    expect(html).toMatch(/function togglePage\(pageId\)\s*{[^}]*renderPageFilterList/);
    
    // 4. savePageSelections has debouncing - check for setTimeout and 300ms with broader search
    expect(html).toContain('function savePageSelections()');
    expect(html).toMatch(/function savePageSelections\(\)[\s\S]{0,800}setTimeout[\s\S]{0,300}300/);
  });

  test('Requirements validation: Task 10.1 requirements are met', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Requirement: Call togglePageSelection(pageId) to update state
    expect(html).toMatch(/function togglePage\(pageId\)[^}]*togglePageSelection\(pageId\)/);
    
    // Requirement: Update toggle button visual state immediately (via renderPageFilterList)
    expect(html).toMatch(/function togglePage\(pageId\)[^}]*renderPageFilterList/);
    
    // Requirement: Trigger preview summary update (via togglePageSelection -> updatePreviewSummary)
    expect(html).toMatch(/function togglePageSelection\(pageId\)[^}]*updatePreviewSummary\(\)/);
    
    // Requirement: Trigger debounced storage save (via togglePageSelection -> savePageSelections)
    expect(html).toMatch(/function togglePageSelection\(pageId\)[^}]*savePageSelections\(\)/);
    // Check savePageSelections has setTimeout with 300ms - use broader search
    expect(html).toContain('function savePageSelections()');
    expect(html).toMatch(/function savePageSelections\(\)[\s\S]{0,800}setTimeout[\s\S]{0,300}300/);
  });
});

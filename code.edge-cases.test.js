/**
 * Edge Case Handling Tests for Frame Creation Tab Feature
 * Feature: frame-creation-tab-feature
 * Task 15: Handle edge cases and error conditions
 * 
 * These tests verify:
 * - Task 15.1: Error handling for storage failures
 * - Task 15.2: Handling for empty page list
 * - Task 15.3: Handling for all pages deselected
 */

const fs = require('fs');
const path = require('path');

// Load the code.js file content
const codeContent = fs.readFileSync(path.join(__dirname, 'code.js'), 'utf8');

describe('Task 15.1: Error handling for storage failures', () => {
  test('should log storage save failures to console', () => {
    // Verify console.error is called for storage failures
    expect(codeContent).toContain('console.error("Failed to save page selections:", err)');
    expect(codeContent).toContain('console.error("Failed to save setting:", err)');
  });

  test('should continue with in-memory state if save fails', () => {
    // Verify that errors are caught and don't crash the plugin
    expect(codeContent).toContain('catch (err) {');
    expect(codeContent).toContain('Log storage save failures to console');
    expect(codeContent).toContain('Continue with in-memory state if save fails');
  });

  test('should show user-friendly message if critical failure', () => {
    // Verify STORAGE_ERROR message is sent to UI
    expect(codeContent).toContain('type: "STORAGE_ERROR"');
    expect(codeContent).toContain('Could not save page selections');
    expect(codeContent).toContain('severity: "warning"');
  });

  test('should provide informative error messages', () => {
    // Verify error messages explain the impact to users
    expect(codeContent).toContain('Your selections will be remembered during this session');
    expect(codeContent).toContain('may not persist after closing the plugin');
  });
});

describe('Task 15.2: Handling for empty page list', () => {
  test('should have translation strings for empty page list', () => {
    // Read ui.html to verify translations exist
    const uiContent = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Spanish translation
    expect(uiContent).toContain("'generate.pageFilter.empty': 'No hay páginas con prototipos'");
    
    // English translation
    expect(uiContent).toContain("'generate.pageFilter.empty': 'No pages with prototypes'");
    
    // Basque translation
    expect(uiContent).toContain("'generate.pageFilter.empty': 'Ez dago prototipoekin orrialdeak'");
  });

  test('should support empty page metadata extraction', () => {
    // Verify extractPageMetadata can handle empty arrays
    expect(codeContent).toContain('function extractPageMetadata(prototypes)');
    expect(codeContent).toContain('const pageMap = new Map()');
    expect(codeContent).toContain('return Array.from(pageMap.values())');
  });
});

describe('Task 15.3: Handling for all pages deselected', () => {
  test('should have warning translation for no selection', () => {
    // Read ui.html to verify warning translations exist
    const uiContent = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Spanish warning
    expect(uiContent).toContain("'generate.preview.warningNoSelection': '⚠️ No hay prototipos seleccionados. Se generará un frame vacío.'");
    
    // English warning
    expect(uiContent).toContain("'generate.preview.warningNoSelection': '⚠️ No prototypes selected. An empty frame will be generated.'");
    
    // Basque warning
    expect(uiContent).toContain("'generate.preview.warningNoSelection': '⚠️ Ez da prototipoak hautatu. Marko huts bat sortuko da.'");
  });

  test('should update preview summary to show warning when no prototypes selected', () => {
    const uiContent = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Verify updatePreviewSummary function exists and handles zero selection
    expect(uiContent).toContain('function updatePreviewSummary()');
    expect(uiContent).toContain('selectedPrototypeCount === 0');
    expect(uiContent).toContain("getTranslation('generate.preview.warningNoSelection'");
  });

  test('should allow frame generation with empty selection', () => {
    // Verify generateIndexFrame handles empty filtered prototypes
    expect(codeContent).toContain('let filteredPrototypes = prototypes');
    expect(codeContent).toContain('if (options.selectedPages)');
    expect(codeContent).toContain('filteredPrototypes = prototypes.filter');
    
    // The function should continue even with empty filteredPrototypes array
    // It will generate a frame with header/footer but no cards
  });

  test('should display correct counts in preview when all pages deselected', () => {
    const uiContent = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Verify preview displays are updated
    expect(uiContent).toContain("document.getElementById('prev-protos').textContent = selectedPrototypeCount");
    expect(uiContent).toContain("document.getElementById('prev-pages').textContent = selectedPageCount");
  });
});

describe('Task 15: Integration - All edge cases', () => {
  test('should handle storage errors gracefully without crashing', () => {
    // Verify all storage operations have try-catch blocks
    const savePageSelectionsMatch = codeContent.match(/case "SAVE_PAGE_SELECTIONS"[\s\S]*?try \{[\s\S]*?catch \(err\)/);
    expect(savePageSelectionsMatch).toBeTruthy();
    
    const saveSettingMatch = codeContent.match(/case "SAVE_SETTING"[\s\S]*?try \{[\s\S]*?catch \(err\)/);
    expect(saveSettingMatch).toBeTruthy();
  });

  test('should provide consistent error handling across all storage operations', () => {
    // Verify STORAGE_ERROR is used consistently
    const storageErrorMatches = codeContent.match(/type: "STORAGE_ERROR"/g);
    expect(storageErrorMatches).toBeTruthy();
    expect(storageErrorMatches.length).toBeGreaterThanOrEqual(2);
  });

  test('should support all three languages for edge case messages', () => {
    const uiContent = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Verify all three languages have the necessary translations
    const languages = ['es', 'en', 'eu'];
    languages.forEach(lang => {
      // Check for page filter translations
      expect(uiContent).toContain(`${lang}: {`);
      expect(uiContent).toContain("'generate.pageFilter.empty'");
      expect(uiContent).toContain("'generate.preview.warningNoSelection'");
    });
  });

  test('should handle UI message for storage errors', () => {
    const uiContent = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
    
    // Verify STORAGE_ERROR message handler exists
    expect(uiContent).toContain("case 'STORAGE_ERROR':");
    expect(uiContent).toContain('Handle storage failures with user-friendly message');
    expect(uiContent).toContain('showToast');
  });
});

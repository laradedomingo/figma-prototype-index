/**
 * Task 6: Button State Management Tests
 * 
 * Tests for updateButtonStates() function and its integration
 * Validates Requirements: 5.1, 5.2, 5.4, 5.5, 13.1, 13.2, 13.3, 13.4, 13.5
 */

const fs = require('fs');
const path = require('path');

describe('Task 6: Button State Management', () => {
  let html;
  let updateButtonStatesBody;

  // Helper function to extract complete function body
  function extractFunctionBody(html, functionName) {
    const startIdx = html.indexOf(`function ${functionName}(`);
    if (startIdx === -1) return null;
    
    // Find the matching closing brace
    let braceCount = 0;
    let inFunction = false;
    let endIdx = startIdx;
    
    for (let i = startIdx; i < html.length; i++) {
      if (html[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (html[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    
    return html.substring(startIdx, endIdx);
  }

  beforeAll(() => {
    html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf-8');
    updateButtonStatesBody = extractFunctionBody(html, 'updateButtonStates');
  });

  describe('6.1: updateButtonStates() function exists', () => {
    test('function is defined', () => {
      expect(updateButtonStatesBody).toBeTruthy();
      expect(updateButtonStatesBody).toMatch(/function updateButtonStates\(\)/);
    });

    test('calculates available prototype count after filtering', () => {
      // Should check pageSelections and count prototypes from selected pages
      expect(updateButtonStatesBody).toMatch(/availablePrototypeCount/);
      expect(updateButtonStatesBody).toMatch(/pageSelections\[proto\.pageId\]\s*===\s*true/);
    });

    test('disables both buttons when no prototypes available', () => {
      // Should disable both copy and download buttons
      expect(updateButtonStatesBody).toMatch(/copyBtn\.disabled\s*=\s*true/);
      expect(updateButtonStatesBody).toMatch(/downloadBtn\.disabled\s*=\s*true/);
    });

    test('applies visual disabled styling', () => {
      // Should set opacity and cursor styles
      expect(updateButtonStatesBody).toMatch(/\.style\.opacity\s*=\s*['"]0\.4['"]/);
      expect(updateButtonStatesBody).toMatch(/\.style\.cursor\s*=\s*['"]not-allowed['"]/);
    });

    test('enables both buttons when prototypes available', () => {
      // Should enable both buttons
      expect(updateButtonStatesBody).toMatch(/copyBtn\.disabled\s*=\s*false/);
      expect(updateButtonStatesBody).toMatch(/downloadBtn\.disabled\s*=\s*false/);
    });

    test('removes disabled styling when enabled', () => {
      // Should clear opacity and cursor styles
      expect(updateButtonStatesBody).toMatch(/\.style\.opacity\s*=\s*['"]['"];/);
      expect(updateButtonStatesBody).toMatch(/\.style\.cursor\s*=\s*['"]['"];/);
    });

    test('synchronizes both button states (Requirement 13.5)', () => {
      // Both buttons should be set to the same state in the same conditional blocks
      // Count how many times each button is disabled/enabled
      const copyDisabled = (updateButtonStatesBody.match(/copyBtn\.disabled\s*=\s*true/g) || []).length;
      const downloadDisabled = (updateButtonStatesBody.match(/downloadBtn\.disabled\s*=\s*true/g) || []).length;
      const copyEnabled = (updateButtonStatesBody.match(/copyBtn\.disabled\s*=\s*false/g) || []).length;
      const downloadEnabled = (updateButtonStatesBody.match(/downloadBtn\.disabled\s*=\s*false/g) || []).length;
      
      // Both buttons should be disabled and enabled the same number of times
      expect(copyDisabled).toBe(downloadDisabled);
      expect(copyEnabled).toBe(downloadEnabled);
      expect(copyDisabled).toBeGreaterThan(0);
      expect(copyEnabled).toBeGreaterThan(0);
    });
  });

  describe('6.2: Integration with existing functions', () => {
    test('called from renderPrototypes() after rendering', () => {
      // Find renderPrototypes function
      const funcBody = extractFunctionBody(html, 'renderPrototypes');
      expect(funcBody).toBeTruthy();
      
      // Should call updateButtonStates
      expect(funcBody).toMatch(/updateButtonStates\(\)/);
    });

    test('called from togglePageSelection() after state change', () => {
      // Find togglePageSelection function
      const funcBody = extractFunctionBody(html, 'togglePageSelection');
      expect(funcBody).toBeTruthy();
      
      // Should call updateButtonStates
      expect(funcBody).toMatch(/updateButtonStates\(\)/);
    });

    test('called after initial data load (via renderPrototypes)', () => {
      // Check that INITIAL_DATA handler calls renderPrototypes
      expect(html).toMatch(/case\s+['"]INITIAL_DATA['"][\s\S]*?renderPrototypes/);
      
      // Check that PROTOTYPES_DATA handler calls renderPrototypes
      expect(html).toMatch(/case\s+['"]PROTOTYPES_DATA['"][\s\S]*?renderPrototypes/);
      
      // Check that PROTOTYPES_UPDATED handler calls renderPrototypes
      expect(html).toMatch(/case\s+['"]PROTOTYPES_UPDATED['"][\s\S]*?renderPrototypes/);
    });
  });

  describe('Requirements validation', () => {
    test('Requirement 5.1: Copy button disabled when prototype list empty', () => {
      // updateButtonStates should check availablePrototypeCount === 0
      expect(updateButtonStatesBody).toMatch(/availablePrototypeCount\s*===\s*0/);
      expect(updateButtonStatesBody).toMatch(/copyBtn\.disabled\s*=\s*true/);
    });

    test('Requirement 5.2: Visual styling applied when disabled', () => {
      expect(updateButtonStatesBody).toMatch(/\.style\.opacity/);
      expect(updateButtonStatesBody).toMatch(/\.style\.cursor/);
    });

    test('Requirement 5.4: Copy button enabled when prototypes available', () => {
      expect(updateButtonStatesBody).toMatch(/copyBtn\.disabled\s*=\s*false/);
    });

    test('Requirement 5.5: Copy button disabled when all pages deselected', () => {
      // Function should count prototypes from selected pages only
      expect(updateButtonStatesBody).toMatch(/pageSelections\[proto\.pageId\]\s*===\s*true/);
    });

    test('Requirement 13.1: Download button disabled when prototype list empty', () => {
      expect(updateButtonStatesBody).toMatch(/downloadBtn\.disabled\s*=\s*true/);
    });

    test('Requirement 13.2: Visual styling applied to download button when disabled', () => {
      // Should apply styling to downloadBtn
      expect(updateButtonStatesBody).toMatch(/downloadBtn\.style\.opacity/);
      expect(updateButtonStatesBody).toMatch(/downloadBtn\.style\.cursor/);
    });

    test('Requirement 13.3: Download button enabled when prototypes available', () => {
      expect(updateButtonStatesBody).toMatch(/downloadBtn\.disabled\s*=\s*false/);
    });

    test('Requirement 13.4: Download button disabled when all pages deselected', () => {
      // Same logic as copy button - uses availablePrototypeCount
      expect(updateButtonStatesBody).toMatch(/availablePrototypeCount\s*===\s*0/);
      expect(updateButtonStatesBody).toMatch(/downloadBtn\.disabled\s*=\s*true/);
    });

    test('Requirement 13.5: Button states synchronized', () => {
      // Both buttons should be in the same if/else blocks
      // Check that both are disabled together
      const disableBlock = updateButtonStatesBody.match(/if\s*\([^{]*availablePrototypeCount\s*===\s*0[^{]*\)\s*\{[^}]*copyBtn\.disabled[^}]*downloadBtn\.disabled[^}]*\}/s);
      expect(disableBlock).toBeTruthy();
      
      // Check that both are enabled together in else block
      const enableBlock = updateButtonStatesBody.match(/else\s*\{[^}]*copyBtn\.disabled\s*=\s*false[^}]*downloadBtn\.disabled\s*=\s*false[^}]*\}/s);
      expect(enableBlock).toBeTruthy();
    });
  });
});

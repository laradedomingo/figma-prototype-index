/**
 * Tests for Task 12: Initialization and Settings Restoration
 * 
 * This test file verifies that the plugin correctly initializes page selections
 * and restores saved state when the plugin loads.
 */

const fs = require('fs');
const path = require('path');

// Load ui.html and extract JavaScript
const uiHtml = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
const scriptMatch = uiHtml.match(/<script>([\s\S]*?)<\/script>/);
const uiScript = scriptMatch ? scriptMatch[1] : '';

// Extract just the state management functions we need to test
const initializePageSelectionsMatch = uiScript.match(/function initializePageSelections\(pages\) \{[\s\S]*?\n  \}/);
const mergePageSelectionsMatch = uiScript.match(/function mergePageSelections\(savedSelections, currentPages\) \{[\s\S]*?\n  \}/);
const extractPageMetadataMatch = uiScript.match(/function extractPageMetadata\(prototypes\) \{[\s\S]*?\n  \}/);

// Execute the extracted functions
if (initializePageSelectionsMatch) eval(initializePageSelectionsMatch[0]);
if (mergePageSelectionsMatch) eval(mergePageSelectionsMatch[0]);
if (extractPageMetadataMatch) eval(extractPageMetadataMatch[0]);

describe('Task 12: Initialization and Settings Restoration', () => {

  describe('Task 12.1: State Management Functions', () => {
    
    test('initializePageSelections should set all pages to true', () => {
      // Arrange
      const pages = [
        { id: 'page1', name: 'Page 1', prototypeCount: 3 },
        { id: 'page2', name: 'Page 2', prototypeCount: 2 },
        { id: 'page3', name: 'Page 3', prototypeCount: 1 }
      ];
      
      // Act
      const result = initializePageSelections(pages);
      
      // Assert
      expect(result).toEqual({
        'page1': true,
        'page2': true,
        'page3': true
      });
    });

    test('initializePageSelections should handle empty pages array', () => {
      // Arrange
      const pages = [];
      
      // Act
      const result = initializePageSelections(pages);
      
      // Assert
      expect(result).toEqual({});
    });

    test('mergePageSelections should preserve saved selections', () => {
      // Arrange
      const savedSelections = {
        'page1': false,
        'page2': true
      };
      const currentPages = [
        { id: 'page1', name: 'Page 1', prototypeCount: 2 },
        { id: 'page2', name: 'Page 2', prototypeCount: 1 }
      ];
      
      // Act
      const result = mergePageSelections(savedSelections, currentPages);
      
      // Assert
      expect(result).toEqual({
        'page1': false,
        'page2': true
      });
    });

    test('mergePageSelections should default new pages to true', () => {
      // Arrange
      const savedSelections = {
        'page1': false
      };
      const currentPages = [
        { id: 'page1', name: 'Page 1', prototypeCount: 2 },
        { id: 'page2', name: 'Page 2', prototypeCount: 1 } // New page
      ];
      
      // Act
      const result = mergePageSelections(savedSelections, currentPages);
      
      // Assert
      expect(result).toEqual({
        'page1': false,
        'page2': true // New page defaults to true
      });
    });

    test('mergePageSelections should remove selections for deleted pages', () => {
      // Arrange
      const savedSelections = {
        'page1': true,
        'page2': false,
        'page3': true
      };
      const currentPages = [
        { id: 'page1', name: 'Page 1', prototypeCount: 2 }
        // page2 and page3 were removed
      ];
      
      // Act
      const result = mergePageSelections(savedSelections, currentPages);
      
      // Assert
      expect(result).toEqual({
        'page1': true
        // page2 and page3 should not be in result
      });
    });

    test('mergePageSelections should handle empty saved selections', () => {
      // Arrange
      const savedSelections = {};
      const currentPages = [
        { id: 'page1', name: 'Page 1', prototypeCount: 2 },
        { id: 'page2', name: 'Page 2', prototypeCount: 1 }
      ];
      
      // Act
      const result = mergePageSelections(savedSelections, currentPages);
      
      // Assert - all pages should default to true
      expect(result).toEqual({
        'page1': true,
        'page2': true
      });
    });
  });

  describe('Task 12.2: Page Metadata Extraction', () => {
    
    test('extractPageMetadata should group prototypes by page', () => {
      // Arrange
      const prototypes = [
        { id: 'p1', pageId: 'page1', pageName: 'Page 1' },
        { id: 'p2', pageId: 'page1', pageName: 'Page 1' },
        { id: 'p3', pageId: 'page2', pageName: 'Page 2' }
      ];
      
      // Act
      const result = extractPageMetadata(prototypes);
      
      // Assert
      expect(result).toEqual([
        { id: 'page1', name: 'Page 1', prototypeCount: 2 },
        { id: 'page2', name: 'Page 2', prototypeCount: 1 }
      ]);
    });

    test('extractPageMetadata should handle empty prototypes array', () => {
      // Arrange
      const prototypes = [];
      
      // Act
      const result = extractPageMetadata(prototypes);
      
      // Assert
      expect(result).toEqual([]);
    });

    test('extractPageMetadata should count prototypes correctly', () => {
      // Arrange
      const prototypes = [
        { id: 'p1', pageId: 'page1', pageName: 'Page 1' },
        { id: 'p2', pageId: 'page1', pageName: 'Page 1' },
        { id: 'p3', pageId: 'page1', pageName: 'Page 1' },
        { id: 'p4', pageId: 'page2', pageName: 'Page 2' }
      ];
      
      // Act
      const result = extractPageMetadata(prototypes);
      
      // Assert
      expect(result).toEqual([
        { id: 'page1', name: 'Page 1', prototypeCount: 3 },
        { id: 'page2', name: 'Page 2', prototypeCount: 1 }
      ]);
    });
  });

  describe('Integration: Message Handler Logic', () => {
    
    test('SETTINGS_LOADED flow: first-time usage', () => {
      // Simulate the logic that happens in SETTINGS_LOADED handler
      const savedSelections = {}; // Empty = first-time
      const prototypes = [
        { id: 'p1', pageId: 'page1', pageName: 'Page 1' },
        { id: 'p2', pageId: 'page2', pageName: 'Page 2' }
      ];
      
      // Extract pages
      const currentPages = extractPageMetadata(prototypes);
      
      // Initialize or merge
      let pageSelections;
      if (Object.keys(savedSelections).length === 0) {
        pageSelections = initializePageSelections(currentPages);
      } else {
        pageSelections = mergePageSelections(savedSelections, currentPages);
      }
      
      // Assert
      expect(pageSelections).toEqual({
        'page1': true,
        'page2': true
      });
    });

    test('SETTINGS_LOADED flow: restoring saved state', () => {
      // Simulate the logic that happens in SETTINGS_LOADED handler
      const savedSelections = {
        'page1': false,
        'page2': true
      };
      const prototypes = [
        { id: 'p1', pageId: 'page1', pageName: 'Page 1' },
        { id: 'p2', pageId: 'page2', pageName: 'Page 2' },
        { id: 'p3', pageId: 'page3', pageName: 'Page 3' } // New page
      ];
      
      // Extract pages
      const currentPages = extractPageMetadata(prototypes);
      
      // Merge
      const pageSelections = mergePageSelections(savedSelections, currentPages);
      
      // Assert
      expect(pageSelections).toEqual({
        'page1': false,
        'page2': true,
        'page3': true // New page defaults to true
      });
    });

    test('PROTOTYPES_DATA flow: handling page changes', () => {
      // Simulate the logic that happens in PROTOTYPES_DATA handler
      const existingSelections = {
        'page1': false,
        'page2': true,
        'page3': true
      };
      
      const newPrototypes = [
        { id: 'p1', pageId: 'page1', pageName: 'Page 1' },
        { id: 'p4', pageId: 'page4', pageName: 'Page 4' } // page2 and page3 removed, page4 added
      ];
      
      // Extract pages
      const currentPages = extractPageMetadata(newPrototypes);
      
      // Merge
      const pageSelections = mergePageSelections(existingSelections, currentPages);
      
      // Assert
      expect(pageSelections).toEqual({
        'page1': false,
        'page4': true // New page defaults to true
        // page2 and page3 removed
      });
    });
  });
});


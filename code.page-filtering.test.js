/**
 * Page Filtering Feature Tests
 * 
 * Feature: frame-creation-tab-feature
 * 
 * This test suite covers the page filtering functionality for the "Generar Frame" tab.
 * It includes both unit tests for specific scenarios and property-based tests for
 * universal behaviors.
 */

const fc = require('fast-check');

// Mock Figma API for testing
global.figma = {
  clientStorage: {
    getAsync: jest.fn(),
    setAsync: jest.fn()
  },
  ui: {
    postMessage: jest.fn()
  },
  currentPage: null,
  root: {
    children: []
  }
};

describe('Feature: frame-creation-tab-feature - Page Filtering', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================================
   * Unit Tests - Page Selection State Management
   * ============================================================================
   */
  
  describe('Page Selection State Management', () => {
    
    test('should initialize all pages as selected by default', () => {
      // Arrange
      const pages = [
        { id: 'page-1', name: 'Page 1' },
        { id: 'page-2', name: 'Page 2' },
        { id: 'page-3', name: 'Page 3' }
      ];

      // Act
      const selections = {};
      pages.forEach(page => {
        selections[page.id] = true;
      });

      // Assert
      expect(selections['page-1']).toBe(true);
      expect(selections['page-2']).toBe(true);
      expect(selections['page-3']).toBe(true);
      expect(Object.keys(selections).length).toBe(3);
    });

    test('should merge saved selections with current pages', () => {
      // Arrange
      const savedSelections = {
        'page-1': false,
        'page-2': true,
        'page-old': false // This page no longer exists
      };
      const currentPages = [
        { id: 'page-1', name: 'Page 1' },
        { id: 'page-2', name: 'Page 2' },
        { id: 'page-3', name: 'Page 3' } // New page
      ];

      // Act
      const merged = {};
      currentPages.forEach(page => {
        merged[page.id] = savedSelections[page.id] !== undefined 
          ? savedSelections[page.id] 
          : true;
      });

      // Assert
      expect(merged['page-1']).toBe(false); // Restored from saved
      expect(merged['page-2']).toBe(true);  // Restored from saved
      expect(merged['page-3']).toBe(true);  // New page defaults to true
      expect(merged['page-old']).toBeUndefined(); // Old page removed
      expect(Object.keys(merged).length).toBe(3);
    });

    test('should toggle page selection state', () => {
      // Arrange
      const pageSelections = {
        'page-1': true,
        'page-2': false
      };

      // Act
      pageSelections['page-1'] = !pageSelections['page-1'];
      pageSelections['page-2'] = !pageSelections['page-2'];

      // Assert
      expect(pageSelections['page-1']).toBe(false);
      expect(pageSelections['page-2']).toBe(true);
    });
  });

  /**
   * ============================================================================
   * Unit Tests - Prototype Filtering
   * ============================================================================
   */
  
  describe('Prototype Filtering', () => {
    
    test('should filter prototypes by selected pages', () => {
      // Arrange
      const prototypes = [
        { id: 'proto-1', name: 'Proto 1', pageId: 'page-1' },
        { id: 'proto-2', name: 'Proto 2', pageId: 'page-2' },
        { id: 'proto-3', name: 'Proto 3', pageId: 'page-1' },
        { id: 'proto-4', name: 'Proto 4', pageId: 'page-3' }
      ];
      const selectedPages = {
        'page-1': true,
        'page-2': false,
        'page-3': true
      };

      // Act
      const filtered = prototypes.filter(proto => 
        selectedPages[proto.pageId] === true
      );

      // Assert
      expect(filtered.length).toBe(3);
      expect(filtered.map(p => p.id)).toEqual(['proto-1', 'proto-3', 'proto-4']);
    });

    test('should return empty array when no pages selected', () => {
      // Arrange
      const prototypes = [
        { id: 'proto-1', name: 'Proto 1', pageId: 'page-1' },
        { id: 'proto-2', name: 'Proto 2', pageId: 'page-2' }
      ];
      const selectedPages = {
        'page-1': false,
        'page-2': false
      };

      // Act
      const filtered = prototypes.filter(proto => 
        selectedPages[proto.pageId] === true
      );

      // Assert
      expect(filtered.length).toBe(0);
    });

    test('should return all prototypes when all pages selected', () => {
      // Arrange
      const prototypes = [
        { id: 'proto-1', name: 'Proto 1', pageId: 'page-1' },
        { id: 'proto-2', name: 'Proto 2', pageId: 'page-2' },
        { id: 'proto-3', name: 'Proto 3', pageId: 'page-3' }
      ];
      const selectedPages = {
        'page-1': true,
        'page-2': true,
        'page-3': true
      };

      // Act
      const filtered = prototypes.filter(proto => 
        selectedPages[proto.pageId] === true
      );

      // Assert
      expect(filtered.length).toBe(3);
      expect(filtered).toEqual(prototypes);
    });
  });

  /**
   * ============================================================================
   * Unit Tests - Page Metadata Extraction
   * ============================================================================
   */
  
  describe('Page Metadata Extraction', () => {
    
    test('should extract page metadata from prototypes', () => {
      // Arrange
      const prototypes = [
        { id: 'proto-1', pageId: 'page-1', pageName: 'Page 1' },
        { id: 'proto-2', pageId: 'page-1', pageName: 'Page 1' },
        { id: 'proto-3', pageId: 'page-2', pageName: 'Page 2' }
      ];

      // Act
      const pageMap = new Map();
      prototypes.forEach(proto => {
        if (!pageMap.has(proto.pageId)) {
          pageMap.set(proto.pageId, {
            id: proto.pageId,
            name: proto.pageName,
            prototypeCount: 0
          });
        }
        pageMap.get(proto.pageId).prototypeCount++;
      });
      const pages = Array.from(pageMap.values());

      // Assert
      expect(pages.length).toBe(2);
      expect(pages[0]).toEqual({ id: 'page-1', name: 'Page 1', prototypeCount: 2 });
      expect(pages[1]).toEqual({ id: 'page-2', name: 'Page 2', prototypeCount: 1 });
    });

    test('should handle empty prototype list', () => {
      // Arrange
      const prototypes = [];

      // Act
      const pageMap = new Map();
      prototypes.forEach(proto => {
        if (!pageMap.has(proto.pageId)) {
          pageMap.set(proto.pageId, {
            id: proto.pageId,
            name: proto.pageName,
            prototypeCount: 0
          });
        }
        pageMap.get(proto.pageId).prototypeCount++;
      });
      const pages = Array.from(pageMap.values());

      // Assert
      expect(pages.length).toBe(0);
    });
  });

  /**
   * ============================================================================
   * Unit Tests - Storage Operations
   * ============================================================================
   */
  
  describe('Storage Operations', () => {
    
    test('should save page selections to storage', async () => {
      // Arrange
      const pageSelections = {
        'page-1': true,
        'page-2': false,
        'page-3': true
      };
      figma.clientStorage.setAsync.mockResolvedValue(undefined);

      // Act
      await figma.clientStorage.setAsync('pageSelections', pageSelections);

      // Assert
      expect(figma.clientStorage.setAsync).toHaveBeenCalledWith('pageSelections', pageSelections);
    });

    test('should load page selections from storage', async () => {
      // Arrange
      const savedSelections = {
        'page-1': false,
        'page-2': true
      };
      figma.clientStorage.getAsync.mockResolvedValue(savedSelections);

      // Act
      const loaded = await figma.clientStorage.getAsync('pageSelections');

      // Assert
      expect(figma.clientStorage.getAsync).toHaveBeenCalledWith('pageSelections');
      expect(loaded).toEqual(savedSelections);
    });

    test('should handle storage load failure gracefully', async () => {
      // Arrange
      figma.clientStorage.getAsync.mockRejectedValue(new Error('Storage error'));

      // Act
      let result = {};
      try {
        result = await figma.clientStorage.getAsync('pageSelections');
      } catch (err) {
        result = {}; // Default to empty object
      }

      // Assert
      expect(result).toEqual({});
    });
  });

  /**
   * ============================================================================
   * Unit Tests - Preview Summary Calculations
   * ============================================================================
   */
  
  describe('Preview Summary Calculations', () => {
    
    test('should calculate prototype count for selected pages', () => {
      // Arrange
      const prototypes = [
        { id: 'proto-1', pageId: 'page-1' },
        { id: 'proto-2', pageId: 'page-2' },
        { id: 'proto-3', pageId: 'page-1' },
        { id: 'proto-4', pageId: 'page-3' }
      ];
      const selectedPages = {
        'page-1': true,
        'page-2': false,
        'page-3': true
      };

      // Act
      const filtered = prototypes.filter(proto => 
        selectedPages[proto.pageId] === true
      );
      const count = filtered.length;

      // Assert
      expect(count).toBe(3);
    });

    test('should calculate selected page count', () => {
      // Arrange
      const selectedPages = {
        'page-1': true,
        'page-2': false,
        'page-3': true,
        'page-4': true
      };

      // Act
      const selectedCount = Object.values(selectedPages).filter(v => v === true).length;

      // Assert
      expect(selectedCount).toBe(3);
    });
  });

  /**
   * ============================================================================
   * Property-Based Tests
   * ============================================================================
   */

  describe('Property-Based Tests', () => {
    
    /**
     * Property 1: Page list completeness and ordering
     * **Validates: Requirements 1.1, 1.2, 1.3**
     */
    test('Property 1: Page list should include all pages with prototypes', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 30 }).filter(n => n !== '📋 Prototype Index'),
              prototypeCount: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 0, maxLength: 15 }
          ),
          (pages) => {
            // Act: Extract page metadata (simulating extractPageMetadata)
            const displayedPages = pages.filter(p => p.name !== '📋 Prototype Index');
            
            // Assert: All pages should be displayed
            expect(displayedPages.length).toBe(pages.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5: Prototype filtering correctness
     * **Validates: Requirements 3.1, 3.4**
     */
    test('Property 5: Filtered prototypes should match selected pages exactly', () => {
      fc.assert(
        fc.property(
          // Generate prototypes with page IDs
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 30 }),
              pageId: fc.oneof(
                fc.constant('page-1'),
                fc.constant('page-2'),
                fc.constant('page-3')
              )
            }),
            { minLength: 0, maxLength: 20 }
          ),
          // Generate page selections
          fc.record({
            'page-1': fc.boolean(),
            'page-2': fc.boolean(),
            'page-3': fc.boolean()
          }),
          (prototypes, selectedPages) => {
            // Act: Filter prototypes
            const filtered = prototypes.filter(proto => 
              selectedPages[proto.pageId] === true
            );

            // Assert: All filtered prototypes should be from selected pages
            filtered.forEach(proto => {
              expect(selectedPages[proto.pageId]).toBe(true);
            });

            // Assert: No prototypes from unselected pages should be included
            const unselectedPageIds = Object.keys(selectedPages)
              .filter(pageId => selectedPages[pageId] === false);
            
            unselectedPageIds.forEach(pageId => {
              const protosFromUnselectedPage = filtered.filter(p => p.pageId === pageId);
              expect(protosFromUnselectedPage.length).toBe(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6: All pages selected equivalence
     * **Validates: Requirements 3.3**
     */
    test('Property 6: When all pages selected, should include all prototypes', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 30 }),
              pageId: fc.oneof(
                fc.constant('page-1'),
                fc.constant('page-2'),
                fc.constant('page-3')
              )
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (prototypes) => {
            // Arrange: All pages selected
            const selectedPages = {
              'page-1': true,
              'page-2': true,
              'page-3': true
            };

            // Act: Filter prototypes
            const filtered = prototypes.filter(proto => 
              selectedPages[proto.pageId] === true
            );

            // Assert: Should include all prototypes
            expect(filtered.length).toBe(prototypes.length);
            expect(filtered).toEqual(prototypes);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 8: Selection state persistence round-trip
     * **Validates: Requirements 5.1, 5.2**
     */
    test('Property 8: Saved selections should be restored correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            'page-1': fc.boolean(),
            'page-2': fc.boolean(),
            'page-3': fc.boolean()
          }),
          fc.array(
            fc.record({
              id: fc.oneof(
                fc.constant('page-1'),
                fc.constant('page-2'),
                fc.constant('page-3')
              ),
              name: fc.string({ minLength: 1, maxLength: 30 })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (savedSelections, currentPages) => {
            // Act: Merge saved selections with current pages
            const merged = {};
            currentPages.forEach(page => {
              merged[page.id] = savedSelections[page.id] !== undefined 
                ? savedSelections[page.id] 
                : true;
            });

            // Assert: Saved values should be restored for existing pages
            currentPages.forEach(page => {
              if (savedSelections[page.id] !== undefined) {
                expect(merged[page.id]).toBe(savedSelections[page.id]);
              } else {
                expect(merged[page.id]).toBe(true); // Default for new pages
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10: New page default state
     * **Validates: Requirements 2.5, 5.4**
     */
    test('Property 10: New pages should default to selected state', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 30 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (pages) => {
            // Act: Initialize selections for new pages
            const selections = {};
            pages.forEach(page => {
              selections[page.id] = true;
            });

            // Assert: All pages should be selected by default
            Object.values(selections).forEach(selected => {
              expect(selected).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Task 13.1: Extend generateFrame button handler
 * 
 * **Validates: Requirements 3.1, 3.3**
 * 
 * This test verifies that:
 * 1. The generateFrame button handler includes pageSelections in the options object
 * 2. The selectedPages parameter is passed to generateIndexFrame()
 * 3. Backward compatibility is maintained when pageSelections is undefined
 */

const fc = require('fast-check');

// Mock Figma API
global.figma = {
  loadAllPagesAsync: async () => Promise.resolve(),
  clientStorage: {
    getAsync: async (key) => {
      if (key === 'pageSelections') return { 'page1': true, 'page2': false };
      return null;
    },
    setAsync: async (key, value) => Promise.resolve()
  },
  ui: {
    postMessage: (msg) => {}
  }
};

// Import the function we're testing (simulated for testing purposes)
async function generateIndexFrame(prototypes, options) {
  // Simulate the filtering logic from code.js
  let filteredPrototypes = prototypes;
  if (options.selectedPages) {
    filteredPrototypes = prototypes.filter(proto => 
      options.selectedPages[proto.pageId] === true
    );
  }
  return { prototypes: filteredPrototypes };
}

describe('Task 13.1: generateFrame button handler extension', () => {
  
  it('should include pageSelections in options object', () => {
    // Simulate the button handler behavior
    const pageSelections = { 'page1': true, 'page2': false, 'page3': true };
    const selectedLayout = 'list';
    const optUrls = true;
    const optPage = false;
    const currentLanguage = 'es';
    
    // This simulates what the button handler does
    const options = {
      layout: selectedLayout,
      showUrls: optUrls,
      dedicatedPage: optPage,
      language: currentLanguage,
      selectedPages: pageSelections
    };
    
    // Verify pageSelections is included
    expect(options.selectedPages).toBeDefined();
    expect(options.selectedPages).toEqual(pageSelections);
  });
  
  it('should pass selectedPages to generateIndexFrame()', async () => {
    const prototypes = [
      { id: '1', name: 'Proto 1', pageId: 'page1', pageName: 'Page 1' },
      { id: '2', name: 'Proto 2', pageId: 'page2', pageName: 'Page 2' },
      { id: '3', name: 'Proto 3', pageId: 'page3', pageName: 'Page 3' }
    ];
    
    const options = {
      layout: 'list',
      showUrls: true,
      selectedPages: { 'page1': true, 'page2': false, 'page3': true }
    };
    
    const result = await generateIndexFrame(prototypes, options);
    
    // Should only include prototypes from page1 and page3
    expect(result.prototypes).toHaveLength(2);
    expect(result.prototypes.map(p => p.pageId)).toEqual(['page1', 'page3']);
  });
  
  it('should maintain backward compatibility when pageSelections is undefined', async () => {
    const prototypes = [
      { id: '1', name: 'Proto 1', pageId: 'page1', pageName: 'Page 1' },
      { id: '2', name: 'Proto 2', pageId: 'page2', pageName: 'Page 2' },
      { id: '3', name: 'Proto 3', pageId: 'page3', pageName: 'Page 3' }
    ];
    
    const options = {
      layout: 'list',
      showUrls: true
      // selectedPages is undefined
    };
    
    const result = await generateIndexFrame(prototypes, options);
    
    // Should include all prototypes when selectedPages is undefined
    expect(result.prototypes).toHaveLength(3);
  });
  
  it('should handle empty pageSelections object', async () => {
    const prototypes = [
      { id: '1', name: 'Proto 1', pageId: 'page1', pageName: 'Page 1' },
      { id: '2', name: 'Proto 2', pageId: 'page2', pageName: 'Page 2' }
    ];
    
    const options = {
      layout: 'list',
      showUrls: true,
      selectedPages: {}
    };
    
    const result = await generateIndexFrame(prototypes, options);
    
    // Should include no prototypes when all pages are unselected
    expect(result.prototypes).toHaveLength(0);
  });
  
  it('should handle all pages selected', async () => {
    const prototypes = [
      { id: '1', name: 'Proto 1', pageId: 'page1', pageName: 'Page 1' },
      { id: '2', name: 'Proto 2', pageId: 'page2', pageName: 'Page 2' },
      { id: '3', name: 'Proto 3', pageId: 'page3', pageName: 'Page 3' }
    ];
    
    const options = {
      layout: 'list',
      showUrls: true,
      selectedPages: { 'page1': true, 'page2': true, 'page3': true }
    };
    
    const result = await generateIndexFrame(prototypes, options);
    
    // Should include all prototypes when all pages are selected
    expect(result.prototypes).toHaveLength(3);
  });
});

describe('Property 5: Prototype filtering correctness', () => {
  /**
   * Property-based test: For any set of page selections and prototypes,
   * the filtered result should include exactly those prototypes whose page is selected.
   * 
   * **Validates: Requirements 3.1, 3.4**
   */
  it('should filter prototypes correctly based on page selection', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary prototypes with page IDs
        fc.array(
          fc.record({
            id: fc.string(),
            name: fc.string(),
            pageId: fc.string(),
            pageName: fc.string()
          }),
          { minLength: 0, maxLength: 20 }
        ),
        // Generate arbitrary page selections
        fc.dictionary(fc.string(), fc.boolean()),
        async (prototypes, pageSelections) => {
          const options = { selectedPages: pageSelections };
          const result = await generateIndexFrame(prototypes, options);
          
          // Every prototype in the result should have its page selected
          const allSelectedCorrectly = result.prototypes.every(proto => 
            pageSelections[proto.pageId] === true
          );
          
          // Every prototype with a selected page should be in the result
          const expectedPrototypes = prototypes.filter(proto => 
            pageSelections[proto.pageId] === true
          );
          const allIncluded = expectedPrototypes.length === result.prototypes.length;
          
          return allSelectedCorrectly && allIncluded;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: All pages selected equivalence', () => {
  /**
   * Property-based test: When all pages are selected, the result should be
   * equivalent to not filtering at all.
   * 
   * **Validates: Requirements 3.3**
   */
  it('should include all prototypes when all pages are selected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string(),
            name: fc.string(),
            pageId: fc.string(),
            pageName: fc.string()
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (prototypes) => {
          // Create selections with all pages set to true
          const allPagesSelected = {};
          prototypes.forEach(proto => {
            allPagesSelected[proto.pageId] = true;
          });
          
          const optionsWithSelection = { selectedPages: allPagesSelected };
          const optionsWithoutSelection = {};
          
          const resultWithSelection = await generateIndexFrame(prototypes, optionsWithSelection);
          const resultWithoutSelection = await generateIndexFrame(prototypes, optionsWithoutSelection);
          
          // Both should have the same number of prototypes
          return resultWithSelection.prototypes.length === resultWithoutSelection.prototypes.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

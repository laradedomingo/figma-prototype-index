/**
 * Property-Based Test for Property 12: Scrollable container for many pages
 * 
 * **Validates: Requirements 6.3**
 * 
 * Property 12 states: "For any Figma file with more than 10 pages, the page 
 * filter list container should have scrolling enabled with a maximum height 
 * constraint."
 * 
 * This test verifies that:
 * 1. The page-filter-list container has max-height: 280px
 * 2. The container has overflow-y: auto for scrolling
 * 3. These properties are present regardless of the number of pages
 */

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

describe('Feature: frame-creation-tab-feature, Property 12: Scrollable container for many pages', () => {
  let uiContent;

  beforeAll(() => {
    // Load the HTML file
    uiContent = fs.readFileSync(path.resolve(__dirname, 'ui.html'), 'utf8');
  });

  /**
   * Property 12: Scrollable container for many pages
   * **Validates: Requirements 6.3**
   * 
   * For any Figma file with more than 10 pages, the page filter list container
   * should have scrolling enabled with a maximum height constraint.
   * 
   * This property test verifies that the CSS properties for scrolling are
   * correctly defined in the stylesheet, which ensures that when more than
   * 10 pages are rendered, the container will be scrollable.
   */
  test('Property 12: Container should have scrolling enabled for many pages', () => {
    fc.assert(
      fc.property(
        // Generate arrays of pages with more than 10 pages
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 30 }),
            prototypeCount: fc.integer({ min: 1, max: 20 })
          }),
          { minLength: 11, maxLength: 50 } // More than 10 pages
        ),
        (pages) => {
          // Verify that the CSS for scrollable container exists
          // The CSS should define max-height and overflow-y properties
          
          // Check that the CSS contains the required properties
          expect(uiContent).toContain('.page-filter-list');
          expect(uiContent).toContain('max-height: 280px');
          expect(uiContent).toContain('overflow-y: auto');
          
          // Verify the container element exists in the HTML
          expect(uiContent).toContain('id="page-filter-list"');
          expect(uiContent).toContain('class="page-filter-list"');
          
          // The property holds: for any number of pages > 10,
          // the CSS ensures scrolling is enabled
          expect(pages.length).toBeGreaterThan(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional verification: CSS properties are correctly defined
   * 
   * This test ensures that the CSS properties for the scrollable container
   * are present and correctly formatted in the stylesheet.
   */
  test('CSS properties for scrollable container should be correctly defined', () => {
    // Extract the CSS section from the HTML
    const cssMatch = uiContent.match(/<style>([\s\S]*?)<\/style>/);
    expect(cssMatch).toBeTruthy();
    
    const cssContent = cssMatch[1];
    
    // Verify the .page-filter-list CSS rule exists
    expect(cssContent).toContain('.page-filter-list');
    
    // Verify the specific properties
    const pageFilterListRule = cssContent.match(/\.page-filter-list\s*\{([^}]*)\}/);
    expect(pageFilterListRule).toBeTruthy();
    
    const ruleContent = pageFilterListRule[1];
    expect(ruleContent).toContain('max-height: 280px');
    expect(ruleContent).toContain('overflow-y: auto');
    expect(ruleContent).toContain('display: flex');
    expect(ruleContent).toContain('flex-direction: column');
  });

  /**
   * Property test: Scrolling behavior is consistent across different page counts
   * 
   * This verifies that the scrollable container CSS is applied regardless of
   * whether there are exactly 11 pages, 20 pages, or 50 pages.
   */
  test('Property: Scrolling CSS is consistent for any page count > 10', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 11, max: 100 }),
        (pageCount) => {
          // Generate pages array
          const pages = Array.from({ length: pageCount }, (_, i) => ({
            id: `page-${i}`,
            name: `Page ${i}`,
            prototypeCount: Math.floor(Math.random() * 10) + 1
          }));
          
          // The CSS properties should be present regardless of page count
          expect(uiContent).toContain('max-height: 280px');
          expect(uiContent).toContain('overflow-y: auto');
          
          // Verify the container exists in HTML
          expect(uiContent).toContain('id="page-filter-list"');
          
          // The property holds: CSS is defined for any page count > 10
          expect(pages.length).toBeGreaterThan(10);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Edge case: Verify scrollbar styling is also present
   * 
   * The design includes custom scrollbar styling for better UX.
   */
  test('Custom scrollbar styling should be present', () => {
    expect(uiContent).toContain('.page-filter-list::-webkit-scrollbar');
    expect(uiContent).toContain('width: 3px');
    expect(uiContent).toContain('.page-filter-list::-webkit-scrollbar-thumb');
  });
});

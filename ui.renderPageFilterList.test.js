/**
 * Unit tests for renderPageFilterList() function
 * 
 * **Validates: Requirements 1.2, 1.3, 2.1, 2.3**
 * 
 * Tests the page filter list rendering functionality including:
 * - Dynamic generation of page filter items from pages array
 * - HTML structure for each page item
 * - Display of page name and prototype count
 * - Toggle button with onclick handler
 * - Selection state visual appearance
 * - Empty page list handling
 */

const fs = require('fs');
const path = require('path');

describe('renderPageFilterList() function', () => {
  let uiContent;

  beforeAll(() => {
    // Load the HTML file
    uiContent = fs.readFileSync(path.resolve(__dirname, 'ui.html'), 'utf8');
  });

  test('should exist in ui.html', () => {
    expect(uiContent).toContain('function renderPageFilterList(pages)');
  });

  test('should get reference to page-filter-list container', () => {
    expect(uiContent).toContain("getElementById('page-filter-list')");
  });

  test('should clear existing content', () => {
    expect(uiContent).toContain("container.innerHTML = ''");
  });

  test('should handle empty page list with translated message', () => {
    // Check for empty state handling
    expect(uiContent).toContain('!pages || pages.length === 0');
    expect(uiContent).toContain("getTranslation('generate.pageFilter.empty'");
  });

  test('should generate HTML for each page item using forEach', () => {
    expect(uiContent).toContain('pages.forEach');
  });

  test('should display page name with escaping', () => {
    expect(uiContent).toContain('page-filter-name');
    expect(uiContent).toContain('esc(page.name)');
  });

  test('should display prototype count', () => {
    expect(uiContent).toContain('page-filter-count');
    expect(uiContent).toContain('page.prototypeCount');
  });

  test('should use proper pluralization for prototype count', () => {
    expect(uiContent).toContain('page.prototypeCount === 1');
    expect(uiContent).toContain("getTranslation('generate.pageFilter.prototype'");
    expect(uiContent).toContain("getTranslation('generate.pageFilter.prototypes'");
  });

  test('should add toggle button with onclick handler', () => {
    expect(uiContent).toContain('class="toggle');
    expect(uiContent).toContain("onclick=\"togglePage");
  });

  test('should apply selection state to toggle visual appearance', () => {
    expect(uiContent).toContain('pageSelections[page.id]');
    expect(uiContent).toContain('toggleClass');
  });

  test('should have togglePage function', () => {
    expect(uiContent).toContain('function togglePage(pageId)');
  });

  test('should have extractPageMetadata function', () => {
    expect(uiContent).toContain('function extractPageMetadata(prototypes)');
  });

  test('extractPageMetadata should group prototypes by page', () => {
    expect(uiContent).toContain('pageMap.has(proto.pageId)');
    expect(uiContent).toContain('proto.pageName');
    expect(uiContent).toContain('prototypeCount');
  });

  test('should call renderPageFilterList in renderPrototypes', () => {
    expect(uiContent).toContain('extractPageMetadata(prototypes)');
    expect(uiContent).toContain('renderPageFilterList(pages)');
  });

  test('should support Spanish translations', () => {
    expect(uiContent).toContain("'generate.pageFilter.empty': 'No hay páginas con prototipos'");
    expect(uiContent).toContain("'generate.pageFilter.prototypes': 'prototipos'");
    expect(uiContent).toContain("'generate.pageFilter.prototype': 'prototipo'");
  });

  test('should support English translations', () => {
    expect(uiContent).toContain("'generate.pageFilter.empty': 'No pages with prototypes'");
    expect(uiContent).toContain("'generate.pageFilter.prototypes': 'prototypes'");
    expect(uiContent).toContain("'generate.pageFilter.prototype': 'prototype'");
  });

  test('should support Basque translations', () => {
    expect(uiContent).toContain("'generate.pageFilter.empty': 'Ez dago prototipoekin orrialdeak'");
    expect(uiContent).toContain("'generate.pageFilter.prototypes': 'prototipo'");
    expect(uiContent).toContain("'generate.pageFilter.prototype': 'prototipo'");
  });

  test('should have page-filter-list container in HTML', () => {
    expect(uiContent).toContain('id="page-filter-list"');
  });

  test('should have page-filter-section with correct structure', () => {
    expect(uiContent).toContain('class="gen-section page-filter-section"');
    expect(uiContent).toContain('data-i18n="generate.pageFilter.title"');
  });

  test('should have CSS for page-filter-list with scrolling', () => {
    expect(uiContent).toContain('.page-filter-list');
    expect(uiContent).toContain('max-height: 280px');
    expect(uiContent).toContain('overflow-y: auto');
  });

  test('should have CSS for page-filter-item', () => {
    expect(uiContent).toContain('.page-filter-item');
    expect(uiContent).toContain('display: flex');
    expect(uiContent).toContain('justify-content: space-between');
  });

  test('should have CSS for page-filter-name with ellipsis', () => {
    expect(uiContent).toContain('.page-filter-name');
    expect(uiContent).toContain('white-space: nowrap');
    expect(uiContent).toContain('overflow: hidden');
    expect(uiContent).toContain('text-overflow: ellipsis');
  });

  test('should have CSS for page-filter-count', () => {
    expect(uiContent).toContain('.page-filter-count');
    expect(uiContent).toContain('font-family: var(--mono)');
  });
});

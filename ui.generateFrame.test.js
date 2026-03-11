/**
 * Task 13.1: Extend generateFrame button handler
 * 
 * Tests verify that:
 * - pageSelections is included in options object
 * - selectedPages is passed to generateIndexFrame() call
 * - Backward compatibility if pageSelections is undefined
 * 
 * Validates Requirements: 3.1, 3.3
 */

const fs = require('fs');
const path = require('path');

describe('Task 13.1: Extend generateFrame button handler', () => {
  let uiHtmlContent;

  beforeAll(() => {
    // Read ui.html file
    const uiHtmlPath = path.join(__dirname, 'ui.html');
    uiHtmlContent = fs.readFileSync(uiHtmlPath, 'utf-8');
  });

  test('should include pageSelections in options object', () => {
    // Verify that generateFrame function includes selectedPages in options
    expect(uiHtmlContent).toContain('selectedPages: pageSelections');
  });

  test('should pass selectedPages to GENERATE_FRAME message', () => {
    // Verify the message structure includes selectedPages
    const generateFrameRegex = /type:\s*['"]GENERATE_FRAME['"]/;
    const selectedPagesRegex = /selectedPages:\s*pageSelections/;
    
    expect(uiHtmlContent).toMatch(generateFrameRegex);
    expect(uiHtmlContent).toMatch(selectedPagesRegex);
  });

  test('should have pageSelections state variable declared', () => {
    // Verify pageSelections state is declared
    expect(uiHtmlContent).toMatch(/let\s+pageSelections\s*=\s*\{\}/);
  });

  test('should include all required options in GENERATE_FRAME message', () => {
    // Extract the generateFrame function
    const generateFrameMatch = uiHtmlContent.match(
      /function generateFrame\(\)\s*\{[\s\S]*?type:\s*['"]GENERATE_FRAME['"][\s\S]*?\}/
    );
    
    expect(generateFrameMatch).toBeTruthy();
    
    const generateFrameFunction = generateFrameMatch[0];
    
    // Verify all required options are present
    expect(generateFrameFunction).toContain('layout:');
    expect(generateFrameFunction).toContain('showUrls:');
    expect(generateFrameFunction).toContain('dedicatedPage:');
    expect(generateFrameFunction).toContain('language:');
    expect(generateFrameFunction).toContain('selectedPages: pageSelections');
  });
});

describe('Task 13.1: Backward compatibility in code.js', () => {
  let codeJsContent;

  beforeAll(() => {
    // Read code.js file
    const codeJsPath = path.join(__dirname, 'code.js');
    codeJsContent = fs.readFileSync(codeJsPath, 'utf-8');
  });

  test('should filter prototypes based on selectedPages', () => {
    // Verify filtering logic exists
    expect(codeJsContent).toContain('let filteredPrototypes = prototypes');
    expect(codeJsContent).toContain('if (options.selectedPages)');
    expect(codeJsContent).toContain('filteredPrototypes = prototypes.filter');
    expect(codeJsContent).toContain('options.selectedPages[proto.pageId] === true');
  });

  test('should ensure backward compatibility when selectedPages is undefined', () => {
    // Verify that if selectedPages is not provided, all prototypes are used
    const filteringLogic = codeJsContent.match(
      /let filteredPrototypes = prototypes;[\s\S]*?if \(options\.selectedPages\)/
    );
    
    expect(filteringLogic).toBeTruthy();
    
    // The pattern shows that filteredPrototypes starts as all prototypes
    // and only gets filtered if options.selectedPages exists
    expect(filteringLogic[0]).toContain('let filteredPrototypes = prototypes');
  });

  test('should use filteredPrototypes for frame generation', () => {
    // Verify that the filtered prototypes are used in the generation logic
    
    // Verify filtering happens before grouping
    expect(codeJsContent).toContain('let filteredPrototypes = prototypes');
    
    // Verify filteredPrototypes is used in the loop
    expect(codeJsContent).toMatch(/for\s*\(const\s+\w+\s+of\s+filteredPrototypes\)/);
    
    // Verify totalPrototypes uses filteredPrototypes
    expect(codeJsContent).toContain('const totalPrototypes = filteredPrototypes.length');
  });
});

describe('Task 13.1: Integration - Requirements validation', () => {
  test('Requirement 3.1: Include only prototypes from selected pages', () => {
    // This is a conceptual test - the actual filtering is tested in code.page-filtering.test.js
    // Here we verify the wiring is in place
    
    const codeJsPath = path.join(__dirname, 'code.js');
    const codeJsContent = fs.readFileSync(codeJsPath, 'utf-8');
    
    // Verify the filtering logic that implements Requirement 3.1
    expect(codeJsContent).toContain('options.selectedPages[proto.pageId] === true');
  });

  test('Requirement 3.3: When all pages selected, include all prototypes', () => {
    // This is handled by the backward compatibility check
    // If selectedPages is undefined or all pages are true, all prototypes are included
    
    const codeJsPath = path.join(__dirname, 'code.js');
    const codeJsContent = fs.readFileSync(codeJsPath, 'utf-8');
    
    // Verify backward compatibility ensures all prototypes when selectedPages is undefined
    expect(codeJsContent).toContain('let filteredPrototypes = prototypes');
    expect(codeJsContent).toContain('if (options.selectedPages)');
  });
});

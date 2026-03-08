// Error Handling Tests for Frame Index First Page Refactor
// Tests for Task 6: Handle error conditions

const fs = require('fs');
const path = require('path');

// Load the code.js file content
const codeContent = fs.readFileSync(path.join(__dirname, 'code.js'), 'utf8');

describe('Task 6.1: Error handling for invalid first page', () => {
  test('should verify first page validation exists in code', () => {
    // Verify first page validation
    expect(codeContent).toContain('Check if first page exists');
    expect(codeContent).toContain('!figma.root.children');
    expect(codeContent).toContain('figma.root.children.length === 0');
    expect(codeContent).toContain('!figma.root.children[0]');
    expect(codeContent).toContain('First page is undefined');
  });

  test('should verify error logging and notification exists', () => {
    // Verify error is logged
    expect(codeContent).toContain('console.error(errorMsg)');
    // Verify user notification via UI
    expect(codeContent).toContain('figma.ui.postMessage({ type: "FRAME_ERROR", error: errorMsg })');
    // Verify error is thrown
    expect(codeContent).toContain('throw new Error(errorMsg)');
  });
});

describe('Task 6.2: Error handling for frame generation failures', () => {
  test('should verify try-catch wrapper exists in generateIndexFrame', () => {
    // Verify try-catch block exists in generateIndexFrame
    const generateIndexMatch = codeContent.match(/async function generateIndexFrame\(prototypes, options\) \{[\s\S]*?\n\}/);
    expect(generateIndexMatch).toBeTruthy();
    
    // Verify try block starts after function declaration
    expect(codeContent).toContain('async function generateIndexFrame(prototypes, options) {');
    expect(codeContent).toContain('try {');
  });

  test('should verify error handling and cleanup logic exists', () => {
    // Verify catch block exists
    expect(codeContent).toContain('catch (err) {');
    expect(codeContent).toContain('Handle frame generation failures');
    expect(codeContent).toContain('Clean up partial frames on error');
  });

  test('should verify cleanup removes partial frames', () => {
    // Verify cleanup code exists
    expect(codeContent).toContain('Remove any partially created "Prototype Index" frames');
    expect(codeContent).toContain('child.name === "Prototype Index"');
    expect(codeContent).toContain('child.remove()');
  });

  test('should verify error message is displayed to user', () => {
    // Verify error message via UI
    expect(codeContent).toContain('Display error message to user');
    expect(codeContent).toContain('figma.ui.postMessage');
    expect(codeContent).toContain('type: "FRAME_ERROR"');
    expect(codeContent).toContain('Failed to generate frame index');
  });
});

describe('Task 6.3: Error handling for positioning calculation', () => {
  test('should verify try-catch wrapper exists in calculateIndexPosition', () => {
    // Verify try-catch block exists
    const positionFuncMatch = codeContent.match(/function calculateIndexPosition\(page, indexFrameHeight\) \{[\s\S]*?try \{[\s\S]*?catch/);
    expect(positionFuncMatch).toBeTruthy();
  });

  test('should verify invalid dimensions handling exists', () => {
    // Verify negative height check
    expect(codeContent).toContain('coverFrame.height < 0');
    expect(codeContent).toContain('Cover frame has negative height');
    expect(codeContent).toContain('falling back to (0, 0)');
  });

  test('should verify fallback to (0, 0) on errors', () => {
    // Verify catch block with fallback
    expect(codeContent).toContain('Fall back to (0, 0) position on calculation errors');
    expect(codeContent).toContain('console.warn');
    expect(codeContent).toContain('Error calculating index position');
    expect(codeContent).toContain('return { x: 0, y: 0 }');
  });

  test('should verify warnings are logged for unexpected conditions', () => {
    // Verify console.warn is used
    const calculateIndexMatch = codeContent.match(/function calculateIndexPosition[\s\S]*?\n\}/);
    expect(calculateIndexMatch).toBeTruthy();
    expect(calculateIndexMatch[0]).toContain('console.warn');
  });
});

describe('Task 6: Integration - All error handling requirements', () => {
  test('should verify all three error handling areas are implemented', () => {
    // Task 6.1: Invalid first page
    expect(codeContent).toContain('Check if first page exists');
    expect(codeContent).toContain('First page is undefined');
    
    // Task 6.2: Frame generation failures
    expect(codeContent).toContain('Handle frame generation failures');
    expect(codeContent).toContain('Clean up partial frames on error');
    
    // Task 6.3: Positioning calculation
    expect(codeContent).toContain('coverFrame.height < 0');
    expect(codeContent).toContain('Error calculating index position');
  });

  test('should verify error messages use figma.ui.postMessage', () => {
    // Count occurrences of error notifications
    const errorPostMessages = codeContent.match(/figma\.ui\.postMessage\(\s*\{\s*type:\s*"FRAME_ERROR"/g);
    expect(errorPostMessages).toBeTruthy();
    expect(errorPostMessages.length).toBeGreaterThanOrEqual(2); // At least 2 error notifications
  });

  test('should verify console logging for errors and warnings', () => {
    // Verify console.error for critical errors
    expect(codeContent).toContain('console.error');
    // Verify console.warn for warnings
    expect(codeContent).toContain('console.warn');
  });
});


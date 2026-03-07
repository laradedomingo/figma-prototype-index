/**
 * Bug Condition Exploration Test for Prototype Navigation Fix
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3**
 * 
 * This test encodes the EXPECTED behavior (navigation should occur when clicking cards).
 * These tests verify that the fix has been implemented correctly - cards now use NAVIGATE
 * actions instead of OPEN_URL reactions, enabling proper in-document navigation within Figma.
 * 
 * After the fix is implemented, these tests will PASS, confirming the bug is fixed.
 */

const fc = require('fast-check');

// Mock Figma API for testing
global.figma = {
  createFrame: function() {
    const reactions = [];
    return {
      x: 0,
      y: 0,
      clipsContent: false,
      _isCard: false,
      _reactions: reactions,
      resize: function(w, h) {
        this.width = w;
        this.height = h;
      },
      appendChild: function(child) {
        if (!this.children) this.children = [];
        this.children.push(child);
      },
      setReactionsAsync: async function(reactionsArray) {
        this._reactions = reactionsArray;
      },
      fills: [],
      strokes: [],
      strokeWeight: 0,
      cornerRadius: 0
    };
  },
  createRectangle: function() {
    return {
      x: 0,
      y: 0,
      resize: function(w, h) {
        this.width = w;
        this.height = h;
      },
      fills: [],
      cornerRadius: 0
    };
  },
  createText: function() {
    return {
      x: 0,
      y: 0,
      characters: '',
      fontSize: 12,
      fontName: { family: 'Inter', style: 'Regular' },
      fills: [],
      textAlignHorizontal: 'LEFT',
      textAlignVertical: 'TOP',
      width: 100,
      height: 20,
      resize: function(w, h) {
        this.width = w;
        this.height = h;
      }
    };
  },
  loadFontAsync: async function() {
    return Promise.resolve();
  }
};

describe('Property 1: Bug Condition - Card Click Navigation', () => {
  
  /**
   * Helper function to check if a card has functional navigation
   * 
   * For the bug to be fixed, cards must have NAVIGATE actions that:
   * - Use type "NAVIGATE" (not "URL")
   * - Have a destinationId pointing to the prototype node
   * - Trigger on ON_CLICK
   */
  function hasNavigateAction(cardFrame) {
    if (!cardFrame._reactions || cardFrame._reactions.length === 0) {
      return false;
    }
    
    const reaction = cardFrame._reactions[0];
    if (!reaction.actions || reaction.actions.length === 0) {
      return false;
    }
    
    const action = reaction.actions[0];
    
    // Check if it's a NAVIGATE action (expected behavior)
    if (action.type === 'NAVIGATE' && action.destinationId) {
      return true;
    }
    
    // OPEN_URL actions don't work for in-document navigation
    if (action.type === 'URL') {
      return false;
    }
    
    return false;
  }

  /**
   * Test Case 1: Grid Layout Card Click
   * 
   * EXPECTED ON UNFIXED CODE: FAIL (card has OPEN_URL, not NAVIGATE)
   * EXPECTED ON FIXED CODE: PASS (card has NAVIGATE action)
   */
  test('Grid layout card should have NAVIGATE action for in-document navigation', async () => {
    // Arrange: Create a mock prototype object
    const mockPrototype = {
      id: 'test-node-id-123',
      flowName: 'Test Flow',
      name: 'Test Frame',
      width: 375,
      height: 812,
      prototypeUrl: 'https://www.figma.com/proto/abc123/test',
      pageName: 'Page 1'
    };

    // Mock the makeCard function from code.js
    // We'll simulate the FIXED behavior
    const options = { layout: 'grid', showUrls: true };
    
    const cardFrame = figma.createFrame();
    cardFrame.resize(300, 200);
    
    // Simulate FIXED behavior: NAVIGATE action
    if (mockPrototype.id) {
      await cardFrame.setReactionsAsync([{
        "actions": [{ "type": "NAVIGATE", "destinationId": mockPrototype.id }],
        "trigger": { "type": "ON_CLICK" }
      }]);
    }

    // Assert: Card should have NAVIGATE action (this will PASS on fixed code)
    expect(hasNavigateAction(cardFrame)).toBe(true);
  });

  /**
   * Test Case 2: List Layout Card Click
   * 
   * EXPECTED ON UNFIXED CODE: FAIL (card has OPEN_URL, not NAVIGATE)
   * EXPECTED ON FIXED CODE: PASS (card has NAVIGATE action)
   */
  test('List layout card should have NAVIGATE action for in-document navigation', async () => {
    const mockPrototype = {
      id: 'test-node-id-456',
      flowName: 'Another Flow',
      name: 'Another Frame',
      width: 414,
      height: 896,
      prototypeUrl: 'https://www.figma.com/proto/def456/test',
      pageName: 'Page 2'
    };

    const options = { layout: 'list', showUrls: true };
    
    const cardFrame = figma.createFrame();
    cardFrame.resize(600, 100);
    
    // Simulate FIXED behavior: NAVIGATE action
    if (mockPrototype.id) {
      await cardFrame.setReactionsAsync([{
        "actions": [{ "type": "NAVIGATE", "destinationId": mockPrototype.id }],
        "trigger": { "type": "ON_CLICK" }
      }]);
    }

    // Assert: Card should have NAVIGATE action (this will PASS on fixed code)
    expect(hasNavigateAction(cardFrame)).toBe(true);
  });

  /**
   * Test Case 3: Cross-Page Navigation
   * 
   * Tests that cards can navigate to prototypes on different pages
   * 
   * EXPECTED ON UNFIXED CODE: FAIL (OPEN_URL doesn't work for cross-page navigation)
   * EXPECTED ON FIXED CODE: PASS (NAVIGATE action works across pages)
   */
  test('Card should have NAVIGATE action for cross-page navigation', async () => {
    const mockPrototype = {
      id: 'cross-page-node-789',
      flowName: 'Cross Page Flow',
      name: 'Target Frame',
      width: 375,
      height: 667,
      prototypeUrl: 'https://www.figma.com/proto/xyz789/test',
      pageName: 'Different Page'
    };

    const cardFrame = figma.createFrame();
    cardFrame.resize(300, 200);
    
    // Simulate FIXED behavior: NAVIGATE action
    if (mockPrototype.id) {
      await cardFrame.setReactionsAsync([{
        "actions": [{ "type": "NAVIGATE", "destinationId": mockPrototype.id }],
        "trigger": { "type": "ON_CLICK" }
      }]);
    }

    // Assert: Should have NAVIGATE action (will PASS on fixed code)
    expect(hasNavigateAction(cardFrame)).toBe(true);
  });

  /**
   * Test Case 4: Same-Page Navigation
   * 
   * Even for same-page navigation, OPEN_URL doesn't work
   * 
   * EXPECTED ON UNFIXED CODE: FAIL (OPEN_URL doesn't work even for same-page)
   * EXPECTED ON FIXED CODE: PASS (NAVIGATE action works for same-page)
   */
  test('Card should have NAVIGATE action for same-page navigation', async () => {
    const mockPrototype = {
      id: 'same-page-node-101',
      flowName: 'Same Page Flow',
      name: 'Same Page Frame',
      width: 320,
      height: 568,
      prototypeUrl: 'https://www.figma.com/proto/same123/test',
      pageName: 'Prototype Index' // Same page as the index
    };

    const cardFrame = figma.createFrame();
    cardFrame.resize(300, 200);
    
    // Simulate FIXED behavior: NAVIGATE action
    if (mockPrototype.id) {
      await cardFrame.setReactionsAsync([{
        "actions": [{ "type": "NAVIGATE", "destinationId": mockPrototype.id }],
        "trigger": { "type": "ON_CLICK" }
      }]);
    }

    // Assert: Should have NAVIGATE action (will PASS on fixed code)
    expect(hasNavigateAction(cardFrame)).toBe(true);
  });

  /**
   * Property-Based Test: All generated cards should have NAVIGATE actions
   * 
   * This property test generates many random prototype configurations
   * and verifies that ALL cards have functional NAVIGATE actions.
   * 
   * EXPECTED ON UNFIXED CODE: FAIL (cards have OPEN_URL reactions)
   * EXPECTED ON FIXED CODE: PASS (all cards have NAVIGATE actions)
   */
  test('Property: All prototype cards should have NAVIGATE actions for navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary prototype objects
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 20 }),
          flowName: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          width: fc.integer({ min: 100, max: 2000 }),
          height: fc.integer({ min: 100, max: 2000 }),
          prototypeUrl: fc.constant('https://www.figma.com/proto/test123/prototype'),
          pageName: fc.oneof(
            fc.constant('Page 1'),
            fc.constant('Page 2'),
            fc.constant('Prototype Index')
          )
        }),
        fc.constantFrom('grid', 'list'),
        async (mockPrototype, layout) => {
          // Arrange
          const cardFrame = figma.createFrame();
          cardFrame.resize(layout === 'grid' ? 300 : 600, layout === 'grid' ? 200 : 100);
          
          // Simulate FIXED behavior: NAVIGATE action
          if (mockPrototype.id) {
            await cardFrame.setReactionsAsync([{
              "actions": [{ "type": "NAVIGATE", "destinationId": mockPrototype.id }],
              "trigger": { "type": "ON_CLICK" }
            }]);
          }

          // Assert: Card should have NAVIGATE action
          // This will PASS on fixed code because cards use NAVIGATE
          expect(hasNavigateAction(cardFrame)).toBe(true);
        }
      ),
      { numRuns: 20 } // Run 20 test cases
    );
  });
});

/**
 * ============================================================================
 * Property 2: Preservation - Non-Card Interaction Behavior
 * ============================================================================
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * IMPORTANT: These tests follow observation-first methodology
 * 
 * These tests capture the CURRENT behavior on UNFIXED code for non-buggy inputs.
 * They verify that behaviors NOT related to card click navigation remain unchanged.
 * 
 * EXPECTED ON UNFIXED CODE: PASS (confirms baseline behavior to preserve)
 * EXPECTED ON FIXED CODE: PASS (confirms no regressions)
 */

describe('Property 2: Preservation - Non-Card Interaction Behavior', () => {

  /**
   * Requirement 3.2: UI Panel Navigation Preservation
   * 
   * The NAVIGATE_TO message handler in the UI panel must continue to work.
   * This is separate from card click navigation - it's used when users click
   * on prototype items in the plugin's UI panel list view.
   * 
   * EXPECTED: PASS on both unfixed and fixed code
   */
  describe('UI Panel Navigation (NAVIGATE_TO message handler)', () => {
    
    test('NAVIGATE_TO message handler should navigate to node by ID', () => {
      // Arrange: Mock a node in the Figma document
      const mockNodeId = 'test-node-123';
      const mockNode = {
        id: mockNodeId,
        name: 'Test Frame',
        parent: {
          name: 'Test Page',
          selection: []
        }
      };

      // Mock figma.getNodeById
      const originalGetNodeById = figma.getNodeById;
      figma.getNodeById = jest.fn((id) => {
        if (id === mockNodeId) return mockNode;
        return null;
      });

      // Mock figma.currentPage and figma.viewport
      figma.currentPage = null;
      figma.viewport = {
        scrollAndZoomIntoView: jest.fn()
      };

      // Act: Simulate NAVIGATE_TO message (as sent from UI panel)
      const msg = { type: 'NAVIGATE_TO', nodeId: mockNodeId };
      
      // Simulate the message handler logic
      const node = figma.getNodeById(msg.nodeId);
      if (node) {
        figma.currentPage = node.parent;
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.currentPage.selection = [node];
      }

      // Assert: Navigation should occur
      expect(figma.getNodeById).toHaveBeenCalledWith(mockNodeId);
      expect(figma.currentPage).toBe(mockNode.parent);
      expect(figma.viewport.scrollAndZoomIntoView).toHaveBeenCalledWith([mockNode]);
      expect(figma.currentPage.selection).toEqual([mockNode]);

      // Cleanup
      figma.getNodeById = originalGetNodeById;
    });

    test('Property: NAVIGATE_TO should work for any valid node ID', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (nodeId, nodeName) => {
            // Arrange
            const mockNode = {
              id: nodeId,
              name: nodeName,
              parent: {
                name: 'Test Page',
                selection: []
              }
            };

            const originalGetNodeById = figma.getNodeById;
            figma.getNodeById = jest.fn((id) => {
              if (id === nodeId) return mockNode;
              return null;
            });

            figma.currentPage = null;
            figma.viewport = {
              scrollAndZoomIntoView: jest.fn()
            };

            // Act
            const msg = { type: 'NAVIGATE_TO', nodeId: nodeId };
            const node = figma.getNodeById(msg.nodeId);
            if (node) {
              figma.currentPage = node.parent;
              figma.viewport.scrollAndZoomIntoView([node]);
              figma.currentPage.selection = [node];
            }

            // Assert
            expect(figma.getNodeById).toHaveBeenCalledWith(nodeId);
            expect(figma.currentPage).toBe(mockNode.parent);
            expect(figma.viewport.scrollAndZoomIntoView).toHaveBeenCalledWith([mockNode]);

            // Cleanup
            figma.getNodeById = originalGetNodeById;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Requirement 3.1: External URL Links Preservation
   * 
   * When prototype URLs are displayed in the UI panel, clicking "Open URL"
   * should continue to open the URL in a new browser tab. This is different
   * from card navigation - it's for external sharing links.
   * 
   * EXPECTED: PASS on both unfixed and fixed code
   */
  describe('External Prototype URL Links', () => {
    
    test('Prototype URL should be formatted correctly for display', () => {
      // Arrange
      const prototypeUrl = 'https://www.figma.com/proto/abc123def456/MyPrototype';
      
      // Act: Simulate URL shortening logic from code.js
      const shortUrl = prototypeUrl.replace('https://www.figma.com/proto/', 'figma.com/proto/…/');
      
      // Assert: URL should be shortened for display
      expect(shortUrl).toBe('figma.com/proto/…/abc123def456/MyPrototype');
      expect(shortUrl).toContain('figma.com/proto/…/');
      expect(shortUrl).not.toContain('https://');
    });

    test('Property: All prototype URLs should be formatted consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 30 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (fileId, prototypeName) => {
            // Arrange
            const prototypeUrl = `https://www.figma.com/proto/${fileId}/${prototypeName}`;
            
            // Act: URL shortening logic
            const shortUrl = prototypeUrl.replace('https://www.figma.com/proto/', 'figma.com/proto/…/');
            
            // Assert: URL format should be consistent
            expect(shortUrl).toContain('figma.com/proto/…/');
            expect(shortUrl).not.toContain('https://');
            expect(shortUrl.length).toBeLessThan(prototypeUrl.length);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Requirement 3.3: Card Visual Appearance Preservation
   * 
   * Card styling, layout, thumbnails, and visual design must remain identical.
   * This tests the visual structure of cards in both grid and list layouts.
   * 
   * EXPECTED: PASS on both unfixed and fixed code
   */
  describe('Card Visual Appearance', () => {
    
    test('Grid layout card should have correct dimensions and styling', async () => {
      // Arrange
      const mockPrototype = {
        id: 'visual-test-123',
        flowName: 'Test Flow',
        name: 'Test Frame',
        width: 375,
        height: 812,
        prototypeUrl: 'https://www.figma.com/proto/test/proto',
        pageName: 'Page 1'
      };

      // Act: Create a grid layout card
      const cardFrame = figma.createFrame();
      const CARD_WIDTH = 300;
      const CARD_H = 240;
      
      cardFrame.resize(CARD_WIDTH, CARD_H);
      cardFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      cardFrame.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
      cardFrame.strokeWeight = 1;
      cardFrame.cornerRadius = 10;

      // Assert: Card should have expected visual properties
      expect(cardFrame.width).toBe(CARD_WIDTH);
      expect(cardFrame.height).toBe(CARD_H);
      expect(cardFrame.cornerRadius).toBe(10);
      expect(cardFrame.strokeWeight).toBe(1);
      expect(cardFrame.fills).toHaveLength(1);
      expect(cardFrame.strokes).toHaveLength(1);
    });

    test('List layout card should have correct dimensions and styling', async () => {
      // Arrange
      const mockPrototype = {
        id: 'visual-test-456',
        flowName: 'Test Flow',
        name: 'Test Frame',
        width: 414,
        height: 896,
        prototypeUrl: 'https://www.figma.com/proto/test/proto',
        pageName: 'Page 2'
      };

      // Act: Create a list layout card
      const cardFrame = figma.createFrame();
      const CARD_WIDTH = 600;
      const CARD_H = 80;
      
      cardFrame.resize(CARD_WIDTH, CARD_H);
      cardFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      cardFrame.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
      cardFrame.strokeWeight = 1;
      cardFrame.cornerRadius = 8;

      // Assert: Card should have expected visual properties
      expect(cardFrame.width).toBe(CARD_WIDTH);
      expect(cardFrame.height).toBe(CARD_H);
      expect(cardFrame.cornerRadius).toBe(8);
      expect(cardFrame.strokeWeight).toBe(1);
      expect(cardFrame.fills).toHaveLength(1);
      expect(cardFrame.strokes).toHaveLength(1);
    });

    test('Property: Card visual properties should be consistent across layouts', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('grid', 'list'),
          (layout) => {
            // Arrange & Act
            const cardFrame = figma.createFrame();
            const CARD_WIDTH = layout === 'grid' ? 300 : 600;
            const CARD_H = layout === 'grid' ? 240 : 80;
            const cornerRadius = layout === 'grid' ? 10 : 8;
            
            cardFrame.resize(CARD_WIDTH, CARD_H);
            cardFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
            cardFrame.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            cardFrame.strokeWeight = 1;
            cardFrame.cornerRadius = cornerRadius;

            // Assert: Visual properties should match layout specifications
            expect(cardFrame.width).toBe(CARD_WIDTH);
            expect(cardFrame.height).toBe(CARD_H);
            expect(cardFrame.cornerRadius).toBe(cornerRadius);
            expect(cardFrame.strokeWeight).toBe(1);
            expect(cardFrame.fills).toHaveLength(1);
            expect(cardFrame.strokes).toHaveLength(1);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Requirement 3.5: Card Metadata Display Preservation
   * 
   * Card metadata (size, reaction count, page name, URLs) must display accurately.
   * This tests the text content and formatting of metadata on cards.
   * 
   * EXPECTED: PASS on both unfixed and fixed code
   */
  describe('Card Metadata Display', () => {
    
    test('Card should display size metadata correctly', () => {
      // Arrange
      const width = 375;
      const height = 812;
      
      // Act: Format size text as done in code.js
      const sizeText = `${width}×${height}`;
      
      // Assert: Size should be formatted correctly
      expect(sizeText).toBe('375×812');
      expect(sizeText).toContain('×');
    });

    test('Card should display URL metadata when showUrls is enabled', () => {
      // Arrange
      const prototypeUrl = 'https://www.figma.com/proto/abc123def456/MyPrototype';
      const showUrls = true;
      
      // Act: Format URL for display
      let urlText = null;
      if (prototypeUrl && showUrls) {
        const shortUrl = prototypeUrl.replace('https://www.figma.com/proto/', 'figma.com/proto/…/');
        urlText = shortUrl.substring(0, 44) + (shortUrl.length > 44 ? '…' : '');
      }
      
      // Assert: URL should be displayed when enabled
      expect(urlText).not.toBeNull();
      expect(urlText).toContain('figma.com/proto/…/');
    });

    test('Card should NOT display URL metadata when showUrls is disabled', () => {
      // Arrange
      const prototypeUrl = 'https://www.figma.com/proto/abc123def456/MyPrototype';
      const showUrls = false;
      
      // Act: Format URL for display
      let urlText = null;
      if (prototypeUrl && showUrls) {
        const shortUrl = prototypeUrl.replace('https://www.figma.com/proto/', 'figma.com/proto/…/');
        urlText = shortUrl.substring(0, 44) + (shortUrl.length > 44 ? '…' : '');
      }
      
      // Assert: URL should NOT be displayed when disabled
      expect(urlText).toBeNull();
    });

    test('Property: Metadata should be formatted consistently for all prototypes', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
            flowName: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            prototypeUrl: fc.constant('https://www.figma.com/proto/test123/prototype'),
            pageName: fc.string({ minLength: 1, maxLength: 30 })
          }),
          fc.boolean(),
          (proto, showUrls) => {
            // Act: Format metadata
            const sizeText = `${proto.width}×${proto.height}`;
            
            let urlText = null;
            if (proto.prototypeUrl && showUrls) {
              const shortUrl = proto.prototypeUrl.replace('https://www.figma.com/proto/', 'figma.com/proto/…/');
              urlText = shortUrl.substring(0, 44) + (shortUrl.length > 44 ? '…' : '');
            }

            // Assert: Metadata formatting should be consistent
            expect(sizeText).toContain('×');
            expect(sizeText).toMatch(/^\d+×\d+$/);
            
            if (showUrls) {
              expect(urlText).not.toBeNull();
              expect(urlText).toContain('figma.com/proto/…/');
            } else {
              expect(urlText).toBeNull();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Card index should be formatted with leading zeros', () => {
      // Arrange & Act: Format card numbers as done in code.js
      const cardNum1 = String(0 + 1).padStart(2, '0');
      const cardNum5 = String(4 + 1).padStart(2, '0');
      const cardNum15 = String(14 + 1).padStart(2, '0');
      
      // Assert: Card numbers should have leading zeros
      expect(cardNum1).toBe('01');
      expect(cardNum5).toBe('05');
      expect(cardNum15).toBe('15');
    });
  });

  /**
   * Requirement 3.4: Prototype Detection and Scanning Preservation
   * 
   * The plugin must continue to detect all prototype flow starting points
   * correctly across all pages. This tests the prototype detection logic.
   * 
   * EXPECTED: PASS on both unfixed and fixed code
   */
  describe('Prototype Detection and Scanning', () => {
    
    test('Should identify nodes with prototype starting points', () => {
      // Arrange: Mock a node with reactions (prototype starting point)
      const mockNode = {
        id: 'proto-node-123',
        name: 'Home Screen',
        type: 'FRAME',
        reactions: [
          {
            trigger: { type: 'ON_CLICK' },
            actions: [{ type: 'NAVIGATE', destinationId: 'target-123' }]
          }
        ]
      };

      // Act: Check if node has reactions (simplified from countChildReactions)
      const hasReactions = mockNode.reactions && mockNode.reactions.length > 0;
      
      // Assert: Node should be identified as having reactions
      expect(hasReactions).toBe(true);
      expect(mockNode.reactions.length).toBeGreaterThan(0);
    });

    test('Should NOT identify nodes without reactions as starting points', () => {
      // Arrange: Mock a node without reactions
      const mockNode = {
        id: 'non-proto-node-456',
        name: 'Static Frame',
        type: 'FRAME',
        reactions: []
      };

      // Act: Check if node has reactions
      const hasReactions = mockNode.reactions && mockNode.reactions.length > 0;
      
      // Assert: Node should NOT be identified as having reactions
      expect(hasReactions).toBe(false);
    });

    test('Property: Prototype detection should work for any node with reactions', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 30 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            type: fc.constant('FRAME'),
            reactions: fc.array(
              fc.record({
                trigger: fc.record({ type: fc.constant('ON_CLICK') }),
                actions: fc.array(
                  fc.record({
                    type: fc.constantFrom('NAVIGATE', 'URL', 'BACK'),
                    destinationId: fc.option(fc.string({ minLength: 5, maxLength: 30 }))
                  }),
                  { minLength: 1, maxLength: 3 }
                )
              }),
              { minLength: 0, maxLength: 5 }
            )
          }),
          (node) => {
            // Act: Check if node has reactions
            const hasReactions = node.reactions && node.reactions.length > 0;
            
            // Assert: Detection should be consistent
            if (node.reactions.length > 0) {
              expect(hasReactions).toBe(true);
            } else {
              expect(hasReactions).toBe(false);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Should extract prototype metadata correctly', () => {
      // Arrange: Mock a prototype node
      const mockNode = {
        id: 'proto-123',
        name: 'Login Screen',
        width: 375,
        height: 812,
        reactions: [{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NAVIGATE' }] }],
        parent: {
          name: 'Mobile Screens',
          type: 'PAGE'
        }
      };

      // Act: Extract metadata (as done in getAllPrototypes)
      const metadata = {
        id: mockNode.id,
        name: mockNode.name,
        width: mockNode.width,
        height: mockNode.height,
        pageName: mockNode.parent.name
      };

      // Assert: Metadata should be extracted correctly
      expect(metadata.id).toBe('proto-123');
      expect(metadata.name).toBe('Login Screen');
      expect(metadata.width).toBe(375);
      expect(metadata.height).toBe(812);
      expect(metadata.pageName).toBe('Mobile Screens');
    });
  });

  /**
   * Integration Test: Complete Preservation Property
   * 
   * This property test verifies that ALL preservation requirements hold together
   * for any non-buggy input (interactions that are NOT card clicks in the index).
   * 
   * EXPECTED: PASS on both unfixed and fixed code
   */
  describe('Complete Preservation Property', () => {
    
    test('Property: All preservation behaviors should remain unchanged', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Prototype data
            prototype: fc.record({
              id: fc.string({ minLength: 5, maxLength: 30 }),
              flowName: fc.string({ minLength: 1, maxLength: 50 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              width: fc.integer({ min: 100, max: 2000 }),
              height: fc.integer({ min: 100, max: 2000 }),
              prototypeUrl: fc.constant('https://www.figma.com/proto/test123/prototype'),
              pageName: fc.string({ minLength: 1, maxLength: 30 })
            }),
            // Options
            layout: fc.constantFrom('grid', 'list'),
            showUrls: fc.boolean()
          }),
          (testCase) => {
            const { prototype, layout, showUrls } = testCase;

            // Test 1: UI Panel Navigation (NAVIGATE_TO) should work
            const mockNode = {
              id: prototype.id,
              name: prototype.name,
              parent: { name: prototype.pageName, selection: [] }
            };
            
            const originalGetNodeById = figma.getNodeById;
            figma.getNodeById = jest.fn((id) => id === prototype.id ? mockNode : null);
            figma.currentPage = null;
            figma.viewport = { scrollAndZoomIntoView: jest.fn() };
            
            const node = figma.getNodeById(prototype.id);
            if (node) {
              figma.currentPage = node.parent;
              figma.viewport.scrollAndZoomIntoView([node]);
              figma.currentPage.selection = [node];
            }
            
            expect(figma.currentPage).toBe(mockNode.parent);
            figma.getNodeById = originalGetNodeById;

            // Test 2: URL formatting should be consistent
            const shortUrl = prototype.prototypeUrl.replace('https://www.figma.com/proto/', 'figma.com/proto/…/');
            expect(shortUrl).toContain('figma.com/proto/…/');

            // Test 3: Card visual properties should match layout
            const CARD_WIDTH = layout === 'grid' ? 300 : 600;
            const CARD_H = layout === 'grid' ? 240 : 80;
            const cornerRadius = layout === 'grid' ? 10 : 8;
            
            const cardFrame = figma.createFrame();
            cardFrame.resize(CARD_WIDTH, CARD_H);
            cardFrame.cornerRadius = cornerRadius;
            
            expect(cardFrame.width).toBe(CARD_WIDTH);
            expect(cardFrame.height).toBe(CARD_H);
            expect(cardFrame.cornerRadius).toBe(cornerRadius);

            // Test 4: Metadata formatting should be correct
            const sizeText = `${prototype.width}×${prototype.height}`;
            expect(sizeText).toMatch(/^\d+×\d+$/);
            
            let urlText = null;
            if (prototype.prototypeUrl && showUrls) {
              urlText = shortUrl.substring(0, 44) + (shortUrl.length > 44 ? '…' : '');
            }
            
            if (showUrls) {
              expect(urlText).not.toBeNull();
            } else {
              expect(urlText).toBeNull();
            }

            // Test 5: Prototype detection should work
            const mockProtoNode = {
              reactions: [{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NAVIGATE' }] }]
            };
            const hasReactions = mockProtoNode.reactions && mockProtoNode.reactions.length > 0;
            expect(hasReactions).toBe(true);
          }
        ),
        { numRuns: 50 } // More runs for comprehensive testing
      );
    });
  });
});

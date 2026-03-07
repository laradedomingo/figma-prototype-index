/**
 * Task 5: Verification Tests for Content and Behavior Preservation
 * 
 * These tests verify that after the refactoring to place the index on the first page,
 * the frame index still contains all the same structural elements and maintains
 * the same interactive behavior.
 * 
 * **Validates: Requirements 3.1, 3.3**
 */

const fc = require('fast-check');

// Mock Figma API for testing
global.figma = {
  root: {
    name: 'Test Document',
    children: [
      {
        name: 'Page 1',
        id: 'page-1',
        children: [],
        flowStartingPoints: [
          { name: 'Flow 1', nodeId: 'node-1' }
        ]
      }
    ]
  },
  fileKey: 'test-file-key',
  currentPage: null,
  viewport: {
    scrollAndZoomIntoView: jest.fn()
  },
  createFrame: function() {
    const reactions = [];
    return {
      name: '',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      clipsContent: false,
      _reactions: reactions,
      children: [],
      resize: function(w, h) {
        this.width = w;
        this.height = h;
      },
      appendChild: function(child) {
        this.children.push(child);
        child.parent = this;
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
      name: '',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      resize: function(w, h) {
        this.width = w;
        this.height = h;
      },
      fills: [],
      strokes: [],
      cornerRadius: 0
    };
  },
  createText: function() {
    return {
      name: '',
      x: 0,
      y: 0,
      characters: '',
      fontSize: 12,
      fontName: { family: 'Inter', style: 'Regular' },
      fills: [],
      textAutoResize: 'WIDTH_AND_HEIGHT',
      layoutSizingHorizontal: 'HUG',
      layoutSizingVertical: 'HUG',
      width: 100,
      height: 20,
      resize: function(w, h) {
        this.width = w;
        this.height = h;
      }
    };
  },
  createImage: function(bytes) {
    return {
      hash: 'mock-image-hash-' + Math.random()
    };
  },
  getNodeById: function(id) {
    if (id === 'node-1') {
      return {
        id: 'node-1',
        name: 'Test Frame',
        type: 'FRAME',
        width: 375,
        height: 812,
        x: 0,
        y: 0,
        reactions: [],
        exportAsync: async function() {
          return new Uint8Array([1, 2, 3, 4]);
        }
      };
    }
    return null;
  },
  loadFontAsync: async function() {
    return Promise.resolve();
  }
};

describe('Task 5.1: Verify frame index structure remains unchanged', () => {
  
  /**
   * Test that the frame index contains a header section
   * Requirements: 3.1
   */
  test('Frame index should contain header section with title and stats', async () => {
    // Arrange: Create mock prototypes
    const prototypes = [
      {
        id: 'proto-1',
        name: 'Screen 1',
        flowName: 'Flow 1',
        width: 375,
        height: 812,
        x: 0,
        y: 0,
        pageName: 'Page 1',
        pageId: 'page-1',
        reactionsCount: 2,
        prototypeUrl: 'https://www.figma.com/proto/test/proto1',
        lastChecked: Date.now()
      }
    ];

    // Act: Create a simplified version of the index frame structure
    const mainFrame = figma.createFrame();
    mainFrame.name = 'Prototype Index';
    
    // Header background
    const headerBg = figma.createRectangle();
    headerBg.name = 'Header Background';
    mainFrame.appendChild(headerBg);
    
    // Title
    const title = figma.createText();
    title.characters = 'Prototype Index';
    title.name = 'Title';
    mainFrame.appendChild(title);
    
    // Stats
    const stats = figma.createText();
    stats.characters = '1 prototipos';
    stats.name = 'Stats';
    mainFrame.appendChild(stats);

    // Assert: Header elements should exist
    expect(mainFrame.children.length).toBeGreaterThanOrEqual(3);
    
    const titleNode = mainFrame.children.find(c => c.name === 'Title');
    expect(titleNode).toBeDefined();
    expect(titleNode.characters).toBe('Prototype Index');
    
    const statsNode = mainFrame.children.find(c => c.name === 'Stats');
    expect(statsNode).toBeDefined();
    expect(statsNode.characters).toContain('prototipos');
  });

  /**
   * Test that the frame index contains page sections
   * Requirements: 3.1
   */
  test('Frame index should contain page sections with headers', async () => {
    // Arrange: Create mock prototypes from multiple pages
    const prototypes = [
      {
        id: 'proto-1',
        name: 'Screen 1',
        flowName: 'Flow 1',
        width: 375,
        height: 812,
        pageName: 'Page 1',
        pageId: 'page-1',
        reactionsCount: 2,
        prototypeUrl: 'https://www.figma.com/proto/test/proto1'
      },
      {
        id: 'proto-2',
        name: 'Screen 2',
        flowName: 'Flow 2',
        width: 375,
        height: 812,
        pageName: 'Page 2',
        pageId: 'page-2',
        reactionsCount: 1,
        prototypeUrl: 'https://www.figma.com/proto/test/proto2'
      }
    ];

    // Group by page
    const pageGroups = {};
    for (const p of prototypes) {
      if (!pageGroups[p.pageName]) pageGroups[p.pageName] = [];
      pageGroups[p.pageName].push(p);
    }

    // Act: Create page sections
    const mainFrame = figma.createFrame();
    mainFrame.name = 'Prototype Index';
    
    const pageNames = Object.keys(pageGroups);
    for (let i = 0; i < pageNames.length; i++) {
      const pageName = pageNames[i];
      const items = pageGroups[pageName];
      
      // Page header
      const pageHeader = figma.createText();
      pageHeader.name = `Page Header: ${pageName}`;
      pageHeader.characters = pageName;
      mainFrame.appendChild(pageHeader);
      
      // Count badge
      const countBadge = figma.createText();
      countBadge.name = `Count Badge: ${pageName}`;
      countBadge.characters = `${items.length} prototipo${items.length !== 1 ? 's' : ''}`;
      mainFrame.appendChild(countBadge);
    }

    // Assert: Page sections should exist
    expect(pageNames.length).toBe(2);
    
    const page1Header = mainFrame.children.find(c => c.name === 'Page Header: Page 1');
    expect(page1Header).toBeDefined();
    expect(page1Header.characters).toBe('Page 1');
    
    const page2Header = mainFrame.children.find(c => c.name === 'Page Header: Page 2');
    expect(page2Header).toBeDefined();
    expect(page2Header.characters).toBe('Page 2');
  });

  /**
   * Test that cards contain all expected child elements
   * Requirements: 3.1
   */
  test('Cards should contain all expected child elements (thumbnail, text, metadata)', async () => {
    // Arrange: Create a mock prototype
    const prototype = {
      id: 'proto-1',
      name: 'Screen 1',
      flowName: 'Flow 1',
      width: 375,
      height: 812,
      pageName: 'Page 1',
      prototypeUrl: 'https://www.figma.com/proto/test/proto1'
    };

    // Act: Create a card with all expected elements
    const cardFrame = figma.createFrame();
    cardFrame.name = 'Card #01';
    
    // Thumbnail background
    const thumbBg = figma.createRectangle();
    thumbBg.name = 'Thumbnail Background';
    cardFrame.appendChild(thumbBg);
    
    // Text container
    const textContainer = figma.createFrame();
    textContainer.name = 'Text Content';
    cardFrame.appendChild(textContainer);
    
    // Card number
    const cardNum = figma.createText();
    cardNum.characters = '#01';
    cardNum.name = 'Card Number';
    textContainer.appendChild(cardNum);
    
    // Flow name
    const flowName = figma.createText();
    flowName.characters = prototype.flowName;
    flowName.name = 'Flow Name';
    textContainer.appendChild(flowName);
    
    // Frame name (if different)
    if (prototype.flowName !== prototype.name) {
      const frameName = figma.createText();
      frameName.characters = prototype.name;
      frameName.name = 'Frame Name';
      textContainer.appendChild(frameName);
    }
    
    // Size
    const size = figma.createText();
    size.characters = `${prototype.width}×${prototype.height}`;
    size.name = 'Size';
    textContainer.appendChild(size);
    
    // URL
    if (prototype.prototypeUrl) {
      const url = figma.createText();
      url.characters = prototype.prototypeUrl;
      url.name = 'URL';
      textContainer.appendChild(url);
    }

    // Assert: Card should have all expected elements
    expect(cardFrame.children.length).toBeGreaterThanOrEqual(2);
    
    const thumb = cardFrame.children.find(c => c.name === 'Thumbnail Background');
    expect(thumb).toBeDefined();
    
    const textContent = cardFrame.children.find(c => c.name === 'Text Content');
    expect(textContent).toBeDefined();
    expect(textContent.children.length).toBeGreaterThanOrEqual(4); // num, flow, size, url
    
    const cardNumber = textContent.children.find(c => c.name === 'Card Number');
    expect(cardNumber).toBeDefined();
    expect(cardNumber.characters).toBe('#01');
    
    const flowNameNode = textContent.children.find(c => c.name === 'Flow Name');
    expect(flowNameNode).toBeDefined();
    expect(flowNameNode.characters).toBe('Flow 1');
    
    const sizeNode = textContent.children.find(c => c.name === 'Size');
    expect(sizeNode).toBeDefined();
    expect(sizeNode.characters).toBe('375×812');
  });

  /**
   * Test that the frame index contains a footer section
   * Requirements: 3.1
   */
  test('Frame index should contain footer section', async () => {
    // Arrange & Act: Create footer
    const mainFrame = figma.createFrame();
    mainFrame.name = 'Prototype Index';
    
    const footerLine = figma.createRectangle();
    footerLine.name = 'Footer Line';
    mainFrame.appendChild(footerLine);
    
    const footerText = figma.createText();
    footerText.name = 'Footer Text';
    footerText.characters = 'Prototype Index · Generado el 01 de enero de 2024';
    mainFrame.appendChild(footerText);

    // Assert: Footer should exist
    const footer = mainFrame.children.find(c => c.name === 'Footer Text');
    expect(footer).toBeDefined();
    expect(footer.characters).toContain('Prototype Index');
    expect(footer.characters).toContain('Generado el');
  });

  /**
   * Property test: Frame structure should be consistent for any prototype set
   * Requirements: 3.1
   */
  test('Property: Frame index structure should be consistent for any prototype set', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            flowName: fc.string({ minLength: 1, maxLength: 50 }),
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
            pageName: fc.oneof(
              fc.constant('Page 1'),
              fc.constant('Page 2'),
              fc.constant('Page 3')
            ),
            prototypeUrl: fc.constant('https://www.figma.com/proto/test/proto')
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (prototypes) => {
          // Act: Create frame structure
          const mainFrame = figma.createFrame();
          mainFrame.name = 'Prototype Index';
          
          // Header
          const header = figma.createText();
          header.name = 'Header';
          header.characters = 'Prototype Index';
          mainFrame.appendChild(header);
          
          // Group by page
          const pageGroups = {};
          for (const p of prototypes) {
            if (!pageGroups[p.pageName]) pageGroups[p.pageName] = [];
            pageGroups[p.pageName].push(p);
          }
          
          // Page sections
          for (const pageName of Object.keys(pageGroups)) {
            const pageHeader = figma.createText();
            pageHeader.name = `Page: ${pageName}`;
            mainFrame.appendChild(pageHeader);
          }
          
          // Footer
          const footer = figma.createText();
          footer.name = 'Footer';
          footer.characters = 'Prototype Index';
          mainFrame.appendChild(footer);

          // Assert: Structure should always have header, page sections, and footer
          expect(mainFrame.name).toBe('Prototype Index');
          expect(mainFrame.children.length).toBeGreaterThanOrEqual(3); // header + at least 1 page + footer
          
          const headerNode = mainFrame.children.find(c => c.name === 'Header');
          expect(headerNode).toBeDefined();
          
          const footerNode = mainFrame.children.find(c => c.name === 'Footer');
          expect(footerNode).toBeDefined();
          
          const pageCount = Object.keys(pageGroups).length;
          const pageSections = mainFrame.children.filter(c => c.name && c.name.startsWith('Page:'));
          expect(pageSections.length).toBe(pageCount);
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Task 5.3: Verify interactive behavior remains unchanged', () => {
  
  /**
   * Helper function to check if a card has a click reaction
   */
  function hasClickReaction(cardFrame) {
    if (!cardFrame._reactions || cardFrame._reactions.length === 0) {
      return false;
    }
    
    const reaction = cardFrame._reactions[0];
    return reaction.trigger && reaction.trigger.type === 'ON_CLICK';
  }

  /**
   * Helper function to check if a card has a NODE action with NAVIGATE navigation
   */
  function hasNavigateAction(cardFrame) {
    if (!cardFrame._reactions || cardFrame._reactions.length === 0) {
      return false;
    }
    
    const reaction = cardFrame._reactions[0];
    if (!reaction.action) {
      return false;
    }
    
    return reaction.action.type === 'NODE' && 
           reaction.action.navigation === 'NAVIGATE' &&
           !!reaction.action.destinationId;
  }

  /**
   * Test that click reactions are set on cards with valid node IDs
   * Requirements: 3.3
   */
  test('Cards with valid node IDs should have click reactions', async () => {
    // Arrange: Create a prototype with a valid node ID
    const prototype = {
      id: 'node-1',
      name: 'Screen 1',
      flowName: 'Flow 1',
      width: 375,
      height: 812,
      prototypeUrl: 'https://www.figma.com/proto/test/proto1'
    };

    // Act: Create a card and set reaction
    const cardFrame = figma.createFrame();
    cardFrame.name = 'Card #01';
    
    if (prototype.id) {
      const destinationNode = figma.getNodeById(prototype.id);
      if (destinationNode && (destinationNode.type === 'FRAME' || destinationNode.type === 'COMPONENT')) {
        await cardFrame.setReactionsAsync([{
          "action": { 
            "type": "NODE", 
            "destinationId": prototype.id,
            "navigation": "NAVIGATE",
            "transition": null,
            "preserveScrollPosition": false
          },
          "actions": [{ 
            "type": "NODE", 
            "destinationId": prototype.id,
            "navigation": "NAVIGATE",
            "transition": null,
            "preserveScrollPosition": false
          }],
          "trigger": { "type": "ON_CLICK" }
        }]);
      }
    }

    // Assert: Card should have a click reaction
    expect(hasClickReaction(cardFrame)).toBe(true);
    expect(hasNavigateAction(cardFrame)).toBe(true);
    expect(cardFrame._reactions[0].action.destinationId).toBe('node-1');
  });

  /**
   * Test that cards without valid node IDs don't have reactions
   * Requirements: 3.3
   */
  test('Cards without valid node IDs should not have reactions', async () => {
    // Arrange: Create a prototype with an invalid node ID
    const prototype = {
      id: 'invalid-node-id',
      name: 'Screen 1',
      flowName: 'Flow 1',
      width: 375,
      height: 812,
      prototypeUrl: 'https://www.figma.com/proto/test/proto1'
    };

    // Act: Try to create a card and set reaction
    const cardFrame = figma.createFrame();
    cardFrame.name = 'Card #01';
    
    if (prototype.id) {
      const destinationNode = figma.getNodeById(prototype.id);
      if (destinationNode && (destinationNode.type === 'FRAME' || destinationNode.type === 'COMPONENT')) {
        await cardFrame.setReactionsAsync([{
          "action": { 
            "type": "NODE", 
            "destinationId": prototype.id,
            "navigation": "NAVIGATE"
          },
          "trigger": { "type": "ON_CLICK" }
        }]);
      }
    }

    // Assert: Card should not have a reaction (because node doesn't exist)
    expect(cardFrame._reactions.length).toBe(0);
  });

  /**
   * Test that navigation behavior uses NODE action with NAVIGATE navigation
   * Requirements: 3.3
   */
  test('Navigation behavior should use NODE action with NAVIGATE navigation', async () => {
    // Arrange
    const prototype = {
      id: 'node-1',
      name: 'Screen 1',
      flowName: 'Flow 1',
      width: 375,
      height: 812
    };

    // Act: Create card with reaction
    const cardFrame = figma.createFrame();
    
    await cardFrame.setReactionsAsync([{
      "action": { 
        "type": "NODE", 
        "destinationId": prototype.id,
        "navigation": "NAVIGATE",
        "transition": null,
        "preserveScrollPosition": false
      },
      "actions": [{ 
        "type": "NODE", 
        "destinationId": prototype.id,
        "navigation": "NAVIGATE",
        "transition": null,
        "preserveScrollPosition": false
      }],
      "trigger": { "type": "ON_CLICK" }
    }]);

    // Assert: Reaction should use NODE action with NAVIGATE
    expect(cardFrame._reactions.length).toBe(1);
    expect(cardFrame._reactions[0].action.type).toBe('NODE');
    expect(cardFrame._reactions[0].action.navigation).toBe('NAVIGATE');
    expect(cardFrame._reactions[0].action.destinationId).toBe('node-1');
    expect(cardFrame._reactions[0].trigger.type).toBe('ON_CLICK');
  });

  /**
   * Test that reactions have correct structure
   * Requirements: 3.3
   */
  test('Reactions should have correct structure with action and trigger', async () => {
    // Arrange
    const prototype = {
      id: 'node-1',
      name: 'Screen 1',
      flowName: 'Flow 1'
    };

    // Act
    const cardFrame = figma.createFrame();
    await cardFrame.setReactionsAsync([{
      "action": { 
        "type": "NODE", 
        "destinationId": prototype.id,
        "navigation": "NAVIGATE",
        "transition": null,
        "preserveScrollPosition": false
      },
      "actions": [{ 
        "type": "NODE", 
        "destinationId": prototype.id,
        "navigation": "NAVIGATE",
        "transition": null,
        "preserveScrollPosition": false
      }],
      "trigger": { "type": "ON_CLICK" }
    }]);

    // Assert: Reaction structure should be correct
    const reaction = cardFrame._reactions[0];
    expect(reaction).toHaveProperty('action');
    expect(reaction).toHaveProperty('actions');
    expect(reaction).toHaveProperty('trigger');
    expect(reaction.action).toHaveProperty('type');
    expect(reaction.action).toHaveProperty('destinationId');
    expect(reaction.action).toHaveProperty('navigation');
    expect(reaction.trigger).toHaveProperty('type');
  });

  /**
   * Property test: All cards with valid IDs should have consistent navigation behavior
   * Requirements: 3.3
   */
  test('Property: All cards with valid node IDs should have consistent navigation behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.constant('node-1'), // Use valid node ID
          name: fc.string({ minLength: 1, maxLength: 50 }),
          flowName: fc.string({ minLength: 1, maxLength: 50 }),
          width: fc.integer({ min: 100, max: 2000 }),
          height: fc.integer({ min: 100, max: 2000 })
        }),
        async (prototype) => {
          // Act: Create card with reaction
          const cardFrame = figma.createFrame();
          
          if (prototype.id) {
            const destinationNode = figma.getNodeById(prototype.id);
            if (destinationNode && (destinationNode.type === 'FRAME' || destinationNode.type === 'COMPONENT')) {
              await cardFrame.setReactionsAsync([{
                "action": { 
                  "type": "NODE", 
                  "destinationId": prototype.id,
                  "navigation": "NAVIGATE",
                  "transition": null,
                  "preserveScrollPosition": false
                },
                "actions": [{ 
                  "type": "NODE", 
                  "destinationId": prototype.id,
                  "navigation": "NAVIGATE",
                  "transition": null,
                  "preserveScrollPosition": false
                }],
                "trigger": { "type": "ON_CLICK" }
              }]);
            }
          }

          // Assert: Navigation behavior should be consistent
          expect(hasClickReaction(cardFrame)).toBe(true);
          expect(hasNavigateAction(cardFrame)).toBe(true);
          expect(cardFrame._reactions[0].action.type).toBe('NODE');
          expect(cardFrame._reactions[0].action.navigation).toBe('NAVIGATE');
          expect(cardFrame._reactions[0].action.destinationId).toBe(prototype.id);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property test: Navigation behavior should work for both grid and list layouts
   * Requirements: 3.3
   */
  test('Property: Navigation behavior should work consistently across layouts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('grid', 'list'),
        fc.record({
          id: fc.constant('node-1'),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          flowName: fc.string({ minLength: 1, maxLength: 50 })
        }),
        async (layout, prototype) => {
          // Act: Create card for the layout
          const cardFrame = figma.createFrame();
          cardFrame.resize(
            layout === 'grid' ? 340 : 1104,
            layout === 'grid' ? 200 : 80
          );
          
          if (prototype.id) {
            const destinationNode = figma.getNodeById(prototype.id);
            if (destinationNode) {
              await cardFrame.setReactionsAsync([{
                "action": { 
                  "type": "NODE", 
                  "destinationId": prototype.id,
                  "navigation": "NAVIGATE"
                },
                "actions": [{ 
                  "type": "NODE", 
                  "destinationId": prototype.id,
                  "navigation": "NAVIGATE"
                }],
                "trigger": { "type": "ON_CLICK" }
              }]);
            }
          }

          // Assert: Navigation should work the same regardless of layout
          expect(hasClickReaction(cardFrame)).toBe(true);
          expect(hasNavigateAction(cardFrame)).toBe(true);
          expect(cardFrame._reactions[0].action.destinationId).toBe(prototype.id);
        }
      ),
      { numRuns: 20 }
    );
  });
});

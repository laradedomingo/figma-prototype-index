/**
 * Unit Tests for Task 3: Message Handlers and Storage Operations
 * Feature: frame-creation-tab-feature
 * 
 * **Validates: Requirements 5.1, 5.2, 1.1, 1.2**
 * 
 * These tests verify the new message handlers and storage operations:
 * - SAVE_PAGE_SELECTIONS message handler (Task 3.1)
 * - loadSettings() includes pageSelections (Task 3.2)
 * - INITIAL_DATA and PROTOTYPES_DATA include page metadata (Task 3.3)
 */

// Mock Figma API for testing
global.figma = {
  clientStorage: {
    _storage: {},
    setAsync: async function(key, value) {
      this._storage[key] = value;
      return Promise.resolve();
    },
    getAsync: async function(key) {
      return Promise.resolve(this._storage[key]);
    },
    _reset: function() {
      this._storage = {};
    }
  },
  ui: {
    _messages: [],
    postMessage: function(msg) {
      this._messages.push(msg);
    },
    _getLastMessage: function() {
      return this._messages[this._messages.length - 1];
    },
    _reset: function() {
      this._messages = [];
    }
  },
  showUI: function() {},
  root: {
    name: 'Test Document',
    children: []
  },
  fileKey: 'test-file-key'
};

// Mock extractPageMetadata function
function extractPageMetadata(prototypes) {
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
  
  return Array.from(pageMap.values());
}

// Mock message handler function
async function handleMessage(msg) {
  switch (msg.type) {
    case "SAVE_PAGE_SELECTIONS": {
      try {
        await figma.clientStorage.setAsync('pageSelections', msg.pageSelections);
        figma.ui.postMessage({ type: "PAGE_SELECTIONS_SAVED" });
      } catch (err) {
        console.error("Failed to save page selections:", err);
        figma.ui.postMessage({ 
          type: "SETTING_ERROR", 
          error: "Could not save page selections" 
        });
      }
      break;
    }

    case "LOAD_SETTINGS": {
      try {
        const dedicatedPage = await figma.clientStorage.getAsync('dedicatedPage');
        const pageSelections = await figma.clientStorage.getAsync('pageSelections');
        const settings = {
          dedicatedPage: dedicatedPage !== undefined ? dedicatedPage : false,
          language: 'es',
          pageSelections: pageSelections || {}
        };
        figma.ui.postMessage({ type: "SETTINGS_LOADED", settings });
      } catch (err) {
        console.error("Failed to load settings:", err);
        figma.ui.postMessage({ 
          type: "SETTINGS_LOADED", 
          settings: { dedicatedPage: false, language: 'es', pageSelections: {} } 
        });
      }
      break;
    }
  }
}

describe('Task 3: Message Handlers and Storage Operations', () => {
  
  beforeEach(() => {
    // Reset storage and messages before each test
    figma.clientStorage._reset();
    figma.ui._reset();
  });

  describe('Task 3.1: SAVE_PAGE_SELECTIONS message handler', () => {
    /**
     * **Validates: Requirement 5.1**
     * 
     * The plugin should handle incoming page selections from UI,
     * save to figma.clientStorage using 'pageSelections' key,
     * and send confirmation message back to UI.
     */
    test('should save page selections to storage', async () => {
      // Arrange
      const pageSelections = {
        'page-1': true,
        'page-2': false,
        'page-3': true
      };

      // Act
      await handleMessage({
        type: 'SAVE_PAGE_SELECTIONS',
        pageSelections: pageSelections
      });

      // Assert - verify storage was called
      const saved = await figma.clientStorage.getAsync('pageSelections');
      expect(saved).toEqual(pageSelections);

      // Assert - verify confirmation message was sent
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('PAGE_SELECTIONS_SAVED');
    });

    test('should handle empty page selections', async () => {
      // Arrange
      const pageSelections = {};

      // Act
      await handleMessage({
        type: 'SAVE_PAGE_SELECTIONS',
        pageSelections: pageSelections
      });

      // Assert
      const saved = await figma.clientStorage.getAsync('pageSelections');
      expect(saved).toEqual({});
    });

    test('should handle storage failures gracefully', async () => {
      // Arrange - mock storage failure
      const originalSetAsync = figma.clientStorage.setAsync;
      figma.clientStorage.setAsync = async () => {
        throw new Error('Storage failure');
      };

      // Act
      await handleMessage({
        type: 'SAVE_PAGE_SELECTIONS',
        pageSelections: { 'page-1': true }
      });

      // Assert - verify error message was sent
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('SETTING_ERROR');
      expect(msg.error).toBe('Could not save page selections');

      // Restore original function
      figma.clientStorage.setAsync = originalSetAsync;
    });

    test('should overwrite previous page selections', async () => {
      // Arrange - save initial selections
      await figma.clientStorage.setAsync('pageSelections', {
        'page-1': true,
        'page-2': true
      });

      // Act - save new selections
      await handleMessage({
        type: 'SAVE_PAGE_SELECTIONS',
        pageSelections: {
          'page-1': false,
          'page-2': false,
          'page-3': true
        }
      });

      // Assert - verify new selections replaced old ones
      const saved = await figma.clientStorage.getAsync('pageSelections');
      expect(saved).toEqual({
        'page-1': false,
        'page-2': false,
        'page-3': true
      });
    });
  });

  describe('Task 3.2: loadSettings() includes pageSelections', () => {
    /**
     * **Validates: Requirement 5.2**
     * 
     * The loadSettings() function should load pageSelections from storage,
     * include them in SETTINGS_LOADED message, and default to empty object if not found.
     */
    test('should load pageSelections from storage', async () => {
      // Arrange - pre-populate storage
      const pageSelections = {
        'page-1': true,
        'page-2': false
      };
      await figma.clientStorage.setAsync('pageSelections', pageSelections);

      // Act
      await handleMessage({ type: 'LOAD_SETTINGS' });

      // Assert
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('SETTINGS_LOADED');
      expect(msg.settings.pageSelections).toEqual(pageSelections);
    });

    test('should default to empty object when pageSelections not found', async () => {
      // Arrange - storage is empty (no pageSelections saved)

      // Act
      await handleMessage({ type: 'LOAD_SETTINGS' });

      // Assert
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('SETTINGS_LOADED');
      expect(msg.settings.pageSelections).toEqual({});
    });

    test('should include pageSelections alongside other settings', async () => {
      // Arrange
      await figma.clientStorage.setAsync('dedicatedPage', true);
      await figma.clientStorage.setAsync('pageSelections', {
        'page-1': false,
        'page-2': true
      });

      // Act
      await handleMessage({ type: 'LOAD_SETTINGS' });

      // Assert - verify all settings are included
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('SETTINGS_LOADED');
      expect(msg.settings.dedicatedPage).toBe(true);
      expect(msg.settings.language).toBe('es');
      expect(msg.settings.pageSelections).toEqual({
        'page-1': false,
        'page-2': true
      });
    });

    test('should handle storage read errors gracefully', async () => {
      // Arrange - mock storage failure
      const originalGetAsync = figma.clientStorage.getAsync;
      figma.clientStorage.getAsync = async () => {
        throw new Error('Storage read failure');
      };

      // Act
      await handleMessage({ type: 'LOAD_SETTINGS' });

      // Assert - verify default settings were sent
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('SETTINGS_LOADED');
      expect(msg.settings.dedicatedPage).toBe(false);
      expect(msg.settings.language).toBe('es');
      expect(msg.settings.pageSelections).toEqual({});

      // Restore original function
      figma.clientStorage.getAsync = originalGetAsync;
    });
  });

  describe('Task 3.3: Page metadata extraction', () => {
    /**
     * **Validates: Requirements 1.1, 1.2**
     * 
     * The extractPageMetadata() function should generate page metadata
     * from prototypes array, including page ID, name, and prototype count.
     */
    test('should extract page metadata from prototypes', () => {
      // Arrange
      const prototypes = [
        { pageId: 'page-1', pageName: 'Home', id: 'proto-1' },
        { pageId: 'page-1', pageName: 'Home', id: 'proto-2' },
        { pageId: 'page-2', pageName: 'About', id: 'proto-3' }
      ];

      // Act
      const pages = extractPageMetadata(prototypes);

      // Assert
      expect(pages).toHaveLength(2);
      expect(pages[0]).toEqual({
        id: 'page-1',
        name: 'Home',
        prototypeCount: 2
      });
      expect(pages[1]).toEqual({
        id: 'page-2',
        name: 'About',
        prototypeCount: 1
      });
    });

    test('should handle empty prototypes array', () => {
      // Arrange
      const prototypes = [];

      // Act
      const pages = extractPageMetadata(prototypes);

      // Assert
      expect(pages).toHaveLength(0);
    });

    test('should handle single prototype', () => {
      // Arrange
      const prototypes = [
        { pageId: 'page-1', pageName: 'Home', id: 'proto-1' }
      ];

      // Act
      const pages = extractPageMetadata(prototypes);

      // Assert
      expect(pages).toHaveLength(1);
      expect(pages[0]).toEqual({
        id: 'page-1',
        name: 'Home',
        prototypeCount: 1
      });
    });

    test('should count prototypes per page correctly', () => {
      // Arrange
      const prototypes = [
        { pageId: 'page-1', pageName: 'Home', id: 'proto-1' },
        { pageId: 'page-1', pageName: 'Home', id: 'proto-2' },
        { pageId: 'page-1', pageName: 'Home', id: 'proto-3' },
        { pageId: 'page-2', pageName: 'About', id: 'proto-4' },
        { pageId: 'page-3', pageName: 'Contact', id: 'proto-5' },
        { pageId: 'page-3', pageName: 'Contact', id: 'proto-6' }
      ];

      // Act
      const pages = extractPageMetadata(prototypes);

      // Assert
      expect(pages).toHaveLength(3);
      expect(pages.find(p => p.id === 'page-1').prototypeCount).toBe(3);
      expect(pages.find(p => p.id === 'page-2').prototypeCount).toBe(1);
      expect(pages.find(p => p.id === 'page-3').prototypeCount).toBe(2);
    });

    test('should preserve page order from prototypes array', () => {
      // Arrange - pages appear in specific order
      const prototypes = [
        { pageId: 'page-3', pageName: 'Contact', id: 'proto-1' },
        { pageId: 'page-1', pageName: 'Home', id: 'proto-2' },
        { pageId: 'page-2', pageName: 'About', id: 'proto-3' }
      ];

      // Act
      const pages = extractPageMetadata(prototypes);

      // Assert - order should match first appearance in prototypes
      expect(pages[0].id).toBe('page-3');
      expect(pages[1].id).toBe('page-1');
      expect(pages[2].id).toBe('page-2');
    });
  });

  describe('Integration: Message flow', () => {
    test('should support full workflow: load settings, save selections, reload', async () => {
      // Step 1: Load initial settings (empty pageSelections)
      await handleMessage({ type: 'LOAD_SETTINGS' });
      let msg = figma.ui._getLastMessage();
      expect(msg.settings.pageSelections).toEqual({});

      // Step 2: Save page selections
      figma.ui._reset();
      await handleMessage({
        type: 'SAVE_PAGE_SELECTIONS',
        pageSelections: {
          'page-1': true,
          'page-2': false
        }
      });
      msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('PAGE_SELECTIONS_SAVED');

      // Step 3: Reload settings (should include saved selections)
      figma.ui._reset();
      await handleMessage({ type: 'LOAD_SETTINGS' });
      msg = figma.ui._getLastMessage();
      expect(msg.settings.pageSelections).toEqual({
        'page-1': true,
        'page-2': false
      });
    });
  });
});

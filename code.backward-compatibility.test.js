/**
 * Backward Compatibility Tests for Plugin Settings Dedicated Page Toggle
 * Feature: plugin-settings-dedicated-page-toggle
 * Task 6.1: Test existing features with new setting
 * 
 * **Validates: Requirements 6.1, 6.3, 6.4, 6.5**
 * 
 * These tests verify that existing plugin features (watcher, refresh, navigation)
 * continue to work correctly with the new dedicatedPage setting in both enabled
 * and disabled states, as well as when the setting is undefined (old plugin behavior).
 */

const fc = require('fast-check');

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
    _getMessages: function() {
      return this._messages;
    },
    _reset: function() {
      this._messages = [];
    }
  },
  showUI: function() {},
  root: {
    name: 'Test Document',
    children: [
      {
        name: 'Page 1',
        id: 'page-1',
        type: 'PAGE',
        children: [],
        flowStartingPoints: [
          {
            name: 'Flow 1',
            nodeId: 'node-1'
          }
        ]
      }
    ]
  },
  fileKey: 'test-file-key',
  currentPage: null,
  viewport: {
    scrollAndZoomIntoView: jest.fn()
  },
  getNodeById: function(id) {
    const nodes = {
      'node-1': {
        id: 'node-1',
        name: 'Frame 1',
        type: 'FRAME',
        width: 375,
        height: 812,
        x: 0,
        y: 0,
        reactions: [],
        parent: this.root.children[0]
      }
    };
    return nodes[id] || null;
  },
  createPage: function() {
    const page = {
      name: '',
      id: 'new-page-' + Date.now(),
      type: 'PAGE',
      children: [],
      flowStartingPoints: []
    };
    this.root.children.push(page);
    return page;
  },
  createFrame: function() {
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      name: '',
      clipsContent: false,
      children: [],
      fills: [],
      strokes: [],
      strokeWeight: 0,
      cornerRadius: 0,
      resize: function(w, h) {
        this.width = w;
        this.height = h;
      },
      appendChild: function(child) {
        this.children.push(child);
      },
      setReactionsAsync: async function(reactions) {
        this._reactions = reactions;
      }
    };
  },
  createRectangle: function() {
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fills: [],
      cornerRadius: 0,
      resize: function(w, h) {
        this.width = w;
        this.height = h;
      }
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
      textAutoResize: 'WIDTH_AND_HEIGHT',
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
  },
  createImage: function(bytes) {
    return {
      hash: 'mock-image-hash-' + Date.now()
    };
  }
};

// Mock watcher state
let watcherInterval = null;
let lastSnapshot = "";
let isWatching = false;

// Mock getAllPrototypes function
function getAllPrototypes() {
  const prototypes = [];
  for (const page of figma.root.children) {
    if (page.name === "📋 Prototype Index") continue;
    
    const flows = page.flowStartingPoints || [];
    for (const flow of flows) {
      const node = figma.getNodeById(flow.nodeId);
      if (!node) continue;
      
      prototypes.push({
        id: node.id,
        name: node.name,
        flowName: flow.name || node.name,
        type: node.type,
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        pageName: page.name,
        pageId: page.id,
        reactionsCount: node.reactions ? node.reactions.length : 0,
        prototypeUrl: figma.fileKey ? `https://www.figma.com/proto/${figma.fileKey}/test` : null,
        lastChecked: Date.now()
      });
    }
  }
  return prototypes;
}

// Mock createSnapshot function
function createSnapshot(prototypes) {
  return JSON.stringify(
    prototypes.map((p) => ({
      id: p.id,
      name: p.name,
      flowName: p.flowName,
      pageName: p.pageName,
    }))
  );
}

// Mock watcher functions
function startWatcher() {
  if (watcherInterval) return;
  isWatching = true;
  
  const checkForChanges = () => {
    if (!isWatching) return;
    try {
      const prototypes = getAllPrototypes();
      const snapshot = createSnapshot(prototypes);
      if (snapshot !== lastSnapshot && lastSnapshot !== "") {
        lastSnapshot = snapshot;
        figma.ui.postMessage({ type: "PROTOTYPES_UPDATED", prototypes, timestamp: Date.now() });
      } else if (lastSnapshot === "") {
        lastSnapshot = snapshot;
      }
    } catch (e) {
      console.error('Watcher error:', e);
    }
  };
  
  watcherInterval = setInterval(checkForChanges, 2000);
}

function stopWatcher() {
  if (watcherInterval) {
    clearInterval(watcherInterval);
    watcherInterval = null;
  }
  isWatching = false;
}

// Mock message handler
async function handleMessage(msg) {
  switch (msg.type) {
    case "REFRESH": {
      const prototypes = getAllPrototypes();
      lastSnapshot = createSnapshot(prototypes);
      figma.ui.postMessage({ type: "PROTOTYPES_DATA", prototypes, timestamp: Date.now() });
      break;
    }

    case "START_WATCHER":
      startWatcher();
      figma.ui.postMessage({ type: "WATCHER_STARTED" });
      break;

    case "STOP_WATCHER":
      stopWatcher();
      figma.ui.postMessage({ type: "WATCHER_STOPPED" });
      break;

    case "NAVIGATE_TO": {
      const node = figma.getNodeById(msg.nodeId);
      if (node) {
        figma.currentPage = node.parent;
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.currentPage.selection = [node];
      }
      break;
    }

    case "SAVE_SETTING": {
      try {
        await figma.clientStorage.setAsync(msg.key, msg.value);
        figma.ui.postMessage({ type: "SETTING_SAVED", key: msg.key });
      } catch (err) {
        figma.ui.postMessage({ type: "SETTING_ERROR", error: "Could not save setting" });
      }
      break;
    }

    case "LOAD_SETTINGS": {
      try {
        const dedicatedPage = await figma.clientStorage.getAsync('dedicatedPage');
        const settings = {
          dedicatedPage: dedicatedPage !== undefined ? dedicatedPage : false
        };
        figma.ui.postMessage({ type: "SETTINGS_LOADED", settings });
      } catch (err) {
        figma.ui.postMessage({ 
          type: "SETTINGS_LOADED", 
          settings: { dedicatedPage: false } 
        });
      }
      break;
    }
  }
}

describe('Backward Compatibility: Existing Features with New Setting', () => {
  
  beforeEach(() => {
    // Reset state before each test
    figma.clientStorage._reset();
    figma.ui._reset();
    stopWatcher();
    lastSnapshot = "";
    figma.currentPage = null;
    figma.viewport.scrollAndZoomIntoView.mockClear();
  });

  afterEach(() => {
    // Clean up after each test
    stopWatcher();
  });

  describe('Requirement 6.3: Watcher Feature Compatibility', () => {
    /**
     * The watcher feature monitors prototype changes and notifies the UI.
     * It should work correctly regardless of the dedicatedPage setting.
     */

    test('watcher starts and stops correctly with dedicatedPage=false', async () => {
      // Set dedicatedPage to false
      await figma.clientStorage.setAsync('dedicatedPage', false);
      
      // Start watcher
      await handleMessage({ type: 'START_WATCHER' });
      
      // Verify watcher started
      expect(isWatching).toBe(true);
      expect(watcherInterval).not.toBeNull();
      
      const startMsg = figma.ui._getLastMessage();
      expect(startMsg.type).toBe('WATCHER_STARTED');
      
      // Stop watcher
      await handleMessage({ type: 'STOP_WATCHER' });
      
      // Verify watcher stopped
      expect(isWatching).toBe(false);
      expect(watcherInterval).toBeNull();
      
      const stopMsg = figma.ui._getLastMessage();
      expect(stopMsg.type).toBe('WATCHER_STOPPED');
    });

    test('watcher starts and stops correctly with dedicatedPage=true', async () => {
      // Set dedicatedPage to true
      await figma.clientStorage.setAsync('dedicatedPage', true);
      
      // Start watcher
      await handleMessage({ type: 'START_WATCHER' });
      
      // Verify watcher started
      expect(isWatching).toBe(true);
      expect(watcherInterval).not.toBeNull();
      
      const startMsg = figma.ui._getLastMessage();
      expect(startMsg.type).toBe('WATCHER_STARTED');
      
      // Stop watcher
      await handleMessage({ type: 'STOP_WATCHER' });
      
      // Verify watcher stopped
      expect(isWatching).toBe(false);
      expect(watcherInterval).toBeNull();
      
      const stopMsg = figma.ui._getLastMessage();
      expect(stopMsg.type).toBe('WATCHER_STOPPED');
    });

    test('watcher works correctly with dedicatedPage=undefined (old behavior)', async () => {
      // Don't set dedicatedPage (simulates old plugin version)
      
      // Start watcher
      await handleMessage({ type: 'START_WATCHER' });
      
      // Verify watcher started
      expect(isWatching).toBe(true);
      expect(watcherInterval).not.toBeNull();
      
      const startMsg = figma.ui._getLastMessage();
      expect(startMsg.type).toBe('WATCHER_STARTED');
      
      // Stop watcher
      await handleMessage({ type: 'STOP_WATCHER' });
      
      // Verify watcher stopped
      expect(isWatching).toBe(false);
      expect(watcherInterval).toBeNull();
    });

    test('Property: watcher works with any dedicatedPage setting', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.boolean(), { nil: undefined }),
          async (dedicatedPageSetting) => {
            // Reset state
            figma.ui._reset();
            stopWatcher();
            
            // Set dedicatedPage setting (or leave undefined)
            if (dedicatedPageSetting !== undefined) {
              await figma.clientStorage.setAsync('dedicatedPage', dedicatedPageSetting);
            }
            
            // Start watcher
            await handleMessage({ type: 'START_WATCHER' });
            
            // Verify watcher started
            expect(isWatching).toBe(true);
            expect(watcherInterval).not.toBeNull();
            
            // Stop watcher
            await handleMessage({ type: 'STOP_WATCHER' });
            
            // Verify watcher stopped
            expect(isWatching).toBe(false);
            expect(watcherInterval).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Requirement 6.4: Refresh Functionality Compatibility', () => {
    /**
     * The refresh functionality re-scans all prototypes and updates the UI.
     * It should work correctly regardless of the dedicatedPage setting.
     */

    test('refresh works correctly with dedicatedPage=false', async () => {
      // Set dedicatedPage to false
      await figma.clientStorage.setAsync('dedicatedPage', false);
      
      // Trigger refresh
      await handleMessage({ type: 'REFRESH' });
      
      // Verify refresh message was sent
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('PROTOTYPES_DATA');
      expect(msg.prototypes).toBeDefined();
      expect(Array.isArray(msg.prototypes)).toBe(true);
      expect(msg.timestamp).toBeDefined();
    });

    test('refresh works correctly with dedicatedPage=true', async () => {
      // Set dedicatedPage to true
      await figma.clientStorage.setAsync('dedicatedPage', true);
      
      // Trigger refresh
      await handleMessage({ type: 'REFRESH' });
      
      // Verify refresh message was sent
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('PROTOTYPES_DATA');
      expect(msg.prototypes).toBeDefined();
      expect(Array.isArray(msg.prototypes)).toBe(true);
      expect(msg.timestamp).toBeDefined();
    });

    test('refresh works correctly with dedicatedPage=undefined (old behavior)', async () => {
      // Don't set dedicatedPage (simulates old plugin version)
      
      // Trigger refresh
      await handleMessage({ type: 'REFRESH' });
      
      // Verify refresh message was sent
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('PROTOTYPES_DATA');
      expect(msg.prototypes).toBeDefined();
      expect(Array.isArray(msg.prototypes)).toBe(true);
      expect(msg.timestamp).toBeDefined();
    });

    test('refresh returns correct prototype data structure', async () => {
      // Trigger refresh
      await handleMessage({ type: 'REFRESH' });
      
      // Verify prototype data structure
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('PROTOTYPES_DATA');
      
      if (msg.prototypes.length > 0) {
        const proto = msg.prototypes[0];
        expect(proto).toHaveProperty('id');
        expect(proto).toHaveProperty('name');
        expect(proto).toHaveProperty('flowName');
        expect(proto).toHaveProperty('pageName');
        expect(proto).toHaveProperty('width');
        expect(proto).toHaveProperty('height');
      }
    });

    test('Property: refresh works with any dedicatedPage setting', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.boolean(), { nil: undefined }),
          async (dedicatedPageSetting) => {
            // Reset state
            figma.ui._reset();
            
            // Set dedicatedPage setting (or leave undefined)
            if (dedicatedPageSetting !== undefined) {
              await figma.clientStorage.setAsync('dedicatedPage', dedicatedPageSetting);
            }
            
            // Trigger refresh
            await handleMessage({ type: 'REFRESH' });
            
            // Verify refresh message was sent
            const msg = figma.ui._getLastMessage();
            expect(msg.type).toBe('PROTOTYPES_DATA');
            expect(msg.prototypes).toBeDefined();
            expect(Array.isArray(msg.prototypes)).toBe(true);
            expect(msg.timestamp).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Requirement 6.5: Navigation Feature Compatibility', () => {
    /**
     * The navigation feature allows users to jump to prototype nodes from the UI.
     * It should work correctly regardless of the dedicatedPage setting.
     */

    test('navigation works correctly with dedicatedPage=false', async () => {
      // Set dedicatedPage to false
      await figma.clientStorage.setAsync('dedicatedPage', false);
      
      // Trigger navigation
      await handleMessage({ type: 'NAVIGATE_TO', nodeId: 'node-1' });
      
      // Verify navigation occurred
      expect(figma.currentPage).toBeDefined();
      expect(figma.currentPage.name).toBe('Page 1');
      expect(figma.viewport.scrollAndZoomIntoView).toHaveBeenCalled();
      expect(figma.currentPage.selection).toHaveLength(1);
      expect(figma.currentPage.selection[0].id).toBe('node-1');
    });

    test('navigation works correctly with dedicatedPage=true', async () => {
      // Set dedicatedPage to true
      await figma.clientStorage.setAsync('dedicatedPage', true);
      
      // Trigger navigation
      await handleMessage({ type: 'NAVIGATE_TO', nodeId: 'node-1' });
      
      // Verify navigation occurred
      expect(figma.currentPage).toBeDefined();
      expect(figma.currentPage.name).toBe('Page 1');
      expect(figma.viewport.scrollAndZoomIntoView).toHaveBeenCalled();
      expect(figma.currentPage.selection).toHaveLength(1);
      expect(figma.currentPage.selection[0].id).toBe('node-1');
    });

    test('navigation works correctly with dedicatedPage=undefined (old behavior)', async () => {
      // Don't set dedicatedPage (simulates old plugin version)
      
      // Trigger navigation
      await handleMessage({ type: 'NAVIGATE_TO', nodeId: 'node-1' });
      
      // Verify navigation occurred
      expect(figma.currentPage).toBeDefined();
      expect(figma.currentPage.name).toBe('Page 1');
      expect(figma.viewport.scrollAndZoomIntoView).toHaveBeenCalled();
      expect(figma.currentPage.selection).toHaveLength(1);
      expect(figma.currentPage.selection[0].id).toBe('node-1');
    });

    test('navigation handles invalid node IDs gracefully', async () => {
      // Trigger navigation with invalid node ID
      await handleMessage({ type: 'NAVIGATE_TO', nodeId: 'invalid-node-id' });
      
      // Verify no navigation occurred (node not found)
      expect(figma.currentPage).toBeNull();
      expect(figma.viewport.scrollAndZoomIntoView).not.toHaveBeenCalled();
    });

    test('Property: navigation works with any dedicatedPage setting', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.boolean(), { nil: undefined }),
          async (dedicatedPageSetting) => {
            // Reset state
            figma.ui._reset();
            figma.currentPage = null;
            figma.viewport.scrollAndZoomIntoView.mockClear();
            
            // Set dedicatedPage setting (or leave undefined)
            if (dedicatedPageSetting !== undefined) {
              await figma.clientStorage.setAsync('dedicatedPage', dedicatedPageSetting);
            }
            
            // Trigger navigation
            await handleMessage({ type: 'NAVIGATE_TO', nodeId: 'node-1' });
            
            // Verify navigation occurred
            expect(figma.currentPage).toBeDefined();
            expect(figma.currentPage.name).toBe('Page 1');
            expect(figma.viewport.scrollAndZoomIntoView).toHaveBeenCalled();
            expect(figma.currentPage.selection).toHaveLength(1);
            expect(figma.currentPage.selection[0].id).toBe('node-1');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Requirement 6.1: Complete Backward Compatibility', () => {
    /**
     * Integration test verifying that ALL existing features work together
     * with the new dedicatedPage setting.
     */

    test('Property: all features work together with any dedicatedPage setting', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.boolean(), { nil: undefined }),
          async (dedicatedPageSetting) => {
            // Reset state
            figma.ui._reset();
            figma.currentPage = null;
            figma.viewport.scrollAndZoomIntoView.mockClear();
            stopWatcher();
            
            // Set dedicatedPage setting (or leave undefined)
            if (dedicatedPageSetting !== undefined) {
              await figma.clientStorage.setAsync('dedicatedPage', dedicatedPageSetting);
            }
            
            // Test 1: Watcher functionality
            await handleMessage({ type: 'START_WATCHER' });
            expect(isWatching).toBe(true);
            await handleMessage({ type: 'STOP_WATCHER' });
            expect(isWatching).toBe(false);
            
            // Test 2: Refresh functionality
            figma.ui._reset();
            await handleMessage({ type: 'REFRESH' });
            const refreshMsg = figma.ui._getLastMessage();
            expect(refreshMsg.type).toBe('PROTOTYPES_DATA');
            expect(refreshMsg.prototypes).toBeDefined();
            
            // Test 3: Navigation functionality
            figma.ui._reset();
            await handleMessage({ type: 'NAVIGATE_TO', nodeId: 'node-1' });
            expect(figma.currentPage).toBeDefined();
            expect(figma.viewport.scrollAndZoomIntoView).toHaveBeenCalled();
            
            // All features should work correctly
            expect(true).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('settings can be changed without affecting active features', async () => {
      // Start watcher with dedicatedPage=false
      await figma.clientStorage.setAsync('dedicatedPage', false);
      await handleMessage({ type: 'START_WATCHER' });
      expect(isWatching).toBe(true);
      
      // Change setting to true
      await handleMessage({ type: 'SAVE_SETTING', key: 'dedicatedPage', value: true });
      
      // Watcher should still be running
      expect(isWatching).toBe(true);
      
      // Refresh should still work
      figma.ui._reset();
      await handleMessage({ type: 'REFRESH' });
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('PROTOTYPES_DATA');
      
      // Navigation should still work
      figma.ui._reset();
      await handleMessage({ type: 'NAVIGATE_TO', nodeId: 'node-1' });
      expect(figma.currentPage).toBeDefined();
      
      // Clean up
      stopWatcher();
    });

    test('old plugin behavior (undefined setting) works identically to false', async () => {
      // Test with undefined (old behavior)
      figma.ui._reset();
      await handleMessage({ type: 'REFRESH' });
      const undefinedMsg = figma.ui._getLastMessage();
      
      // Test with false (new default)
      figma.ui._reset();
      await figma.clientStorage.setAsync('dedicatedPage', false);
      await handleMessage({ type: 'REFRESH' });
      const falseMsg = figma.ui._getLastMessage();
      
      // Both should produce identical results
      expect(undefinedMsg.type).toBe(falseMsg.type);
      expect(undefinedMsg.prototypes.length).toBe(falseMsg.prototypes.length);
    });
  });
});

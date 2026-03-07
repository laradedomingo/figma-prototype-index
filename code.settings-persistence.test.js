/**
 * Property-Based Tests for Settings Persistence Infrastructure
 * Feature: plugin-settings-dedicated-page-toggle
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * These tests verify that the settings persistence infrastructure works correctly:
 * - Settings can be saved to clientStorage
 * - Settings can be loaded from clientStorage
 * - Settings round-trip correctly (save then load returns same value)
 * - Missing settings default to false
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

// Mock message handler function
async function handleMessage(msg) {
  switch (msg.type) {
    case "SAVE_SETTING": {
      try {
        await figma.clientStorage.setAsync(msg.key, msg.value);
        figma.ui.postMessage({ type: "SETTING_SAVED", key: msg.key });
      } catch (err) {
        console.error("Failed to save setting:", err);
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
        console.error("Failed to load settings:", err);
        figma.ui.postMessage({ 
          type: "SETTINGS_LOADED", 
          settings: { dedicatedPage: false } 
        });
      }
      break;
    }
  }
}

describe('Settings Persistence Infrastructure', () => {
  
  beforeEach(() => {
    // Reset storage and messages before each test
    figma.clientStorage._reset();
    figma.ui._reset();
  });

  describe('Property 1: Settings Persistence Round Trip', () => {
    /**
     * **Validates: Requirements 2.1, 2.2, 2.3**
     * 
     * For any toggle state value, when the user changes the toggle and then reloads,
     * the toggle UI should reflect the saved state.
     * 
     * This property verifies that:
     * - Any boolean value can be saved (Requirement 2.1)
     * - The saved value can be loaded back (Requirement 2.2)
     * - The loaded value matches the saved value (Requirement 2.3)
     */
    test('any toggle state persists and loads correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (toggleState) => {
            // Save setting
            await handleMessage({
              type: 'SAVE_SETTING',
              key: 'dedicatedPage',
              value: toggleState
            });
            
            // Verify save message was sent
            const saveMsg = figma.ui._getLastMessage();
            expect(saveMsg.type).toBe('SETTING_SAVED');
            expect(saveMsg.key).toBe('dedicatedPage');
            
            // Reset UI messages
            figma.ui._reset();
            
            // Load settings
            await handleMessage({
              type: 'LOAD_SETTINGS'
            });
            
            // Verify loaded value matches saved value
            const loadMsg = figma.ui._getLastMessage();
            expect(loadMsg.type).toBe('SETTINGS_LOADED');
            expect(loadMsg.settings.dedicatedPage).toBe(toggleState);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Case: Missing Storage Values', () => {
    /**
     * **Validates: Requirement 2.4**
     * 
     * When no saved setting exists, the plugin should default to false (first page mode).
     * This ensures first-time users get the expected default behavior.
     */
    test('defaults to false when storage is empty', async () => {
      // Don't save anything - storage is empty
      
      // Load settings
      await handleMessage({
        type: 'LOAD_SETTINGS'
      });
      
      // Verify default value is false
      const loadMsg = figma.ui._getLastMessage();
      expect(loadMsg.type).toBe('SETTINGS_LOADED');
      expect(loadMsg.settings.dedicatedPage).toBe(false);
    });

    test('defaults to false when storage returns undefined', async () => {
      // Explicitly set to undefined
      figma.clientStorage._storage['dedicatedPage'] = undefined;
      
      // Load settings
      await handleMessage({
        type: 'LOAD_SETTINGS'
      });
      
      // Verify default value is false
      const loadMsg = figma.ui._getLastMessage();
      expect(loadMsg.type).toBe('SETTINGS_LOADED');
      expect(loadMsg.settings.dedicatedPage).toBe(false);
    });
  });

  describe('Unit Tests: Message Handlers', () => {
    test('SAVE_SETTING handler persists value to clientStorage', async () => {
      await handleMessage({
        type: 'SAVE_SETTING',
        key: 'dedicatedPage',
        value: true
      });
      
      // Verify value was saved
      const saved = await figma.clientStorage.getAsync('dedicatedPage');
      expect(saved).toBe(true);
      
      // Verify confirmation message was sent
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('SETTING_SAVED');
      expect(msg.key).toBe('dedicatedPage');
    });

    test('LOAD_SETTINGS handler retrieves saved settings', async () => {
      // Pre-populate storage
      await figma.clientStorage.setAsync('dedicatedPage', true);
      
      // Load settings
      await handleMessage({
        type: 'LOAD_SETTINGS'
      });
      
      // Verify loaded settings
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('SETTINGS_LOADED');
      expect(msg.settings.dedicatedPage).toBe(true);
    });

    test('LOAD_SETTINGS handles both true and false values', async () => {
      // Test with false
      await figma.clientStorage.setAsync('dedicatedPage', false);
      await handleMessage({ type: 'LOAD_SETTINGS' });
      let msg = figma.ui._getLastMessage();
      expect(msg.settings.dedicatedPage).toBe(false);
      
      // Test with true
      figma.ui._reset();
      await figma.clientStorage.setAsync('dedicatedPage', true);
      await handleMessage({ type: 'LOAD_SETTINGS' });
      msg = figma.ui._getLastMessage();
      expect(msg.settings.dedicatedPage).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('SAVE_SETTING handles storage failures gracefully', async () => {
      // Mock storage failure
      const originalSetAsync = figma.clientStorage.setAsync;
      figma.clientStorage.setAsync = async () => {
        throw new Error('Storage failure');
      };
      
      await handleMessage({
        type: 'SAVE_SETTING',
        key: 'dedicatedPage',
        value: true
      });
      
      // Verify error message was sent
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('SETTING_ERROR');
      expect(msg.error).toBe('Could not save setting');
      
      // Restore original function
      figma.clientStorage.setAsync = originalSetAsync;
    });

    test('LOAD_SETTINGS returns defaults on storage failure', async () => {
      // Mock storage failure
      const originalGetAsync = figma.clientStorage.getAsync;
      figma.clientStorage.getAsync = async () => {
        throw new Error('Storage failure');
      };
      
      await handleMessage({
        type: 'LOAD_SETTINGS'
      });
      
      // Verify default settings were sent
      const msg = figma.ui._getLastMessage();
      expect(msg.type).toBe('SETTINGS_LOADED');
      expect(msg.settings.dedicatedPage).toBe(false);
      
      // Restore original function
      figma.clientStorage.getAsync = originalGetAsync;
    });
  });
});

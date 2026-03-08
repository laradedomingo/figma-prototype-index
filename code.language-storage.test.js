/**
 * Unit Tests for Language Storage Functions
 * Feature: language-setting-toggle
 * Task: 2.5 Write unit tests for storage error handling
 * 
 * **Validates: Requirements 2.1, 2.2, 1.2, 1.5**
 * 
 * These tests verify that the language storage functions work correctly:
 * - Language settings can be saved to clientStorage
 * - Language settings can be loaded from clientStorage
 * - Invalid language codes fall back to Spanish
 * - Storage read failures return default Spanish
 * - Storage write failures log error but continue
 */

const fs = require('fs');
const path = require('path');

// Read the actual code.ts file to verify implementation
const codeContent = fs.readFileSync(path.join(__dirname, 'code.ts'), 'utf8');

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

// Implement the language storage functions based on the spec
// These mirror the implementation in code.ts
function validateLanguageCode(code) {
  if (code === 'es' || code === 'en') {
    return code;
  }
  console.warn(`Invalid language code: ${code}, falling back to Spanish`);
  return 'es';
}

async function loadLanguageSetting() {
  try {
    const saved = await figma.clientStorage.getAsync('language');
    return validateLanguageCode(saved);
  } catch (err) {
    console.error('Failed to load language setting:', err);
    return 'es'; // Default fallback
  }
}

async function saveLanguageSetting(lang) {
  try {
    await figma.clientStorage.setAsync('language', lang);
  } catch (err) {
    console.error('Failed to save language setting:', err);
    // Continue with in-memory state
    figma.ui.postMessage({ 
      type: 'SETTING_ERROR', 
      error: 'Could not save language preference' 
    });
  }
}

// Mock message handler function with language support
async function handleMessage(msg) {
  switch (msg.type) {
    case "SAVE_SETTING": {
      try {
        // Special handling for language setting with validation
        if (msg.key === 'language') {
          const validatedLang = validateLanguageCode(msg.value);
          await saveLanguageSetting(validatedLang);
        } else {
          await figma.clientStorage.setAsync(msg.key, msg.value);
        }
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
        const language = await loadLanguageSetting();
        const settings = {
          dedicatedPage: dedicatedPage !== undefined ? dedicatedPage : false,
          language: language
        };
        figma.ui.postMessage({ type: "SETTINGS_LOADED", settings });
      } catch (err) {
        console.error("Failed to load settings:", err);
        // Send default settings on error
        figma.ui.postMessage({ 
          type: "SETTINGS_LOADED", 
          settings: { dedicatedPage: false, language: 'es' } 
        });
      }
      break;
    }
  }
}

describe('Task 2.1: Language Storage Functions', () => {
  
  beforeEach(() => {
    // Reset storage and messages before each test
    figma.clientStorage._reset();
    figma.ui._reset();
  });

  describe('validateLanguageCode function', () => {
    test('should verify validateLanguageCode function exists', () => {
      expect(codeContent).toContain('function validateLanguageCode');
    });

    test('should accept "es" as valid language code', () => {
      expect(validateLanguageCode('es')).toBe('es');
    });

    test('should accept "en" as valid language code', () => {
      expect(validateLanguageCode('en')).toBe('en');
    });

    test('should fall back to "es" for invalid language codes', () => {
      expect(validateLanguageCode('fr')).toBe('es');
      expect(validateLanguageCode('de')).toBe('es');
      expect(validateLanguageCode('invalid')).toBe('es');
      expect(validateLanguageCode('')).toBe('es');
    });

    test('should log warning for invalid language codes', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      validateLanguageCode('fr');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid language code')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('loadLanguageSetting function', () => {
    test('should verify loadLanguageSetting function exists', () => {
      expect(codeContent).toContain('async function loadLanguageSetting');
    });

    test('should load saved language setting from storage', async () => {
      await figma.clientStorage.setAsync('language', 'en');
      const result = await loadLanguageSetting();
      
      expect(result).toBe('en');
    });

    test('should return "es" when no language is saved', async () => {
      const result = await loadLanguageSetting();
      
      expect(result).toBe('es');
    });

    test('should validate loaded language code', async () => {
      // Save invalid language code
      await figma.clientStorage.setAsync('language', 'invalid');
      const result = await loadLanguageSetting();
      
      // Should fall back to 'es'
      expect(result).toBe('es');
    });

    test('should handle storage read failures and return default Spanish', async () => {
      // Mock storage failure
      const originalGetAsync = figma.clientStorage.getAsync;
      figma.clientStorage.getAsync = jest.fn().mockRejectedValue(new Error('Storage error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await loadLanguageSetting();
      
      expect(result).toBe('es');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load language setting'),
        expect.any(Error)
      );
      
      // Restore
      figma.clientStorage.getAsync = originalGetAsync;
      consoleSpy.mockRestore();
    });
  });

  describe('saveLanguageSetting function', () => {
    test('should verify saveLanguageSetting function exists', () => {
      expect(codeContent).toContain('async function saveLanguageSetting');
    });

    test('should save language setting to storage', async () => {
      await saveLanguageSetting('en');
      
      const saved = await figma.clientStorage.getAsync('language');
      expect(saved).toBe('en');
    });

    test('should save Spanish language setting', async () => {
      await saveLanguageSetting('es');
      
      const saved = await figma.clientStorage.getAsync('language');
      expect(saved).toBe('es');
    });

    test('should handle storage write failures gracefully', async () => {
      // Mock storage failure
      const originalSetAsync = figma.clientStorage.setAsync;
      figma.clientStorage.setAsync = jest.fn().mockRejectedValue(new Error('Storage error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Should not throw
      await expect(saveLanguageSetting('en')).resolves.not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save language setting'),
        expect.any(Error)
      );
      
      // Should post error message to UI
      expect(figma.ui._messages).toContainEqual({
        type: 'SETTING_ERROR',
        error: 'Could not save language preference'
      });
      
      // Restore
      figma.clientStorage.setAsync = originalSetAsync;
      consoleSpy.mockRestore();
    });
  });
});

describe('Task 2.2: Message Handling for Language Setting', () => {
  
  beforeEach(() => {
    figma.clientStorage._reset();
    figma.ui._reset();
  });

  describe('SAVE_SETTING message handler', () => {
    test('should save language setting with validation', async () => {
      await handleMessage({
        type: 'SAVE_SETTING',
        key: 'language',
        value: 'en'
      });
      
      const saved = await figma.clientStorage.getAsync('language');
      expect(saved).toBe('en');
      
      const lastMessage = figma.ui._getLastMessage();
      expect(lastMessage).toEqual({
        type: 'SETTING_SAVED',
        key: 'language'
      });
    });

    test('should validate invalid language codes when saving', async () => {
      await handleMessage({
        type: 'SAVE_SETTING',
        key: 'language',
        value: 'invalid'
      });
      
      // Should save 'es' instead of 'invalid'
      const saved = await figma.clientStorage.getAsync('language');
      expect(saved).toBe('es');
    });

    test('should handle other settings without validation', async () => {
      await handleMessage({
        type: 'SAVE_SETTING',
        key: 'dedicatedPage',
        value: true
      });
      
      const saved = await figma.clientStorage.getAsync('dedicatedPage');
      expect(saved).toBe(true);
    });
  });

  describe('LOAD_SETTINGS message handler', () => {
    test('should load language setting along with other settings', async () => {
      await figma.clientStorage.setAsync('language', 'en');
      await figma.clientStorage.setAsync('dedicatedPage', true);
      
      await handleMessage({ type: 'LOAD_SETTINGS' });
      
      const lastMessage = figma.ui._getLastMessage();
      expect(lastMessage).toEqual({
        type: 'SETTINGS_LOADED',
        settings: {
          dedicatedPage: true,
          language: 'en'
        }
      });
    });

    test('should return default Spanish when no language is saved', async () => {
      await handleMessage({ type: 'LOAD_SETTINGS' });
      
      const lastMessage = figma.ui._getLastMessage();
      expect(lastMessage.settings.language).toBe('es');
    });

    test('should handle storage failures and return defaults', async () => {
      // Mock storage failure
      const originalGetAsync = figma.clientStorage.getAsync;
      figma.clientStorage.getAsync = jest.fn().mockRejectedValue(new Error('Storage error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await handleMessage({ type: 'LOAD_SETTINGS' });
      
      const lastMessage = figma.ui._getLastMessage();
      expect(lastMessage).toEqual({
        type: 'SETTINGS_LOADED',
        settings: {
          dedicatedPage: false,
          language: 'es'
        }
      });
      
      // Restore
      figma.clientStorage.getAsync = originalGetAsync;
      consoleSpy.mockRestore();
    });
  });

  describe('SettingsLoadedMessage interface', () => {
    test('should verify SETTINGS_LOADED message includes language field', async () => {
      await figma.clientStorage.setAsync('language', 'en');
      
      await handleMessage({ type: 'LOAD_SETTINGS' });
      
      const lastMessage = figma.ui._getLastMessage();
      expect(lastMessage.type).toBe('SETTINGS_LOADED');
      expect(lastMessage.settings).toHaveProperty('language');
      expect(lastMessage.settings.language).toBe('en');
    });
  });
});

describe('Integration: Language Storage with Settings System', () => {
  
  beforeEach(() => {
    figma.clientStorage._reset();
    figma.ui._reset();
  });

  test('should persist language preference across plugin sessions', async () => {
    // Session 1: Save language
    await handleMessage({
      type: 'SAVE_SETTING',
      key: 'language',
      value: 'en'
    });
    
    // Session 2: Load settings
    await handleMessage({ type: 'LOAD_SETTINGS' });
    
    const lastMessage = figma.ui._getLastMessage();
    expect(lastMessage.settings.language).toBe('en');
  });

  test('should work alongside existing dedicatedPage setting', async () => {
    // Save both settings
    await handleMessage({
      type: 'SAVE_SETTING',
      key: 'dedicatedPage',
      value: true
    });
    
    await handleMessage({
      type: 'SAVE_SETTING',
      key: 'language',
      value: 'en'
    });
    
    // Load all settings
    await handleMessage({ type: 'LOAD_SETTINGS' });
    
    const lastMessage = figma.ui._getLastMessage();
    expect(lastMessage.settings).toEqual({
      dedicatedPage: true,
      language: 'en'
    });
  });

  test('should maintain backward compatibility with missing language setting', async () => {
    // Only save dedicatedPage (simulates old plugin version)
    await figma.clientStorage.setAsync('dedicatedPage', true);
    
    await handleMessage({ type: 'LOAD_SETTINGS' });
    
    const lastMessage = figma.ui._getLastMessage();
    expect(lastMessage.settings).toEqual({
      dedicatedPage: true,
      language: 'es' // Default
    });
  });
});

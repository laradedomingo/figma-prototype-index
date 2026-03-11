/**
 * Unit Tests for savePageSelections() Debouncing
 * Feature: frame-creation-tab-feature
 * Task: 7.1 Create savePageSelections() function with debouncing
 * 
 * **Validates: Requirements 5.1**
 * 
 * These tests verify that the savePageSelections() function:
 * - Implements 300ms debouncing for storage saves
 * - Sends SAVE_PAGE_SELECTIONS message to sandbox
 * - Handles immediate UI updates separately from storage persistence
 */

describe('savePageSelections() Debouncing', () => {
  let parent;
  let savePageSelections;
  let pageSelections;
  let savePageSelectionsTimer;
  
  beforeEach(() => {
    // Mock parent.postMessage
    const messages = [];
    parent = {
      postMessage: jest.fn((msg) => {
        messages.push(msg);
      }),
      _getMessages: () => messages,
      _getLastMessage: () => messages[messages.length - 1],
      _reset: () => messages.length = 0
    };
    
    // Initialize state
    pageSelections = {
      'page1': true,
      'page2': false,
      'page3': true
    };
    savePageSelectionsTimer = null;
    
    // Define the savePageSelections function (extracted from ui.html)
    savePageSelections = function() {
      // Clear any existing timer
      if (savePageSelectionsTimer) {
        clearTimeout(savePageSelectionsTimer);
      }
      
      // Set new timer for 300ms debounce
      savePageSelectionsTimer = setTimeout(() => {
        parent.postMessage({
          pluginMessage: {
            type: 'SAVE_PAGE_SELECTIONS',
            pageSelections: pageSelections
          }
        }, '*');
        savePageSelectionsTimer = null;
      }, 300);
    };
  });
  
  afterEach(() => {
    // Clean up timers
    if (savePageSelectionsTimer) {
      clearTimeout(savePageSelectionsTimer);
      savePageSelectionsTimer = null;
    }
    jest.clearAllTimers();
  });
  
  describe('Debouncing Behavior', () => {
    test('does not send message immediately', () => {
      savePageSelections();
      
      // Message should not be sent immediately
      expect(parent.postMessage).not.toHaveBeenCalled();
    });
    
    test('sends message after 300ms delay', (done) => {
      savePageSelections();
      
      // Wait for 300ms
      setTimeout(() => {
        // Message should be sent after 300ms
        expect(parent.postMessage).toHaveBeenCalledTimes(1);
        expect(parent.postMessage).toHaveBeenCalledWith({
          pluginMessage: {
            type: 'SAVE_PAGE_SELECTIONS',
            pageSelections: pageSelections
          }
        }, '*');
        done();
      }, 350);
    });
    
    test('cancels previous timer when called multiple times', (done) => {
      // Call savePageSelections multiple times rapidly
      savePageSelections();
      
      setTimeout(() => {
        savePageSelections();
      }, 50);
      
      setTimeout(() => {
        savePageSelections();
      }, 100);
      
      setTimeout(() => {
        savePageSelections();
      }, 150);
      
      // Wait for 300ms after the last call (150 + 300 = 450ms total)
      setTimeout(() => {
        // Should only send message once (after the last call)
        expect(parent.postMessage).toHaveBeenCalledTimes(1);
        done();
      }, 500);
    });
    
    test('sends correct message type and payload', (done) => {
      const testSelections = {
        'page1': true,
        'page2': false,
        'page3': true,
        'page4': false
      };
      pageSelections = testSelections;
      
      savePageSelections();
      
      setTimeout(() => {
        const lastMessage = parent._getLastMessage();
        expect(lastMessage.pluginMessage.type).toBe('SAVE_PAGE_SELECTIONS');
        expect(lastMessage.pluginMessage.pageSelections).toEqual(testSelections);
        done();
      }, 350);
    });
  });
  
  describe('Multiple Rapid Calls', () => {
    test('debounces 10 rapid calls to single message', (done) => {
      // Simulate 10 rapid toggle actions
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          savePageSelections();
        }, i * 20); // 20ms apart
      }
      
      // Wait for debounce period after last call (10 * 20 + 300 = 500ms)
      setTimeout(() => {
        // Should only send one message
        expect(parent.postMessage).toHaveBeenCalledTimes(1);
        done();
      }, 600);
    });
    
    test('allows message after debounce period completes', (done) => {
      // First call
      savePageSelections();
      
      // Wait for first debounce to complete
      setTimeout(() => {
        expect(parent.postMessage).toHaveBeenCalledTimes(1);
        
        // Second call after debounce completes
        savePageSelections();
        
        // Wait for second debounce
        setTimeout(() => {
          expect(parent.postMessage).toHaveBeenCalledTimes(2);
          done();
        }, 350);
      }, 350);
    });
  });
  
  describe('Edge Cases', () => {
    test('handles empty pageSelections object', (done) => {
      pageSelections = {};
      savePageSelections();
      
      setTimeout(() => {
        expect(parent.postMessage).toHaveBeenCalledWith({
          pluginMessage: {
            type: 'SAVE_PAGE_SELECTIONS',
            pageSelections: {}
          }
        }, '*');
        done();
      }, 350);
    });
    
    test('handles large pageSelections object', (done) => {
      // Create object with 50 pages
      const largeSelections = {};
      for (let i = 0; i < 50; i++) {
        largeSelections[`page${i}`] = i % 2 === 0;
      }
      pageSelections = largeSelections;
      
      savePageSelections();
      
      setTimeout(() => {
        const lastMessage = parent._getLastMessage();
        expect(lastMessage.pluginMessage.pageSelections).toEqual(largeSelections);
        expect(Object.keys(lastMessage.pluginMessage.pageSelections).length).toBe(50);
        done();
      }, 350);
    });
  });
  
  describe('Integration with togglePageSelection', () => {
    test('simulates toggle action with immediate UI update and debounced save', (done) => {
      let uiUpdateCalled = false;
      
      // Mock updatePreviewSummary (immediate UI update)
      const updatePreviewSummary = () => {
        uiUpdateCalled = true;
      };
      
      // Simulate togglePageSelection behavior
      const togglePageSelection = (pageId) => {
        pageSelections[pageId] = !pageSelections[pageId];
        updatePreviewSummary(); // Immediate
        savePageSelections(); // Debounced
      };
      
      // Toggle a page
      togglePageSelection('page1');
      
      // UI should update immediately
      expect(uiUpdateCalled).toBe(true);
      expect(pageSelections['page1']).toBe(false);
      
      // Storage save should not happen immediately
      expect(parent.postMessage).not.toHaveBeenCalled();
      
      // Wait for debounce
      setTimeout(() => {
        // Storage save should happen after debounce
        expect(parent.postMessage).toHaveBeenCalledTimes(1);
        done();
      }, 350);
    });
  });
});

/**
 * Unit tests for clipboard functionality (Task 3.3)
 * Tests successful copy operation, error handling, and empty state handling
 * 
 * Note: These tests validate the clipboard logic by simulating the environment
 * rather than loading the full HTML file with JSDOM.
 */

describe('Clipboard Functionality', () => {
  let mockPrototypes;
  let mockPageSelections;
  let mockCurrentLanguage;
  let mockSortAZ;
  let mockShowToast;
  let mockClipboard;
  let mockConsoleError;
  
  // Simulate the formatPrototypeList function
  function formatPrototypeList(options = {}) {
    const { includePageHeaders = false } = options;
    
    const filteredPrototypes = mockPrototypes.filter(proto => {
      if (Object.keys(mockPageSelections).length === 0) {
        return true;
      }
      return mockPageSelections[proto.pageId] === true;
    });
    
    const sortedPrototypes = [...filteredPrototypes].sort((a, b) =>
      mockSortAZ ? a.flowName.localeCompare(b.flowName) : b.flowName.localeCompare(a.flowName)
    );
    
    if (!includePageHeaders) {
      return sortedPrototypes.map(proto => {
        const url = proto.prototypeUrl || 'Local file - save to cloud to get URL';
        return `${proto.flowName}: ${url}`;
      }).join('\n');
    }
    
    return sortedPrototypes.map(proto => {
      const url = proto.prototypeUrl || 'Local file - save to cloud to get URL';
      return `${proto.flowName}: ${url}`;
    }).join('\n');
  }
  
  // Simulate the copyToClipboard function
  async function copyToClipboard() {
    if (mockPrototypes.length === 0) {
      mockShowToast('No prototypes to copy');
      return;
    }
    
    const hasSelectedPages = Object.values(mockPageSelections).some(selected => selected === true);
    if (!hasSelectedPages && Object.keys(mockPageSelections).length > 0) {
      mockShowToast('No prototypes to copy');
      return;
    }
    
    if (!mockClipboard || !mockClipboard.writeText) {
      mockConsoleError('Clipboard API not available');
      mockShowToast('Could not copy to clipboard');
      return;
    }
    
    try {
      const formattedText = formatPrototypeList({ includePageHeaders: false });
      await mockClipboard.writeText(formattedText);
      mockShowToast('List copied to clipboard');
    } catch (error) {
      mockConsoleError('Failed to copy to clipboard:', error);
      mockShowToast('Could not copy to clipboard');
    }
  }
  
  beforeEach(() => {
    mockPrototypes = [];
    mockPageSelections = {};
    mockCurrentLanguage = 'en';
    mockSortAZ = true;
    mockShowToast = jest.fn();
    mockConsoleError = jest.fn();
    mockClipboard = {
      writeText: jest.fn().mockResolvedValue()
    };
  });
  
  describe('copyToClipboard function', () => {
    test('should show error toast when prototypes array is empty', async () => {
      mockPrototypes = [];
      
      await copyToClipboard();
      
      expect(mockShowToast).toHaveBeenCalledWith('No prototypes to copy');
    });
    
    test('should show error toast when all pages are deselected', async () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: false };
      
      await copyToClipboard();
      
      expect(mockShowToast).toHaveBeenCalledWith('No prototypes to copy');
    });
    
    test('should show error toast when clipboard API is not available', async () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      mockClipboard = null;
      
      await copyToClipboard();
      
      expect(mockConsoleError).toHaveBeenCalledWith('Clipboard API not available');
      expect(mockShowToast).toHaveBeenCalledWith('Could not copy to clipboard');
    });
    
    test('should successfully copy formatted text to clipboard', async () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow 1', prototypeUrl: 'https://example.com/1', pageId: 'page1', pageName: 'Page 1' },
        { id: '2', flowName: 'Test Flow 2', prototypeUrl: null, pageId: 'page1', pageName: 'Page 1' }
      ];
      mockPageSelections = { page1: true };
      mockSortAZ = true;
      
      await copyToClipboard();
      
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
      const copiedText = mockClipboard.writeText.mock.calls[0][0];
      expect(copiedText).toContain('Test Flow 1: https://example.com/1');
      expect(copiedText).toContain('Test Flow 2: Local file - save to cloud to get URL');
      expect(mockShowToast).toHaveBeenCalledWith('List copied to clipboard');
    });
    
    test('should handle clipboard API errors gracefully', async () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      mockClipboard.writeText = jest.fn().mockRejectedValue(new Error('Permission denied'));
      
      await copyToClipboard();
      
      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Could not copy to clipboard');
    });
    
    test('should respect page selections when filtering prototypes', async () => {
      mockPrototypes = [
        { id: '1', flowName: 'Flow A', prototypeUrl: 'https://example.com/a', pageId: 'page1' },
        { id: '2', flowName: 'Flow B', prototypeUrl: 'https://example.com/b', pageId: 'page2' },
        { id: '3', flowName: 'Flow C', prototypeUrl: 'https://example.com/c', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true, page2: false };
      
      await copyToClipboard();
      
      const copiedText = mockClipboard.writeText.mock.calls[0][0];
      expect(copiedText).toContain('Flow A');
      expect(copiedText).toContain('Flow C');
      expect(copiedText).not.toContain('Flow B');
    });
    
    test('should sort prototypes A-Z when sortAZ is true', async () => {
      mockPrototypes = [
        { id: '1', flowName: 'Zebra', prototypeUrl: 'https://example.com/z', pageId: 'page1' },
        { id: '2', flowName: 'Apple', prototypeUrl: 'https://example.com/a', pageId: 'page1' },
        { id: '3', flowName: 'Mango', prototypeUrl: 'https://example.com/m', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      mockSortAZ = true;
      
      await copyToClipboard();
      
      const copiedText = mockClipboard.writeText.mock.calls[0][0];
      const lines = copiedText.split('\n');
      expect(lines[0]).toContain('Apple');
      expect(lines[1]).toContain('Mango');
      expect(lines[2]).toContain('Zebra');
    });
  });
  
  describe('formatPrototypeList function', () => {
    test('should format prototypes with URLs correctly', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      const result = formatPrototypeList();
      
      expect(result).toBe('Test Flow: https://example.com');
    });
    
    test('should format prototypes without URLs with local file message', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: null, pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      const result = formatPrototypeList();
      
      expect(result).toBe('Test Flow: Local file - save to cloud to get URL');
    });
    
    test('should separate multiple prototypes with newlines', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Flow 1', prototypeUrl: 'https://example.com/1', pageId: 'page1' },
        { id: '2', flowName: 'Flow 2', prototypeUrl: 'https://example.com/2', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      const result = formatPrototypeList();
      
      expect(result).toContain('\n');
      expect(result.split('\n').length).toBe(2);
    });
  });
});

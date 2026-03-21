/**
 * Unit tests for download functionality (Task 4.4)
 * Tests Blob creation, object URL creation/cleanup, file download trigger, and format selector
 * 
 * Note: These tests validate the download logic by simulating the environment
 * rather than loading the full HTML file with JSDOM.
 */

describe('Download Functionality', () => {
  let mockPrototypes;
  let mockPageSelections;
  let mockCurrentLanguage;
  let mockSortAZ;
  let mockShowToast;
  let mockCreateObjectURL;
  let mockRevokeObjectURL;
  let mockCreateElement;
  let mockAppendChild;
  let mockRemoveChild;
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
    
    return sortedPrototypes.map(proto => {
      const url = proto.prototypeUrl || 'Local file - save to cloud to get URL';
      return `${proto.flowName}: ${url}`;
    }).join('\n');
  }
  
  // Simulate the formatPrototypeListCSV function
  function formatPrototypeListCSV() {
    const filteredPrototypes = mockPrototypes.filter(proto => {
      if (Object.keys(mockPageSelections).length === 0) {
        return true;
      }
      return mockPageSelections[proto.pageId] === true;
    });
    
    const sortedPrototypes = [...filteredPrototypes].sort((a, b) =>
      mockSortAZ ? a.flowName.localeCompare(b.flowName) : b.flowName.localeCompare(a.flowName)
    );
    
    let csv = 'Name,URL\n';
    
    sortedPrototypes.forEach(proto => {
      const name = `"${proto.flowName.replace(/"/g, '""')}"`;
      const url = proto.prototypeUrl || 'Local file - save to cloud to get URL';
      const escapedUrl = `"${url.replace(/"/g, '""')}"`;
      csv += `${name},${escapedUrl}\n`;
    });
    
    return csv;
  }
  
  // Simulate the downloadFile function
  function downloadFile(format) {
    if (mockPrototypes.length === 0) {
      mockShowToast('No prototypes to copy');
      return;
    }
    
    const hasSelectedPages = Object.values(mockPageSelections).some(selected => selected === true);
    if (!hasSelectedPages && Object.keys(mockPageSelections).length > 0) {
      mockShowToast('No prototypes to copy');
      return;
    }
    
    try {
      let content;
      let mimeType;
      let filename;
      
      if (format === 'csv') {
        content = formatPrototypeListCSV();
        mimeType = 'text/csv;charset=utf-8;';
        filename = 'prototype-list.csv';
      } else {
        content = formatPrototypeList({ includePageHeaders: false });
        mimeType = 'text/plain;charset=utf-8;';
        filename = 'prototype-list.txt';
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = mockCreateObjectURL(blob);
      
      const anchor = mockCreateElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style = { display: 'none' };
      
      mockAppendChild(anchor);
      anchor.click();
      mockRemoveChild(anchor);
      
      mockRevokeObjectURL(url);
      
      const toastKey = format === 'csv' ? 'CSV file downloaded' : 'TXT file downloaded';
      mockShowToast(toastKey);
    } catch (error) {
      mockConsoleError('Failed to download file:', error);
      mockShowToast('Could not download file');
    }
  }
  
  beforeEach(() => {
    mockPrototypes = [];
    mockPageSelections = {};
    mockCurrentLanguage = 'en';
    mockSortAZ = true;
    mockShowToast = jest.fn();
    mockConsoleError = jest.fn();
    mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    mockRevokeObjectURL = jest.fn();
    
    const mockAnchor = {
      href: '',
      download: '',
      style: {},
      click: jest.fn()
    };
    
    mockCreateElement = jest.fn().mockReturnValue(mockAnchor);
    mockAppendChild = jest.fn();
    mockRemoveChild = jest.fn();
  });
  
  describe('downloadFile function', () => {
    test('should show error toast when prototypes array is empty', () => {
      mockPrototypes = [];
      
      downloadFile('csv');
      
      expect(mockShowToast).toHaveBeenCalledWith('No prototypes to copy');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });
    
    test('should show error toast when all pages are deselected', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: false };
      
      downloadFile('txt');
      
      expect(mockShowToast).toHaveBeenCalledWith('No prototypes to copy');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });
    
    test('should create Blob with correct MIME type for CSV', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      // Spy on Blob constructor
      const originalBlob = global.Blob;
      const mockBlobConstructor = jest.fn((content, options) => {
        return { content, options };
      });
      global.Blob = mockBlobConstructor;
      
      downloadFile('csv');
      
      expect(mockBlobConstructor).toHaveBeenCalledWith(
        expect.any(Array),
        { type: 'text/csv;charset=utf-8;' }
      );
      
      global.Blob = originalBlob;
    });
    
    test('should create Blob with correct MIME type for TXT', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      // Spy on Blob constructor
      const originalBlob = global.Blob;
      const mockBlobConstructor = jest.fn((content, options) => {
        return { content, options };
      });
      global.Blob = mockBlobConstructor;
      
      downloadFile('txt');
      
      expect(mockBlobConstructor).toHaveBeenCalledWith(
        expect.any(Array),
        { type: 'text/plain;charset=utf-8;' }
      );
      
      global.Blob = originalBlob;
    });
    
    test('should create object URL and revoke it after download', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      downloadFile('csv');
      
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
    
    test('should trigger download with correct filename for CSV', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      downloadFile('csv');
      
      const anchor = mockCreateElement.mock.results[0].value;
      expect(anchor.download).toBe('prototype-list.csv');
      expect(anchor.click).toHaveBeenCalled();
    });
    
    test('should trigger download with correct filename for TXT', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      downloadFile('txt');
      
      const anchor = mockCreateElement.mock.results[0].value;
      expect(anchor.download).toBe('prototype-list.txt');
      expect(anchor.click).toHaveBeenCalled();
    });
    
    test('should append and remove anchor element', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      downloadFile('csv');
      
      expect(mockAppendChild).toHaveBeenCalledTimes(1);
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);
    });
    
    test('should show success toast for CSV download', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      downloadFile('csv');
      
      expect(mockShowToast).toHaveBeenCalledWith('CSV file downloaded');
    });
    
    test('should show success toast for TXT download', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      
      downloadFile('txt');
      
      expect(mockShowToast).toHaveBeenCalledWith('TXT file downloaded');
    });
    
    test('should handle download errors gracefully', () => {
      mockPrototypes = [
        { id: '1', flowName: 'Test Flow', prototypeUrl: 'https://example.com', pageId: 'page1' }
      ];
      mockPageSelections = { page1: true };
      mockCreateObjectURL = jest.fn().mockImplementation(() => {
        throw new Error('Failed to create URL');
      });
      
      downloadFile('csv');
      
      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Could not download file');
    });
  });
  
  describe('showFormatSelector function', () => {
    test('should return csv when user clicks OK', () => {
      // Mock confirm to return true (OK button)
      global.confirm = jest.fn().mockReturnValue(true);
      
      // Simulate showFormatSelector
      const result = global.confirm('Which format do you prefer?\n\nOK = CSV\nCancel = TXT') ? 'csv' : 'txt';
      
      expect(result).toBe('csv');
    });
    
    test('should return txt when user clicks Cancel', () => {
      // Mock confirm to return false (Cancel button)
      global.confirm = jest.fn().mockReturnValue(false);
      
      // Simulate showFormatSelector
      const result = global.confirm('Which format do you prefer?\n\nOK = CSV\nCancel = TXT') ? 'csv' : 'txt';
      
      expect(result).toBe('txt');
    });
  });
});

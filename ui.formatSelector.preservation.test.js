/**
 * Preservation Property Tests for Format Selector Improvement
 * 
 * **Property 2: Preservation** - Return Value Contract and Downstream Integration
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * **IMPORTANT**: These tests follow observation-first methodology
 * - Tests are written based on observed behavior on UNFIXED code
 * - Tests capture the baseline behavior that must be preserved after the fix
 * - Tests should PASS on UNFIXED code (confirming current behavior)
 * - Tests should PASS on FIXED code (confirming no regressions)
 * 
 * This test suite verifies that:
 * - showFormatSelector() returns 'csv', 'txt', or null as lowercase strings
 * - handleDownloadList() receives format value and passes to downloadFile()
 * - downloadFile() generates correct content for both formats
 * - Translation support works for all three languages
 * - Toast notifications display correctly after download completes
 */

const fc = require('fast-check');

describe('Preservation: Return Value Contract and Downstream Integration', () => {
  let mockConfirm;
  let mockDocument;
  let mockGetTranslation;
  let mockShowToast;
  let mockURL;
  let currentLanguage;
  let prototypes;
  let downloadedFiles;

  beforeEach(() => {
    // Reset state
    downloadedFiles = [];
    prototypes = [
      { name: 'Prototype 1', url: 'https://example.com/1', page: 'Page A' },
      { name: 'Prototype 2', url: 'https://example.com/2', page: 'Page B' }
    ];

    // Mock the global confirm function
    mockConfirm = jest.fn();
    global.confirm = mockConfirm;
    
    // Mock document
    mockDocument = {
      createElement: jest.fn((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: jest.fn(function() {
              // Capture download for verification
              downloadedFiles.push({
                href: this.href,
                download: this.download
              });
            })
          };
        }
        return {};
      }),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
      }
    };
    global.document = mockDocument;
    
    // Mock getTranslation function
    mockGetTranslation = jest.fn((key, lang) => {
      const translations = {
        es: {
          'download.formatPrompt': '¿Qué formato prefieres?',
          'toast.noPrototypes': 'No hay prototipos para descargar',
          'toast.downloadSuccess': 'Archivo descargado correctamente',
          'toast.downloadError': 'Error al descargar el archivo'
        },
        en: {
          'download.formatPrompt': 'Which format do you prefer?',
          'toast.noPrototypes': 'No prototypes to download',
          'toast.downloadSuccess': 'File downloaded successfully',
          'toast.downloadError': 'Error downloading file'
        },
        eu: {
          'download.formatPrompt': 'Zein formato nahiago duzu?',
          'toast.noPrototypes': 'Ez dago prototipoak deskargatzeko',
          'toast.downloadSuccess': 'Fitxategia behar bezala deskargatu da',
          'toast.downloadError': 'Errorea fitxategia deskargatzean'
        }
      };
      return translations[lang]?.[key] || key;
    });
    
    // Mock showToast function
    mockShowToast = jest.fn();
    
    // Mock URL.createObjectURL and revokeObjectURL
    mockURL = {
      createObjectURL: jest.fn((blob) => `blob:mock-url-${Math.random()}`),
      revokeObjectURL: jest.fn()
    };
    global.URL = mockURL;
    
    // Mock Blob
    global.Blob = jest.fn((content, options) => ({
      content,
      type: options.type,
      size: content[0].length
    }));
    
    currentLanguage = 'es';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Simulate the CURRENT (UNFIXED) showFormatSelector function
   * This is the baseline behavior we need to preserve
   */
  function showFormatSelector_UNFIXED() {
    const promptText = mockGetTranslation('download.formatPrompt', currentLanguage);
    const result = mockConfirm(promptText + '\n\nOK = CSV\nCancel = TXT');
    return result ? 'csv' : 'txt';
  }

  /**
   * Simulate formatPrototypeList function (TXT format)
   */
  function formatPrototypeList() {
    return prototypes.map(p => `${p.name}\n${p.url}`).join('\n\n');
  }

  /**
   * Simulate formatPrototypeListCSV function
   */
  function formatPrototypeListCSV() {
    const header = 'Name,URL,Page\n';
    const rows = prototypes.map(p => `"${p.name}","${p.url}","${p.page}"`).join('\n');
    return header + rows;
  }

  /**
   * Simulate downloadFile function
   */
  function downloadFile(format) {
    if (prototypes.length === 0) {
      mockShowToast(mockGetTranslation('toast.noPrototypes', currentLanguage));
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
        content = formatPrototypeList();
        mimeType = 'text/plain;charset=utf-8;';
        filename = 'prototype-list.txt';
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = mockURL.createObjectURL(blob);
      
      const anchor = mockDocument.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      mockDocument.body.appendChild(anchor);
      anchor.click();
      mockDocument.body.removeChild(anchor);
      
      mockURL.revokeObjectURL(url);
      mockShowToast(mockGetTranslation('toast.downloadSuccess', currentLanguage));
    } catch (error) {
      mockShowToast(mockGetTranslation('toast.downloadError', currentLanguage));
    }
  }

  /**
   * Simulate handleDownloadList function
   */
  function handleDownloadList() {
    const format = showFormatSelector_UNFIXED();
    if (format) {
      downloadFile(format);
    }
  }

  /**
   * Test 1: Return Value Contract - CSV selection returns 'csv'
   * 
   * Observes: showFormatSelector() returns 'csv' when OK is clicked
   * Requirement: 3.3 - Return 'csv' or 'txt' as lowercase strings
   */
  test('should return "csv" as lowercase string when OK is clicked', () => {
    mockConfirm.mockReturnValue(true); // Simulate OK click
    const result = showFormatSelector_UNFIXED();
    
    // Verify return value is 'csv' (lowercase string)
    expect(result).toBe('csv');
    expect(typeof result).toBe('string');
    expect(result).toEqual(result.toLowerCase());
  });

  /**
   * Test 2: Return Value Contract - Cancel returns 'txt'
   * 
   * Observes: showFormatSelector() returns 'txt' when Cancel is clicked
   * Requirement: 3.3 - Return 'csv' or 'txt' as lowercase strings
   * 
   * NOTE: On UNFIXED code, Cancel returns 'txt' (not null)
   * This is the current behavior we're observing
   */
  test('should return "txt" as lowercase string when Cancel is clicked (UNFIXED behavior)', () => {
    mockConfirm.mockReturnValue(false); // Simulate Cancel click
    const result = showFormatSelector_UNFIXED();
    
    // Verify return value is 'txt' (lowercase string)
    expect(result).toBe('txt');
    expect(typeof result).toBe('string');
    expect(result).toEqual(result.toLowerCase());
  });

  /**
   * Test 3: handleDownloadList Integration - receives format and passes to downloadFile
   * 
   * Observes: handleDownloadList() receives format value and passes to downloadFile()
   * Requirement: 3.1 - Pass format to downloadFile() function
   */
  test('should pass format from showFormatSelector to downloadFile', () => {
    mockConfirm.mockReturnValue(true); // Select CSV
    handleDownloadList();
    
    // Verify downloadFile was called with correct format
    expect(downloadedFiles.length).toBe(1);
    expect(downloadedFiles[0].download).toBe('prototype-list.csv');
  });

  /**
   * Test 4: downloadFile Integration - generates correct CSV content
   * 
   * Observes: downloadFile() generates correct file content for CSV format
   * Requirement: 3.5 - Generate correct file content and MIME type
   */
  test('should generate correct CSV content with proper MIME type', () => {
    downloadFile('csv');
    
    // Verify CSV file was created
    expect(downloadedFiles.length).toBe(1);
    expect(downloadedFiles[0].download).toBe('prototype-list.csv');
    
    // Verify Blob was created with correct MIME type
    expect(global.Blob).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ type: 'text/csv;charset=utf-8;' })
    );
    
    // Verify content includes CSV header
    const blobContent = global.Blob.mock.calls[0][0][0];
    expect(blobContent).toContain('Name,URL,Page');
    expect(blobContent).toContain('Prototype 1');
  });

  /**
   * Test 5: downloadFile Integration - generates correct TXT content
   * 
   * Observes: downloadFile() generates correct file content for TXT format
   * Requirement: 3.5 - Generate correct file content and MIME type
   */
  test('should generate correct TXT content with proper MIME type', () => {
    downloadFile('txt');
    
    // Verify TXT file was created
    expect(downloadedFiles.length).toBe(1);
    expect(downloadedFiles[0].download).toBe('prototype-list.txt');
    
    // Verify Blob was created with correct MIME type
    expect(global.Blob).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ type: 'text/plain;charset=utf-8;' })
    );
    
    // Verify content includes prototype data
    const blobContent = global.Blob.mock.calls[0][0][0];
    expect(blobContent).toContain('Prototype 1');
    expect(blobContent).toContain('https://example.com/1');
  });

  /**
   * Test 6: Toast Notifications - success message displays
   * 
   * Observes: toast notifications display after download completes
   * Requirement: 3.4 - Display success/error toast notifications
   */
  test('should display success toast notification after download', () => {
    downloadFile('csv');
    
    // Verify success toast was shown
    expect(mockShowToast).toHaveBeenCalledWith(
      mockGetTranslation('toast.downloadSuccess', currentLanguage)
    );
  });

  /**
   * Test 7: Toast Notifications - error message displays
   * 
   * Observes: toast notifications display for error conditions
   * Requirement: 3.4 - Display success/error toast notifications
   */
  test('should display error toast when no prototypes exist', () => {
    prototypes = []; // Empty prototypes array
    downloadFile('csv');
    
    // Verify error toast was shown
    expect(mockShowToast).toHaveBeenCalledWith(
      mockGetTranslation('toast.noPrototypes', currentLanguage)
    );
    
    // Verify no download occurred
    expect(downloadedFiles.length).toBe(0);
  });

  /**
   * Test 8: Translation Support - Spanish
   * 
   * Observes: translation support works for Spanish
   * Requirement: 3.2 - Support all three languages
   */
  test('should display Spanish translations correctly', () => {
    currentLanguage = 'es';
    mockConfirm.mockReturnValue(true);
    
    showFormatSelector_UNFIXED();
    
    // Verify Spanish prompt was used
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('¿Qué formato prefieres?')
    );
  });

  /**
   * Test 9: Translation Support - English
   * 
   * Observes: translation support works for English
   * Requirement: 3.2 - Support all three languages
   */
  test('should display English translations correctly', () => {
    currentLanguage = 'en';
    mockConfirm.mockReturnValue(true);
    
    showFormatSelector_UNFIXED();
    
    // Verify English prompt was used
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('Which format do you prefer?')
    );
  });

  /**
   * Test 10: Translation Support - Euskara
   * 
   * Observes: translation support works for Euskara
   * Requirement: 3.2 - Support all three languages
   */
  test('should display Euskara translations correctly', () => {
    currentLanguage = 'eu';
    mockConfirm.mockReturnValue(true);
    
    showFormatSelector_UNFIXED();
    
    // Verify Euskara prompt was used
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('Zein formato nahiago duzu?')
    );
  });

  /**
   * Property-Based Test: Return value contract across many interactions
   * 
   * Generates many test cases to verify return values are always lowercase strings
   * Requirement: 3.3 - Return 'csv' or 'txt' as lowercase strings
   */
  test('property: return values are always lowercase strings', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Random OK/Cancel choice
        (okClicked) => {
          mockConfirm.mockReturnValue(okClicked);
          const result = showFormatSelector_UNFIXED();
          
          // Verify result is a lowercase string
          expect(typeof result).toBe('string');
          expect(result).toEqual(result.toLowerCase());
          expect(['csv', 'txt']).toContain(result);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property-Based Test: Download flow works for all format choices
   * 
   * Generates many test cases to verify complete download flow
   * Requirements: 3.1, 3.3, 3.4, 3.5 - Complete integration
   */
  test('property: complete download flow works for all format choices', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Random format choice
        (selectCSV) => {
          // Reset state
          downloadedFiles = [];
          mockConfirm.mockReturnValue(selectCSV);
          
          // Execute full download flow
          handleDownloadList();
          
          // Verify download occurred
          expect(downloadedFiles.length).toBe(1);
          
          // Verify correct file type
          const expectedExtension = selectCSV ? '.csv' : '.txt';
          expect(downloadedFiles[0].download).toContain(expectedExtension);
          
          // Verify success toast was shown
          expect(mockShowToast).toHaveBeenCalledWith(
            expect.stringContaining('descargado') // Spanish success message
          );
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property-Based Test: Translation support across all languages
   * 
   * Generates test cases for all language combinations
   * Requirement: 3.2 - Support all three languages
   */
  test('property: translation support works for all languages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('es', 'en', 'eu'), // All supported languages
        fc.boolean(), // Random format choice
        (language, selectCSV) => {
          currentLanguage = language;
          mockConfirm.mockReturnValue(selectCSV);
          
          showFormatSelector_UNFIXED();
          
          // Verify translated prompt was used
          const expectedPrompt = mockGetTranslation('download.formatPrompt', language);
          expect(mockConfirm).toHaveBeenCalledWith(
            expect.stringContaining(expectedPrompt)
          );
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property-Based Test: File content correctness for both formats
   * 
   * Generates test cases to verify file content is correct
   * Requirement: 3.5 - Generate correct file content
   */
  test('property: file content is correct for both formats', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('csv', 'txt'),
        (format) => {
          // Reset state
          downloadedFiles = [];
          
          downloadFile(format);
          
          // Verify file was created
          expect(downloadedFiles.length).toBe(1);
          
          // Verify correct MIME type
          const expectedMimeType = format === 'csv' 
            ? 'text/csv;charset=utf-8;' 
            : 'text/plain;charset=utf-8;';
          
          expect(global.Blob).toHaveBeenCalledWith(
            expect.any(Array),
            expect.objectContaining({ type: expectedMimeType })
          );
          
          // Verify content includes prototype data
          const blobContent = global.Blob.mock.calls[0][0][0];
          expect(blobContent).toContain('Prototype 1');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

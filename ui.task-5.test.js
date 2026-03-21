/**
 * Task 5: Add Copy and Download buttons to UI
 * 
 * This test verifies that the Copy and Download buttons are correctly
 * added to the toolbar in ui.html with proper positioning, icons, classes,
 * translation attributes, and event handlers.
 */

const fs = require('fs');
const path = require('path');

describe('Task 5: Copy and Download Button UI Elements', () => {
  let uiHtml;

  beforeAll(() => {
    const uiPath = path.join(__dirname, 'ui.html');
    uiHtml = fs.readFileSync(uiPath, 'utf-8');
  });

  describe('5.1: Copy Button HTML', () => {
    test('Copy button exists with correct ID', () => {
      expect(uiHtml).toMatch(/id="copy-btn"/);
    });

    test('Copy button has correct classes (btn btn-outline)', () => {
      expect(uiHtml).toMatch(/class="btn btn-outline"[^>]*id="copy-btn"/);
    });

    test('Copy button has onclick handler for handleCopyList()', () => {
      expect(uiHtml).toMatch(/onclick="handleCopyList\(\)"/);
    });

    test('Copy button has translation attribute (data-i18n="toolbar.copy")', () => {
      expect(uiHtml).toMatch(/data-i18n="toolbar\.copy"/);
    });

    test('Copy button contains clipboard icon SVG', () => {
      // Check for the clipboard icon path elements
      const copyButtonSection = uiHtml.match(
        /<button[^>]*id="copy-btn"[^>]*>[\s\S]*?<\/button>/
      );
      expect(copyButtonSection).toBeTruthy();
      expect(copyButtonSection[0]).toMatch(/<svg[^>]*viewBox="0 0 12 12"/);
      expect(copyButtonSection[0]).toMatch(/<rect[^>]*x="2"[^>]*y="2"/);
    });

    test('Copy button is positioned between Watcher button and toolbar spacer', () => {
      const watcherIndex = uiHtml.indexOf('id="watcher-btn"');
      const copyIndex = uiHtml.indexOf('id="copy-btn"');
      const spacerIndex = uiHtml.indexOf('class="toolbar-spacer"');
      
      expect(watcherIndex).toBeLessThan(copyIndex);
      expect(copyIndex).toBeLessThan(spacerIndex);
    });
  });

  describe('5.2: Download Button HTML', () => {
    test('Download button exists with correct ID', () => {
      expect(uiHtml).toMatch(/id="download-btn"/);
    });

    test('Download button has correct classes (btn btn-outline)', () => {
      expect(uiHtml).toMatch(/class="btn btn-outline"[^>]*id="download-btn"/);
    });

    test('Download button has onclick handler for handleDownloadList()', () => {
      expect(uiHtml).toMatch(/onclick="handleDownloadList\(\)"/);
    });

    test('Download button has translation attribute (data-i18n="toolbar.download")', () => {
      expect(uiHtml).toMatch(/data-i18n="toolbar\.download"/);
    });

    test('Download button contains download icon SVG', () => {
      // Check for the download icon path elements
      const downloadButtonSection = uiHtml.match(
        /<button[^>]*id="download-btn"[^>]*>[\s\S]*?<\/button>/
      );
      expect(downloadButtonSection).toBeTruthy();
      expect(downloadButtonSection[0]).toMatch(/<svg[^>]*viewBox="0 0 12 12"/);
      expect(downloadButtonSection[0]).toMatch(/M6 1v7/); // Download arrow path
    });

    test('Download button is positioned after Copy button', () => {
      const copyIndex = uiHtml.indexOf('id="copy-btn"');
      const downloadIndex = uiHtml.indexOf('id="download-btn"');
      
      expect(copyIndex).toBeLessThan(downloadIndex);
    });

    test('Download button is positioned before toolbar spacer', () => {
      const downloadIndex = uiHtml.indexOf('id="download-btn"');
      const spacerIndex = uiHtml.indexOf('class="toolbar-spacer"');
      
      expect(downloadIndex).toBeLessThan(spacerIndex);
    });
  });

  describe('Translation Keys', () => {
    test('Spanish translation for toolbar.copy exists', () => {
      expect(uiHtml).toMatch(/'toolbar\.copy':\s*'Copiar'/);
    });

    test('English translation for toolbar.copy exists', () => {
      expect(uiHtml).toMatch(/'toolbar\.copy':\s*'Copy'/);
    });

    test('Euskara translation for toolbar.copy exists', () => {
      expect(uiHtml).toMatch(/'toolbar\.copy':\s*'Kopiatu'/);
    });

    test('Spanish translation for toolbar.download exists', () => {
      expect(uiHtml).toMatch(/'toolbar\.download':\s*'Descargar'/);
    });

    test('English translation for toolbar.download exists', () => {
      expect(uiHtml).toMatch(/'toolbar\.download':\s*'Download'/);
    });

    test('Euskara translation for toolbar.download exists', () => {
      expect(uiHtml).toMatch(/'toolbar\.download':\s*'Deskargatu'/);
    });
  });

  describe('Event Handlers', () => {
    test('handleCopyList function exists', () => {
      expect(uiHtml).toMatch(/function handleCopyList\s*\(\)/);
    });

    test('handleDownloadList function exists', () => {
      expect(uiHtml).toMatch(/function handleDownloadList\s*\(\)/);
    });
  });

  describe('Icon Specifications', () => {
    test('Copy icon matches design specification (12x12px viewBox)', () => {
      const copyButtonSection = uiHtml.match(
        /<button[^>]*id="copy-btn"[^>]*>[\s\S]*?<\/button>/
      );
      expect(copyButtonSection[0]).toMatch(/viewBox="0 0 12 12"/);
    });

    test('Download icon matches design specification (12x12px viewBox)', () => {
      const downloadButtonSection = uiHtml.match(
        /<button[^>]*id="download-btn"[^>]*>[\s\S]*?<\/button>/
      );
      expect(downloadButtonSection[0]).toMatch(/viewBox="0 0 12 12"/);
    });

    test('Copy icon has correct stroke-width (1.2)', () => {
      const copyButtonSection = uiHtml.match(
        /<button[^>]*id="copy-btn"[^>]*>[\s\S]*?<\/button>/
      );
      expect(copyButtonSection[0]).toMatch(/stroke-width="1\.2"/);
    });

    test('Download icon has correct stroke-width (1.2)', () => {
      const downloadButtonSection = uiHtml.match(
        /<button[^>]*id="download-btn"[^>]*>[\s\S]*?<\/button>/
      );
      expect(downloadButtonSection[0]).toMatch(/stroke-width="1\.2"/);
    });
  });
});

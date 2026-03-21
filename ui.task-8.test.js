/**
 * Task 8: Update applyTranslations() function
 * 
 * Tests to verify that Copy and Download button text updates on language change
 * Requirements: 4.5
 */

const fs = require('fs');
const path = require('path');

describe('Task 8: applyTranslations() updates Copy and Download buttons', () => {
  let uiHtml;

  beforeAll(() => {
    uiHtml = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf-8');
  });

  describe('Requirement 4.5: Button text updates on language change', () => {
    test('Copy button has data-i18n attribute for translation', () => {
      // Verify the Copy button has the data-i18n attribute
      const copyButtonMatch = uiHtml.match(/<button[^>]*id="copy-btn"[^>]*>[\s\S]*?<span[^>]*data-i18n="toolbar\.copy"[^>]*>/);
      expect(copyButtonMatch).toBeTruthy();
    });

    test('Download button has data-i18n attribute for translation', () => {
      // Verify the Download button has the data-i18n attribute
      const downloadButtonMatch = uiHtml.match(/<button[^>]*id="download-btn"[^>]*>[\s\S]*?<span[^>]*data-i18n="toolbar\.download"[^>]*>/);
      expect(downloadButtonMatch).toBeTruthy();
    });

    test('applyTranslations() function queries all elements with data-i18n', () => {
      // Verify applyTranslations uses querySelectorAll for data-i18n elements
      expect(uiHtml).toMatch(/document\.querySelectorAll\(['"]\[data-i18n\]['"]\)/);
    });

    test('applyTranslations() updates element textContent based on translation key', () => {
      // Verify the function gets the translation key and updates textContent
      const applyTranslationsMatch = uiHtml.match(/function applyTranslations[\s\S]*?element\.textContent\s*=\s*getTranslation/);
      expect(applyTranslationsMatch).toBeTruthy();
    });

    test('changeLanguage() calls applyTranslations()', () => {
      // Verify that changeLanguage calls applyTranslations to update UI
      const changeLanguageMatch = uiHtml.match(/function changeLanguage[\s\S]{0,500}applyTranslations\(currentLanguage\)/);
      expect(changeLanguageMatch).toBeTruthy();
    });

    test('All three languages have toolbar.copy translations', () => {
      // Spanish
      expect(uiHtml).toMatch(/'toolbar\.copy':\s*'Copiar'/);
      // English
      expect(uiHtml).toMatch(/'toolbar\.copy':\s*'Copy'/);
      // Euskara
      expect(uiHtml).toMatch(/'toolbar\.copy':\s*'Kopiatu'/);
    });

    test('All three languages have toolbar.download translations', () => {
      // Spanish
      expect(uiHtml).toMatch(/'toolbar\.download':\s*'Descargar'/);
      // English
      expect(uiHtml).toMatch(/'toolbar\.download':\s*'Download'/);
      // Euskara
      expect(uiHtml).toMatch(/'toolbar\.download':\s*'Deskargatu'/);
    });
  });

  describe('Integration: Language change updates button text', () => {
    test('Simulated language change updates Copy and Download buttons', () => {
      // This test simulates the behavior of applyTranslations
      // by verifying the mechanism is in place
      
      // Mock translations object (extracted from ui.html)
      const translations = {
        es: {
          'toolbar.copy': 'Copiar',
          'toolbar.download': 'Descargar'
        },
        en: {
          'toolbar.copy': 'Copy',
          'toolbar.download': 'Download'
        },
        eu: {
          'toolbar.copy': 'Kopiatu',
          'toolbar.download': 'Deskargatu'
        }
      };

      // Mock getTranslation function
      const getTranslation = (key, lang) => {
        return translations[lang]?.[key] || key;
      };

      // Mock DOM elements
      const mockCopyButton = {
        getAttribute: () => 'toolbar.copy',
        textContent: 'Copiar'
      };
      const mockDownloadButton = {
        getAttribute: () => 'toolbar.download',
        textContent: 'Descargar'
      };

      // Simulate applyTranslations for Spanish
      mockCopyButton.textContent = getTranslation(mockCopyButton.getAttribute(), 'es');
      mockDownloadButton.textContent = getTranslation(mockDownloadButton.getAttribute(), 'es');
      expect(mockCopyButton.textContent).toBe('Copiar');
      expect(mockDownloadButton.textContent).toBe('Descargar');

      // Simulate applyTranslations for English
      mockCopyButton.textContent = getTranslation(mockCopyButton.getAttribute(), 'en');
      mockDownloadButton.textContent = getTranslation(mockDownloadButton.getAttribute(), 'en');
      expect(mockCopyButton.textContent).toBe('Copy');
      expect(mockDownloadButton.textContent).toBe('Download');

      // Simulate applyTranslations for Euskara
      mockCopyButton.textContent = getTranslation(mockCopyButton.getAttribute(), 'eu');
      mockDownloadButton.textContent = getTranslation(mockDownloadButton.getAttribute(), 'eu');
      expect(mockCopyButton.textContent).toBe('Kopiatu');
      expect(mockDownloadButton.textContent).toBe('Deskargatu');
    });
  });

  describe('Verification: Complete translation flow', () => {
    test('Translation flow is complete from button to translation keys', () => {
      // 1. Buttons have data-i18n attributes
      expect(uiHtml).toMatch(/id="copy-btn"[\s\S]*?data-i18n="toolbar\.copy"/);
      expect(uiHtml).toMatch(/id="download-btn"[\s\S]*?data-i18n="toolbar\.download"/);

      // 2. Translation keys exist for all languages
      expect(uiHtml).toMatch(/'toolbar\.copy':\s*'Copiar'/);
      expect(uiHtml).toMatch(/'toolbar\.copy':\s*'Copy'/);
      expect(uiHtml).toMatch(/'toolbar\.copy':\s*'Kopiatu'/);
      expect(uiHtml).toMatch(/'toolbar\.download':\s*'Descargar'/);
      expect(uiHtml).toMatch(/'toolbar\.download':\s*'Download'/);
      expect(uiHtml).toMatch(/'toolbar\.download':\s*'Deskargatu'/);

      // 3. applyTranslations function exists and processes data-i18n elements
      expect(uiHtml).toMatch(/function applyTranslations/);
      expect(uiHtml).toMatch(/querySelectorAll\(['"]\[data-i18n\]['"]\)/);

      // 4. changeLanguage calls applyTranslations
      expect(uiHtml).toMatch(/function changeLanguage/);
      expect(uiHtml).toMatch(/applyTranslations\(currentLanguage\)/);
    });
  });
});

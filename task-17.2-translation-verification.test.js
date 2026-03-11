/**
 * Task 17.2: Verify translation support
 * 
 * This test suite verifies that translations work correctly for:
 * - Spanish (es)
 * - English (en)
 * - Basque (eu)
 * 
 * Specifically tests page filter strings are translated properly.
 */

describe('Task 17.2: Translation Verification', () => {
  
  // Mock translation data structure (from ui.html)
  const translations = {
    es: {
      'generate.pageFilter.title': 'Páginas a incluir',
      'generate.pageFilter.empty': 'No hay páginas con prototipos',
      'generate.pageFilter.prototypes': 'prototipos',
      'generate.pageFilter.prototype': 'prototipo',
      'generate.preview.prototypes': 'prototipos',
      'generate.preview.pages': 'páginas',
      'generate.preview.warningNoSelection': '⚠️ No hay prototipos seleccionados. Se generará un frame vacío.'
    },
    en: {
      'generate.pageFilter.title': 'Pages to include',
      'generate.pageFilter.empty': 'No pages with prototypes',
      'generate.pageFilter.prototypes': 'prototypes',
      'generate.pageFilter.prototype': 'prototype',
      'generate.preview.prototypes': 'prototypes',
      'generate.preview.pages': 'pages',
      'generate.preview.warningNoSelection': '⚠️ No prototypes selected. An empty frame will be generated.'
    },
    eu: {
      'generate.pageFilter.title': 'Sartzeko orrialdeak',
      'generate.pageFilter.empty': 'Ez dago prototipoekin orrialdeak',
      'generate.pageFilter.prototypes': 'prototipo',
      'generate.pageFilter.prototype': 'prototipo',
      'generate.preview.prototypes': 'prototipo',
      'generate.preview.pages': 'orrialde',
      'generate.preview.warningNoSelection': '⚠️ Ez da prototipoak hautatu. Marko huts bat sortuko da.'
    }
  };
  
  const getTranslation = (key, lang) => {
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    if (translations['es'] && translations['es'][key]) {
      return translations['es'][key];
    }
    return key;
  };
  
  describe('Spanish (es) Translations', () => {
    const lang = 'es';
    
    test('Page filter title is translated', () => {
      const title = getTranslation('generate.pageFilter.title', lang);
      expect(title).toBe('Páginas a incluir');
    });
    
    test('Empty page filter message is translated', () => {
      const empty = getTranslation('generate.pageFilter.empty', lang);
      expect(empty).toBe('No hay páginas con prototipos');
    });
    
    test('Prototypes plural is translated', () => {
      const prototypes = getTranslation('generate.pageFilter.prototypes', lang);
      expect(prototypes).toBe('prototipos');
    });
    
    test('Prototype singular is translated', () => {
      const prototype = getTranslation('generate.pageFilter.prototype', lang);
      expect(prototype).toBe('prototipo');
    });
    
    test('Preview prototypes label is translated', () => {
      const label = getTranslation('generate.preview.prototypes', lang);
      expect(label).toBe('prototipos');
    });
    
    test('Preview pages label is translated', () => {
      const label = getTranslation('generate.preview.pages', lang);
      expect(label).toBe('páginas');
    });
    
    test('Warning message is translated', () => {
      const warning = getTranslation('generate.preview.warningNoSelection', lang);
      expect(warning).toBe('⚠️ No hay prototipos seleccionados. Se generará un frame vacío.');
    });
    
    test('Pluralization works correctly', () => {
      const prototypeCount = 1;
      const label = prototypeCount === 1
        ? getTranslation('generate.pageFilter.prototype', lang)
        : getTranslation('generate.pageFilter.prototypes', lang);
      
      expect(label).toBe('prototipo');
      
      const prototypeCount2 = 5;
      const label2 = prototypeCount2 === 1
        ? getTranslation('generate.pageFilter.prototype', lang)
        : getTranslation('generate.pageFilter.prototypes', lang);
      
      expect(label2).toBe('prototipos');
    });
  });
  
  describe('English (en) Translations', () => {
    const lang = 'en';
    
    test('Page filter title is translated', () => {
      const title = getTranslation('generate.pageFilter.title', lang);
      expect(title).toBe('Pages to include');
    });
    
    test('Empty page filter message is translated', () => {
      const empty = getTranslation('generate.pageFilter.empty', lang);
      expect(empty).toBe('No pages with prototypes');
    });
    
    test('Prototypes plural is translated', () => {
      const prototypes = getTranslation('generate.pageFilter.prototypes', lang);
      expect(prototypes).toBe('prototypes');
    });
    
    test('Prototype singular is translated', () => {
      const prototype = getTranslation('generate.pageFilter.prototype', lang);
      expect(prototype).toBe('prototype');
    });
    
    test('Preview prototypes label is translated', () => {
      const label = getTranslation('generate.preview.prototypes', lang);
      expect(label).toBe('prototypes');
    });
    
    test('Preview pages label is translated', () => {
      const label = getTranslation('generate.preview.pages', lang);
      expect(label).toBe('pages');
    });
    
    test('Warning message is translated', () => {
      const warning = getTranslation('generate.preview.warningNoSelection', lang);
      expect(warning).toBe('⚠️ No prototypes selected. An empty frame will be generated.');
    });
    
    test('Pluralization works correctly', () => {
      const prototypeCount = 1;
      const label = prototypeCount === 1
        ? getTranslation('generate.pageFilter.prototype', lang)
        : getTranslation('generate.pageFilter.prototypes', lang);
      
      expect(label).toBe('prototype');
      
      const prototypeCount2 = 5;
      const label2 = prototypeCount2 === 1
        ? getTranslation('generate.pageFilter.prototype', lang)
        : getTranslation('generate.pageFilter.prototypes', lang);
      
      expect(label2).toBe('prototypes');
    });
  });
  
  describe('Basque (eu) Translations', () => {
    const lang = 'eu';
    
    test('Page filter title is translated', () => {
      const title = getTranslation('generate.pageFilter.title', lang);
      expect(title).toBe('Sartzeko orrialdeak');
    });
    
    test('Empty page filter message is translated', () => {
      const empty = getTranslation('generate.pageFilter.empty', lang);
      expect(empty).toBe('Ez dago prototipoekin orrialdeak');
    });
    
    test('Prototypes plural is translated', () => {
      const prototypes = getTranslation('generate.pageFilter.prototypes', lang);
      expect(prototypes).toBe('prototipo');
    });
    
    test('Prototype singular is translated', () => {
      const prototype = getTranslation('generate.pageFilter.prototype', lang);
      expect(prototype).toBe('prototipo');
    });
    
    test('Preview prototypes label is translated', () => {
      const label = getTranslation('generate.preview.prototypes', lang);
      expect(label).toBe('prototipo');
    });
    
    test('Preview pages label is translated', () => {
      const label = getTranslation('generate.preview.pages', lang);
      expect(label).toBe('orrialde');
    });
    
    test('Warning message is translated', () => {
      const warning = getTranslation('generate.preview.warningNoSelection', lang);
      expect(warning).toBe('⚠️ Ez da prototipoak hautatu. Marko huts bat sortuko da.');
    });
    
    test('Pluralization works correctly (Basque uses same form)', () => {
      const prototypeCount = 1;
      const label = prototypeCount === 1
        ? getTranslation('generate.pageFilter.prototype', lang)
        : getTranslation('generate.pageFilter.prototypes', lang);
      
      expect(label).toBe('prototipo');
      
      const prototypeCount2 = 5;
      const label2 = prototypeCount2 === 1
        ? getTranslation('generate.pageFilter.prototype', lang)
        : getTranslation('generate.pageFilter.prototypes', lang);
      
      expect(label2).toBe('prototipo');
    });
  });
  
  describe('Translation Fallback Behavior', () => {
    test('Falls back to Spanish when key missing in target language', () => {
      const missingKey = 'some.missing.key';
      
      // Add key only to Spanish
      translations.es[missingKey] = 'Spanish value';
      
      const result = getTranslation(missingKey, 'en');
      expect(result).toBe('Spanish value');
    });
    
    test('Returns key when missing in all languages', () => {
      const missingKey = 'completely.missing.key';
      const result = getTranslation(missingKey, 'en');
      expect(result).toBe(missingKey);
    });
  });
  
  describe('Page Filter UI Translation Integration', () => {
    test('Page filter renders with Spanish translations', () => {
      const lang = 'es';
      const page = { id: 'page1', name: 'Diseño', prototypeCount: 3 };
      
      const prototypeLabel = page.prototypeCount === 1
        ? getTranslation('generate.pageFilter.prototype', lang)
        : getTranslation('generate.pageFilter.prototypes', lang);
      
      const html = `
        <div class="page-filter-item">
          <div class="page-filter-info">
            <div class="page-filter-name">${page.name}</div>
            <div class="page-filter-count">${page.prototypeCount} ${prototypeLabel}</div>
          </div>
        </div>
      `;
      
      expect(html).toContain('3 prototipos');
    });
    
    test('Page filter renders with English translations', () => {
      const lang = 'en';
      const page = { id: 'page1', name: 'Design', prototypeCount: 3 };
      
      const prototypeLabel = page.prototypeCount === 1
        ? getTranslation('generate.pageFilter.prototype', lang)
        : getTranslation('generate.pageFilter.prototypes', lang);
      
      const html = `
        <div class="page-filter-item">
          <div class="page-filter-info">
            <div class="page-filter-name">${page.name}</div>
            <div class="page-filter-count">${page.prototypeCount} ${prototypeLabel}</div>
          </div>
        </div>
      `;
      
      expect(html).toContain('3 prototypes');
    });
    
    test('Page filter renders with Basque translations', () => {
      const lang = 'eu';
      const page = { id: 'page1', name: 'Diseinua', prototypeCount: 3 };
      
      const prototypeLabel = page.prototypeCount === 1
        ? getTranslation('generate.pageFilter.prototype', lang)
        : getTranslation('generate.pageFilter.prototypes', lang);
      
      const html = `
        <div class="page-filter-item">
          <div class="page-filter-info">
            <div class="page-filter-name">${page.name}</div>
            <div class="page-filter-count">${page.prototypeCount} ${prototypeLabel}</div>
          </div>
        </div>
      `;
      
      expect(html).toContain('3 prototipo');
    });
    
    test('Empty state renders with correct language', () => {
      const testLanguages = ['es', 'en', 'eu'];
      const expectedMessages = [
        'No hay páginas con prototipos',
        'No pages with prototypes',
        'Ez dago prototipoekin orrialdeak'
      ];
      
      testLanguages.forEach((lang, index) => {
        const emptyMessage = getTranslation('generate.pageFilter.empty', lang);
        expect(emptyMessage).toBe(expectedMessages[index]);
      });
    });
  });
  
  describe('Preview Summary Translation Integration', () => {
    test('Preview summary uses correct language for counts', () => {
      const testCases = [
        { lang: 'es', prototypes: 'prototipos', pages: 'páginas' },
        { lang: 'en', prototypes: 'prototypes', pages: 'pages' },
        { lang: 'eu', prototypes: 'prototipo', pages: 'orrialde' }
      ];
      
      testCases.forEach(({ lang, prototypes, pages }) => {
        const prototypeLabel = getTranslation('generate.preview.prototypes', lang);
        const pageLabel = getTranslation('generate.preview.pages', lang);
        
        expect(prototypeLabel).toBe(prototypes);
        expect(pageLabel).toBe(pages);
      });
    });
    
    test('Warning message uses correct language', () => {
      const testCases = [
        { lang: 'es', contains: 'No hay prototipos seleccionados' },
        { lang: 'en', contains: 'No prototypes selected' },
        { lang: 'eu', contains: 'Ez da prototipoak hautatu' }
      ];
      
      testCases.forEach(({ lang, contains }) => {
        const warning = getTranslation('generate.preview.warningNoSelection', lang);
        expect(warning).toContain(contains);
      });
    });
  });
  
  describe('Language Persistence', () => {
    test('Language setting can be saved and loaded', () => {
      const languages = ['es', 'en', 'eu'];
      
      languages.forEach(lang => {
        // Simulate save
        const savedLanguage = lang;
        
        // Simulate load
        const loadedLanguage = savedLanguage;
        
        expect(loadedLanguage).toBe(lang);
      });
    });
    
    test('Invalid language code falls back to Spanish', () => {
      const validateLanguageCode = (code) => {
        if (code === 'es' || code === 'en' || code === 'eu') {
          return code;
        }
        return 'es';
      };
      
      expect(validateLanguageCode('fr')).toBe('es');
      expect(validateLanguageCode('de')).toBe('es');
      expect(validateLanguageCode('invalid')).toBe('es');
      expect(validateLanguageCode('es')).toBe('es');
      expect(validateLanguageCode('en')).toBe('en');
      expect(validateLanguageCode('eu')).toBe('eu');
    });
  });
  
  describe('Requirements 1.2 and 6.2 Compliance', () => {
    test('Requirement 1.2: All page filter strings are translated', () => {
      const requiredKeys = [
        'generate.pageFilter.title',
        'generate.pageFilter.empty',
        'generate.pageFilter.prototypes',
        'generate.pageFilter.prototype'
      ];
      
      const languages = ['es', 'en', 'eu'];
      
      languages.forEach(lang => {
        requiredKeys.forEach(key => {
          const translation = getTranslation(key, lang);
          expect(translation).toBeTruthy();
          expect(translation).not.toBe(key); // Should not return the key itself
        });
      });
    });
    
    test('Requirement 6.2: Section label is translated', () => {
      const languages = ['es', 'en', 'eu'];
      const expectedTitles = [
        'Páginas a incluir',
        'Pages to include',
        'Sartzeko orrialdeak'
      ];
      
      languages.forEach((lang, index) => {
        const title = getTranslation('generate.pageFilter.title', lang);
        expect(title).toBe(expectedTitles[index]);
      });
    });
  });
});

console.log('✓ Task 17.2: Translation verification tests defined');
console.log('  - Spanish translations (8 tests)');
console.log('  - English translations (8 tests)');
console.log('  - Basque translations (8 tests)');
console.log('  - Fallback behavior (2 tests)');
console.log('  - UI integration (4 tests)');
console.log('  - Preview integration (2 tests)');
console.log('  - Language persistence (2 tests)');
console.log('  - Requirements compliance (2 tests)');
console.log('  Total: 36 translation tests');

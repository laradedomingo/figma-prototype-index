/**
 * Unit tests for core formatting functions
 * Tests formatPrototypeList() and formatPrototypeListCSV()
 */

// Mock data for testing
const mockPrototypes = [
  {
    id: '1',
    flowName: 'Home Page',
    name: 'Home Frame',
    prototypeUrl: 'https://www.figma.com/proto/abc123',
    pageId: 'page1',
    pageName: 'Design System'
  },
  {
    id: '2',
    flowName: 'About Page',
    name: 'About Frame',
    prototypeUrl: null, // Local file
    pageId: 'page1',
    pageName: 'Design System'
  },
  {
    id: '3',
    flowName: 'Contact, Form',
    name: 'Contact Frame',
    prototypeUrl: 'https://www.figma.com/proto/def456',
    pageId: 'page2',
    pageName: 'Marketing'
  },
  {
    id: '4',
    flowName: 'Product "Special" Page',
    name: 'Product Frame',
    prototypeUrl: 'https://www.figma.com/proto/ghi789',
    pageId: 'page2',
    pageName: 'Marketing'
  }
];

// Mock global state
let prototypes = [];
let pageSelections = {};
let sortAZ = true;

// Helper function to group by page (from ui.html)
function groupByPage(items) {
  const g = {};
  for (const p of items) {
    if (!g[p.pageName]) g[p.pageName] = [];
    g[p.pageName].push(p);
  }
  return g;
}

// Core formatting functions (from ui.html)
function formatPrototypeList(options = {}) {
  const { includePageHeaders = false } = options;
  
  const filteredPrototypes = prototypes.filter(proto => {
    if (Object.keys(pageSelections).length === 0) {
      return true;
    }
    return pageSelections[proto.pageId] === true;
  });
  
  const sortedPrototypes = [...filteredPrototypes].sort((a, b) =>
    sortAZ ? a.flowName.localeCompare(b.flowName) : b.flowName.localeCompare(a.flowName)
  );
  
  if (!includePageHeaders) {
    return sortedPrototypes.map(proto => {
      const url = proto.prototypeUrl || 'Local file - save to cloud to get URL';
      return `${proto.flowName}: ${url}`;
    }).join('\n');
  }
  
  const pageGroups = groupByPage(sortedPrototypes);
  const pageNames = Object.keys(pageGroups);
  
  const sections = pageNames.map(pageName => {
    const items = pageGroups[pageName];
    const header = `Page: ${pageName}`;
    const lines = items.map(proto => {
      const url = proto.prototypeUrl || 'Local file - save to cloud to get URL';
      return `${proto.flowName}: ${url}`;
    });
    return header + '\n\n' + lines.join('\n');
  });
  
  return sections.join('\n\n');
}

function formatPrototypeListCSV() {
  const filteredPrototypes = prototypes.filter(proto => {
    if (Object.keys(pageSelections).length === 0) {
      return true;
    }
    return pageSelections[proto.pageId] === true;
  });
  
  const sortedPrototypes = [...filteredPrototypes].sort((a, b) =>
    sortAZ ? a.flowName.localeCompare(b.flowName) : b.flowName.localeCompare(a.flowName)
  );
  
  let csv = 'Name,URL\n';
  
  sortedPrototypes.forEach(proto => {
    const name = escapeCSVField(proto.flowName);
    const url = proto.prototypeUrl || 'Local file - save to cloud to get URL';
    const escapedUrl = escapeCSVField(url);
    csv += `${name},${escapedUrl}\n`;
  });
  
  return csv;
}

function escapeCSVField(field) {
  if (!field) return '""';
  
  const needsEscaping = /[",\n\r]/.test(field);
  
  if (needsEscaping) {
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return `"${field}"`;
}

describe('Core Formatting Functions', () => {
  beforeEach(() => {
    // Reset state before each test
    prototypes = [];
    pageSelections = {};
    sortAZ = true;
  });

  describe('formatPrototypeList', () => {
    test('formats plain text without page headers (A-Z)', () => {
      prototypes = mockPrototypes;
      pageSelections = {};
      sortAZ = true;
      
      const result = formatPrototypeList({ includePageHeaders: false });
      
      expect(result).toContain('About Page: Local file - save to cloud to get URL');
      expect(result).toContain('Home Page: https://www.figma.com/proto/abc123');
      expect(result.split('\n')).toHaveLength(4);
    });

    test('formats plain text with page headers (A-Z)', () => {
      prototypes = mockPrototypes;
      pageSelections = {};
      sortAZ = true;
      
      const result = formatPrototypeList({ includePageHeaders: true });
      
      expect(result).toContain('Page: Design System');
      expect(result).toContain('Page: Marketing');
      expect(result).toContain('\n\n'); // Blank line between sections
    });

    test('formats plain text with Z-A sort', () => {
      prototypes = mockPrototypes;
      pageSelections = {};
      sortAZ = false;
      
      const result = formatPrototypeList({ includePageHeaders: false });
      const lines = result.split('\n');
      
      expect(lines[0]).toContain('Product "Special" Page');
      expect(lines[lines.length - 1]).toContain('About Page');
    });

    test('respects page filter', () => {
      prototypes = mockPrototypes;
      pageSelections = { page1: true, page2: false };
      sortAZ = true;
      
      const result = formatPrototypeList({ includePageHeaders: false });
      
      expect(result).toContain('Home Page');
      expect(result).toContain('About Page');
      expect(result).not.toContain('Contact, Form');
      expect(result).not.toContain('Product "Special" Page');
    });

    test('returns empty string for empty prototype list', () => {
      prototypes = [];
      pageSelections = {};
      
      const result = formatPrototypeList({ includePageHeaders: false });
      
      expect(result).toBe('');
    });
  });

  describe('formatPrototypeListCSV', () => {
    test('formats CSV with all prototypes (A-Z)', () => {
      prototypes = mockPrototypes;
      pageSelections = {};
      sortAZ = true;
      
      const result = formatPrototypeListCSV();
      
      expect(result).toContain('Name,URL');
      expect(result).toContain('"About Page","Local file - save to cloud to get URL"');
      expect(result).toContain('"Home Page","https://www.figma.com/proto/abc123"');
    });

    test('respects page filter', () => {
      prototypes = mockPrototypes;
      pageSelections = { page1: false, page2: true };
      sortAZ = true;
      
      const result = formatPrototypeListCSV();
      
      expect(result).toContain('Contact, Form');
      // CSV escapes quotes by doubling them
      expect(result).toContain('Product ""Special"" Page');
      expect(result).not.toContain('Home Page');
      expect(result).not.toContain('About Page');
    });

    test('properly escapes CSV fields', () => {
      prototypes = mockPrototypes;
      pageSelections = {};
      sortAZ = true;
      
      const result = formatPrototypeListCSV();
      
      // Check comma escaping
      expect(result).toContain('"Contact, Form"');
      
      // Check quote escaping
      expect(result).toContain('"Product ""Special"" Page"');
    });
  });

  describe('escapeCSVField', () => {
    test('escapes commas', () => {
      const result = escapeCSVField('Test, with comma');
      expect(result).toBe('"Test, with comma"');
    });

    test('escapes quotes', () => {
      const result = escapeCSVField('Test "with" quotes');
      expect(result).toBe('"Test ""with"" quotes"');
    });

    test('wraps simple text in quotes', () => {
      const result = escapeCSVField('Simple text');
      expect(result).toBe('"Simple text"');
    });

    test('handles empty string', () => {
      const result = escapeCSVField('');
      expect(result).toBe('""');
    });

    test('handles null', () => {
      const result = escapeCSVField(null);
      expect(result).toBe('""');
    });
  });
});

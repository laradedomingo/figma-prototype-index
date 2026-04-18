/**
 * Bug Condition Exploration Tests for Prototype URL Display
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.3**
 *
 * These tests encode the EXPECTED (fixed) behavior: prototypeUrl should be a
 * non-null string even when figma.fileKey is falsy.
 *
 * On UNFIXED code the ternary is:
 *   var prototypeUrl = fileKey ? "https://..." : null;
 *
 * So these assertions WILL FAIL on unfixed code — that is the expected outcome
 * for this exploratory task and confirms the bug exists.
 */

'use strict';

// ---------------------------------------------------------------------------
// Helper: build prototypeUrl exactly as getAllPrototypes() does in code.js
// This mirrors the buggy ternary so we can test it in isolation.
// ---------------------------------------------------------------------------
function buildPrototypeUrl(fileKey, flowName, nodeId, pageId) {
  const nodeIdEncoded = encodeURIComponent(nodeId);
  const pageIdEncoded = encodeURIComponent(pageId);

  // ← This is the BUGGY ternary from code.js (unfixed)
  var prototypeUrl = fileKey
    ? 'https://www.figma.com/proto/' +
      fileKey +
      '/' +
      encodeURIComponent(flowName) +
      '?node-id=' +
      nodeIdEncoded +
      '&page-id=' +
      pageIdEncoded +
      '&starting-point-node-id=' +
      nodeIdEncoded
    : null; // ← bug: null instead of an alternative URL

  return prototypeUrl;
}

// ---------------------------------------------------------------------------
// Helper: simulate getAllPrototypes() for a given figma mock
// Returns the array of prototype objects (only prototypeUrl is relevant here).
// ---------------------------------------------------------------------------
function simulateGetAllPrototypes(figmaMock) {
  const allPrototypes = [];

  for (const page of figmaMock.root.children) {
    if (page.name === '📋 Prototype Index') continue;
    const flows = page.flowStartingPoints;
    if (!flows || flows.length === 0) continue;

    for (const flow of flows) {
      const node = figmaMock.getNodeById(flow.nodeId);
      if (!node) continue;

      const flowName = flow.name || node.name;
      const fileKey = figmaMock.fileKey;
      const prototypeUrl = buildPrototypeUrl(fileKey, flowName, node.id, page.id);

      allPrototypes.push({
        id: node.id,
        name: node.name,
        flowName: flowName,
        pageName: page.name,
        pageId: page.id,
        prototypeUrl: prototypeUrl,
      });
    }
  }

  return allPrototypes;
}

// ---------------------------------------------------------------------------
// Shared node registry used by getNodeById mocks
// ---------------------------------------------------------------------------
const nodeRegistry = {
  'node-1': { id: 'node-1', name: 'Home Screen', type: 'FRAME', width: 375, height: 812 },
  'node-2': { id: 'node-2', name: 'Login Screen', type: 'FRAME', width: 375, height: 812 },
  'node-3': { id: 'node-3', name: 'Dashboard', type: 'FRAME', width: 1440, height: 900 },
};

// ---------------------------------------------------------------------------
// Task 1.2 — null fileKey + single flow → prototypeUrl is null (confirms bug)
// ---------------------------------------------------------------------------
describe('Bug Condition 1.2: null fileKey + single flow', () => {
  test('prototypeUrl should NOT be null when fileKey is null (asserts desired behavior)', () => {
    const figmaMock = {
      fileKey: null, // ← bug condition
      root: {
        children: [
          {
            name: 'Page 1',
            id: 'page-1',
            flowStartingPoints: [{ name: 'Onboarding Flow', nodeId: 'node-1' }],
          },
        ],
      },
      getNodeById: (id) => nodeRegistry[id] || null,
    };

    const prototypes = simulateGetAllPrototypes(figmaMock);

    // There should be exactly one prototype
    expect(prototypes).toHaveLength(1);

    // DESIRED behavior: prototypeUrl must be a non-null string
    // This assertion FAILS on unfixed code (prototypeUrl is null) — confirms the bug
    expect(prototypes[0].prototypeUrl).not.toBeNull();
    expect(typeof prototypes[0].prototypeUrl).toBe('string');
    expect(prototypes[0].prototypeUrl.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Task 1.3 — undefined fileKey + multiple flows → all prototypeUrl values are null
// ---------------------------------------------------------------------------
describe('Bug Condition 1.3: undefined fileKey + multiple flows', () => {
  test('all prototypeUrl values should NOT be null when fileKey is undefined (asserts desired behavior)', () => {
    const figmaMock = {
      fileKey: undefined, // ← bug condition
      root: {
        children: [
          {
            name: 'Page 1',
            id: 'page-1',
            flowStartingPoints: [
              { name: 'Flow A', nodeId: 'node-1' },
              { name: 'Flow B', nodeId: 'node-2' },
              { name: 'Flow C', nodeId: 'node-3' },
            ],
          },
        ],
      },
      getNodeById: (id) => nodeRegistry[id] || null,
    };

    const prototypes = simulateGetAllPrototypes(figmaMock);

    // There should be three prototypes
    expect(prototypes).toHaveLength(3);

    // DESIRED behavior: every prototypeUrl must be a non-null string
    // These assertions FAIL on unfixed code — confirms the bug for all flows
    for (const proto of prototypes) {
      expect(proto.prototypeUrl).not.toBeNull();
      expect(typeof proto.prototypeUrl).toBe('string');
      expect(proto.prototypeUrl.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Task 1.4 — empty string fileKey → prototypeUrl is null (falsy empty string)
// ---------------------------------------------------------------------------
describe('Bug Condition 1.4: empty string fileKey', () => {
  test('prototypeUrl should NOT be null when fileKey is empty string (asserts desired behavior)', () => {
    const figmaMock = {
      fileKey: '', // ← bug condition: falsy empty string
      root: {
        children: [
          {
            name: 'Page 1',
            id: 'page-1',
            flowStartingPoints: [{ name: 'Main Flow', nodeId: 'node-1' }],
          },
        ],
      },
      getNodeById: (id) => nodeRegistry[id] || null,
    };

    const prototypes = simulateGetAllPrototypes(figmaMock);

    expect(prototypes).toHaveLength(1);

    // DESIRED behavior: prototypeUrl must be a non-null string even for empty fileKey
    // This assertion FAILS on unfixed code — confirms the bug for the falsy "" case
    expect(prototypes[0].prototypeUrl).not.toBeNull();
    expect(typeof prototypes[0].prototypeUrl).toBe('string');
    expect(prototypes[0].prototypeUrl.length).toBeGreaterThan(0);
  });
});

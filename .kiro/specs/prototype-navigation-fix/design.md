# Prototype Navigation Fix - Bugfix Design

## Overview

The Figma plugin generates an index of prototype starting points with clickable cards, but clicking these cards does nothing because they use OPEN_URL reactions which don't trigger navigation within Figma. The fix involves changing the reaction type from OPEN_URL to NAVIGATE, using Figma's native navigation action to properly navigate to prototype frames when users click on cards in the generated index frame. This approach leverages Figma's built-in NAVIGATE action type which works for same-document navigation in both desktop and web versions.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when cards are generated with OPEN_URL reactions instead of NAVIGATE actions
- **Property (P)**: The desired behavior when cards are clicked - navigation to the prototype's starting point within Figma
- **Preservation**: Existing UI panel navigation, URL display, card styling, and prototype detection that must remain unchanged
- **makeCard()**: The function in `code.js` (line 229) that generates individual prototype card frames with interactive reactions
- **OPEN_URL reaction**: The current (broken) approach that attempts to open URLs but doesn't work for in-document navigation
- **NAVIGATE action**: Figma's native action type for navigating to nodes within the same document
- **NAVIGATE_TO message handler**: The existing message handler in `code.js` (line 619) that successfully navigates from the UI panel
- **prototypeUrl**: The external URL property on prototype objects used for sharing prototypes outside Figma
- **nodeId**: The unique identifier for Figma nodes used by the NAVIGATE action to target specific frames

## Bug Details

### Bug Condition

The bug manifests when a user clicks on a prototype card in the generated "Prototype Index" frame. The `makeCard()` function creates cards with OPEN_URL reactions that point to external prototype URLs, but these reactions don't trigger any navigation action within Figma's canvas environment (both desktop and web versions).

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ClickEvent on a card frame
  OUTPUT: boolean
  
  RETURN input.target.type == "FRAME"
         AND input.target.parent.name == "Prototype Index"
         AND input.target.reactions[0].actions[0].type == "URL"
         AND NOT navigationOccurred(input.target)
END FUNCTION
```

### Examples

- **Grid Layout Card Click**: User clicks on card #03 in grid layout → Nothing happens, viewport doesn't move, no frame is selected
- **List Layout Card Click**: User clicks on card #01 in list layout → Nothing happens, no navigation to the prototype starting point
- **Cross-Page Navigation**: User clicks on a card for a prototype on "Page 2" while viewing "Prototype Index" → No page switch occurs, no navigation happens
- **Same-Page Navigation**: User clicks on a card for a prototype on the same page as the index → Still no navigation (OPEN_URL doesn't work even for same-page targets)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- UI panel list view navigation must continue to work using the NAVIGATE_TO message handler
- External prototype URL links in the UI panel must continue to open in new browser tabs
- Card visual appearance (thumbnails, labels, styling, layout) must remain identical
- Prototype detection and scanning across all pages must continue to work correctly
- Card metadata display (size, reaction count, page name, URLs) must remain accurate

**Scope:**
All inputs that do NOT involve clicking on cards in the generated "Prototype Index" frame should be completely unaffected by this fix. This includes:
- Clicks on prototype links in the UI panel
- Clicks on "Open URL" buttons in the UI panel
- Manual navigation using Figma's native tools
- Any other plugin functionality (scanning, watching, generating thumbnails)

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Wrong Reaction Type**: The `makeCard()` function uses OPEN_URL reactions (line 341-346) which are designed for external links, not in-document navigation
   - OPEN_URL reactions expect to open URLs in browsers/new tabs
   - Figma doesn't interpret OPEN_URL as a navigation command within the canvas

2. **Misunderstanding of Figma's Reaction System**: The code comment (line 337-339) suggests the developer believed OPEN_URL was the correct approach for prototype navigation
   - The comment mentions "official format per Figma plugin docs" but this applies to external URLs only
   - The NAVIGATE action type exists specifically for in-document navigation

3. **Incorrect Action Structure**: The reaction uses `{ "type": "URL", "url": proto.prototypeUrl }` instead of `{ "type": "NAVIGATE", "destinationId": proto.nodeId }`
   - The URL property points to an external sharing URL, not a node reference
   - The NAVIGATE action requires a destinationId (node ID) instead of a URL

4. **Missing Node ID Reference**: The prototype objects may not have the nodeId property readily available for use in NAVIGATE actions
   - The code uses `proto.prototypeUrl` but needs `proto.nodeId` for NAVIGATE actions

## Correctness Properties

Property 1: Bug Condition - Card Click Navigation

_For any_ click event on a prototype card in the generated "Prototype Index" frame where the card has a valid prototype node ID, the fixed makeCard function SHALL create a NAVIGATE action that causes Figma to navigate to that prototype's starting point, scrolling the viewport to the frame, switching to the correct page if necessary, and selecting the frame.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Card Interaction Behavior

_For any_ user interaction that is NOT a click on a card in the generated "Prototype Index" frame (UI panel clicks, external URL opens, manual navigation, prototype scanning), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for UI panel navigation, URL display, card styling, and prototype detection.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `code.js`

**Function**: `makeCard()` (line 229)

**Specific Changes**:
1. **Change Reaction Type**: Replace OPEN_URL reaction with NAVIGATE action
   - Remove: `{ "type": "URL", "url": proto.prototypeUrl, "openInNewTab": true }`
   - Add: `{ "type": "NAVIGATE", "destinationId": proto.nodeId }`

2. **Update Reaction Structure**: Modify the setReactionsAsync call to use NAVIGATE action format
   - Change from URL-based action to node-ID-based action
   - Remove the `openInNewTab` property (not applicable to NAVIGATE)

3. **Ensure Node ID Availability**: Verify that `proto.nodeId` is available in the prototype object
   - The prototype objects are created from frame nodes, so `proto.id` should contain the node ID
   - May need to use `proto.id` instead of `proto.nodeId` depending on object structure

4. **Remove Obsolete Comment**: Update or remove the comment about "OPEN_URL reaction (official format per Figma plugin docs)"
   - Replace with accurate comment about NAVIGATE action for in-document navigation

5. **Conditional Logic**: Keep the conditional check for prototype existence
   - Change condition from `if (proto.prototypeUrl)` to `if (proto.id)` or similar
   - Ensure we only add reactions when we have a valid destination node ID

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate clicking on generated prototype cards and assert that navigation occurs (viewport scrolls, page switches, frame is selected). Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Grid Layout Card Click Test**: Generate index with grid layout, simulate clicking card #1 → will fail on unfixed code (no navigation occurs)
2. **List Layout Card Click Test**: Generate index with list layout, simulate clicking card #2 → will fail on unfixed code (no navigation occurs)
3. **Cross-Page Navigation Test**: Click card for prototype on different page → will fail on unfixed code (no page switch or navigation)
4. **Same-Page Navigation Test**: Click card for prototype on same page as index → will fail on unfixed code (even same-page navigation doesn't work with OPEN_URL)

**Expected Counterexamples**:
- Card clicks produce no navigation action (viewport doesn't move, no frame selection)
- Possible causes: OPEN_URL reactions don't trigger in-document navigation, wrong action type, missing node ID reference

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL cardClick WHERE isBugCondition(cardClick) DO
  result := handleCardClick_fixed(cardClick)
  ASSERT navigationOccurred(result)
  ASSERT viewportScrolledToFrame(result)
  ASSERT frameIsSelected(result)
  ASSERT correctPageIsActive(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL interaction WHERE NOT isBugCondition(interaction) DO
  ASSERT handleInteraction_original(interaction) = handleInteraction_fixed(interaction)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for UI panel interactions, URL displays, and card styling, then write property-based tests capturing that behavior.

**Test Cases**:
1. **UI Panel Navigation Preservation**: Observe that clicking prototype items in UI panel navigates correctly on unfixed code, then verify this continues after fix
2. **URL Display Preservation**: Observe that URL text displays correctly on cards on unfixed code, then verify this continues after fix
3. **Card Styling Preservation**: Observe that card visual appearance (thumbnails, labels, colors, layout) renders correctly on unfixed code, then verify this continues after fix
4. **Prototype Detection Preservation**: Observe that prototype scanning finds all flow starting points on unfixed code, then verify this continues after fix

### Unit Tests

- Test NAVIGATE action creation with valid node IDs
- Test card generation with different prototype configurations (with/without URLs, different pages)
- Test that NAVIGATE actions target the correct destination node IDs
- Test edge cases (missing node ID, invalid node reference)

### Property-Based Tests

- Generate random sets of prototypes and verify all generated cards have functional NAVIGATE actions
- Generate random card configurations and verify preservation of visual styling and metadata display
- Test across many prototype scenarios (different pages, different sizes, different flow names)

### Integration Tests

- Test full workflow: scan prototypes → generate index → click card → verify navigation
- Test navigation across different pages (index on one page, prototype on another)
- Test that viewport scrolls and zooms to show the target frame
- Test that the target frame is selected after navigation
- Test in both grid and list layout modes
